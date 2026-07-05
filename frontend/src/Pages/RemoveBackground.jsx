import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import DashboardNav from "./Elements/DashboardNav";
import UploadDropzone from "./Elements/UploadDropzone";
import BgOptionPicker from "./Elements/BgOptionPicker";
import CompareSlider from "./Elements/CompareSlider";
import LoadingBar from "./Elements/LoadingBar";
import {
  compositeBackground,
  fileToDataUrl,
  toThumbnail,
} from "../utils/bgRemoval";
import { removeBackground } from "../api/bg";
import { createHistoryItem } from "../api/history";
import { useAuth } from "../AuthContext";
import DashboardBg from "../assets/dashboard-bg.png";

const FORMATS = [
  { id: "png", label: "PNG" },
  { id: "jpg", label: "JPG" },
  { id: "webp", label: "WEBP" },
];

function formatCountdown(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function msUntilMidnightUTC() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
  return next - now.getTime();
}

const RemoveBackground = () => {
  const { profile, refreshProfile } = useAuth();
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [cutout, setCutout] = useState(null); // { dataUrl, width, height }
  const [resultUrl, setResultUrl] = useState(null);
  const [bgOption, setBgOption] = useState({ type: "transparent", color: "#2F5FA8", imageDataUrl: null });
  const [format, setFormat] = useState("png");
  const [processing, setProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [usage, setUsage] = useState(profile?.usage || { count: 0, limit: 10, remaining: 10, unlimited: false });
  const savedForCutout = useRef(null);

  useEffect(() => {
    if (profile?.usage) setUsage(profile.usage);
  }, [profile]);

  const remaining = usage.unlimited ? Infinity : usage.remaining ?? 0;
  const limit = usage.unlimited ? null : usage.limit ?? 10;

  const handleFile = async (newFile, error) => {
    if (error) {
      toast.error(error);
      return;
    }
    setFile(newFile);
    setCutout(null);
    setResultUrl(null);
    savedForCutout.current = null;
    const dataUrl = await fileToDataUrl(newFile);
    setOriginalUrl(dataUrl);
  };

  const handleRemove = async () => {
    if (!file) return;
    if (!usage.unlimited && remaining <= 0) {
      toast.error("Daily limit reached. Resets at midnight UTC.");
      return;
    }
    setProcessing(true);
    setProgressLabel("Uploading image...");
    try {
      setProgressLabel("AI removing background...");
      const { image, usage: updatedUsage } = await removeBackground(file);
      const cutoutResult = { dataUrl: image };
      setCutout(cutoutResult);
      setUsage(updatedUsage);
      setProgressLabel("Finishing up...");

      const composited = await compositeBackground(cutoutResult.dataUrl, {
        ...bgOption,
        format,
      });
      setResultUrl(composited);

      const [resultThumb, bgImageThumb] = await Promise.all([
        toThumbnail(composited, 480),
        bgOption.type === "image" && bgOption.imageDataUrl ? toThumbnail(bgOption.imageDataUrl, 200) : Promise.resolve(null),
      ]);

      const baseName = file.name.replace(/\.[^/.]+$/, "") || "image";
      try {
        await createHistoryItem({
          filename: `${baseName}-nobg.${format}`,
          format,
          bgType: bgOption.type,
          bgColor: bgOption.color,
          resultFull: composited,
          bgImageThumb,
        });
      } catch (historyErr) {
        // Non-fatal — the user's cutout still worked and is downloadable.
        console.error("Failed to save history:", historyErr);
        toast.warn("Background removed, but saving to history failed.");
      }

      refreshProfile();
      savedForCutout.current = { bgOption, format };
      toast.success("Background removed!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong processing that image. Try another.");
    } finally {
      setProcessing(false);
      setProgressLabel("");
    }
  };

  // Instantly recomposite when the background option or format changes, without
  // re-calling the API or counting against the daily quota.
  useEffect(() => {
    if (!cutout) return;
    (async () => {
      try {
        const composited = await compositeBackground(cutout.dataUrl, {
          ...bgOption,
          format,
        });
        setResultUrl(composited);
      } catch (err) {
        console.error(err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgOption.type, bgOption.color, bgOption.imageDataUrl, format]);

  const reset = () => {
    setFile(null);
    setOriginalUrl(null);
    setCutout(null);
    setResultUrl(null);
  };

  const downloadName = file
    ? `${file.name.replace(/\.[^/.]+$/, "")}-nobg.${format}`
    : `feather.${format}`;

  const usagePercent = usage.unlimited ? 100 : Math.min(100, (usage.count / (limit || 10)) * 100);

  return (
    <div className="min-h-screen relative isolate overflow-hidden bg-[#F3F4F6] font-sans text-slate-800">
      {/* Background wash + soft color blobs, matching the Dashboard/landing visual language */}
      <div
        className="absolute inset-x-0 top-0 z-[-2] blur-md saturate-75 pointer-events-none"
        style={{
          backgroundImage: `url(${DashboardBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          height: "50vh",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      ></div>
      <div className="absolute top-24 -left-20 w-80 h-80 bg-blue-200/40 blur-3xl rounded-full pointer-events-none z-[-1]"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/30 blur-3xl translate-x-1/3 translate-y-1/3 rounded-full pointer-events-none z-[-1]"></div>

      <DashboardNav />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-[1fr_auto] md:items-stretch gap-4 mb-8">
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-brice font-heading font-black text-[#2F5FA8] leading-tight">
              <span className="block">Remove</span>
              <span className="block">Background</span>
            </h1>
            <p className="text-slate-500 font-manrope mt-2">
              Upload an image, pick a background, download instantly.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#EDEEF1] px-5 py-4 min-w-[220px] shadow-[0px_4px_0px_#EDEEF1] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#657692]">
                Today's usage
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#E8F1FF] text-[#2F5FA8] flex items-center justify-center shrink-0">
                <i className="fa-solid fa-bolt text-[11px]"></i>
              </div>
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xl font-brice font-black text-[#2F5FA8]">
                {usage.unlimited ? (
                  <>
                    {usage.count}
                    <span className="text-sm text-slate-400 font-manrope font-normal">/&infin;</span>
                  </>
                ) : (
                  <>
                    {usage.count}
                    <span className="text-sm text-slate-400 font-manrope font-normal">/{limit}</span>
                  </>
                )}
              </span>
            </div>
            {!usage.unlimited && (
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2F5FA8] rounded-full transition-all"
                  style={{ width: `${usagePercent}%` }}
                ></div>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5">
              {usage.unlimited ? "Pro — unlimited images" : `Resets in ${formatCountdown(msUntilMidnightUTC())}`}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-stretch">
          {/* Left: preview */}
          <div className="lg:col-span-3">
            {!originalUrl ? (
              <UploadDropzone onFile={handleFile} />
            ) : (
              <div className="bg-white rounded-3xl border border-[#EDEEF1] p-4">
                {resultUrl ? (
                  <CompareSlider
                    className="h-[420px]"
                    before={
                      <img src={originalUrl} alt="original" className="w-full h-full object-contain" />
                    }
                    after={
                      <img src={resultUrl} alt="result" className="w-full h-full object-contain" />
                    }
                  />
                ) : (
                  <div className="h-[420px] rounded-2xl bg-[#F9FAFB] flex items-center justify-center overflow-hidden relative">
                    <img src={originalUrl} alt="preview" className="max-h-full max-w-full object-contain" />
                    {processing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-[#E8F1FF] border-t-[#2F5FA8] animate-spin"></div>
                        <p className="text-[#2F5FA8] font-manrope font-semibold text-sm">
                          {progressLabel}
                        </p>
                        <LoadingBar />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 px-1">
                  <button
                    onClick={reset}
                    className="text-sm font-manrope font-medium text-slate-500 hover:text-[#2F5FA8] cursor-pointer flex items-center gap-2"
                  >
                    <i className="fa-solid fa-arrow-rotate-left"></i>
                    Upload another
                  </button>
                  {file && (
                    <span className="text-xs text-slate-400 font-manrope truncate max-w-[200px]">
                      {file.name}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: controls */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-[#EDEEF1] p-6 flex flex-col gap-6 sticky top-24">
              <BgOptionPicker value={bgOption} onChange={setBgOption} />

              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#657692]">
                  Download Format
                </span>
                <div className="flex gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-manrope font-bold border-2 transition cursor-pointer ${
                        format === f.id
                          ? "border-[#2F5FA8] bg-[#E8F1FF] text-[#2F5FA8]"
                          : "border-gray-200 text-slate-500 hover:border-gray-300"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {bgOption.type === "transparent" && format !== "png" && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
                    <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                    {format.toUpperCase()} doesn't support transparency — the
                    background will be flattened to white.
                  </p>
                )}
              </div>

              {!cutout ? (
                <button
                  onClick={handleRemove}
                  disabled={!file || processing || (!usage.unlimited && remaining <= 0)}
                  className="w-full bg-[#2F5FA8] hover:bg-[#1F4278] disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer text-white py-3.5 rounded-xl font-manrope font-bold transition flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      Remove Background
                    </>
                  )}
                </button>
              ) : (
                <a
                  href={resultUrl}
                  download={downloadName}
                  className="w-full bg-[#2F5FA8] hover:bg-[#1F4278] cursor-pointer text-white py-3.5 rounded-xl font-manrope font-bold transition flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-download"></i>
                  Download {format.toUpperCase()}
                </a>
              )}

              {!usage.unlimited && remaining <= 0 && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">
                  Daily limit reached. Resets in {formatCountdown(msUntilMidnightUTC())}.
                </p>
              )}
              {!usage.unlimited && remaining > 0 && remaining <= 3 && (
                <p className="text-xs text-slate-400 text-center">
                  {remaining} image{remaining === 1 ? "" : "s"} left today
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveBackground;
