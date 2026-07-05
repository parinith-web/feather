import React from "react";

const timeAgo = (isoString) => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const HistoryCard = ({ item, onDelete, compact = false }) => {
  const previewStyle =
    item.bgType === "color"
      ? { backgroundColor: item.bgColor }
      : item.bgType === "white"
      ? { backgroundColor: "#ffffff" }
      : item.bgType === "image" && item.bgImageThumb
      ? {
          backgroundImage: `url(${item.bgImageThumb})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {};

  const previewClass =
    item.bgType === "transparent"
      ? "bg-[repeating-conic-gradient(#e5e7eb_0%_25%,white_0%_50%)] bg-[length:16px_16px]"
      : "";

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-[#EDEEF1] shadow-[0px_3px_0px_#F3F4F6] hover:shadow-[0px_3px_0px_#F3F4F6,0px_5px_12px_#e5e5e5] transition-all p-3 flex items-center gap-3">
        <div
          className={`relative w-12 h-12 shrink-0 rounded-xl overflow-hidden flex items-center justify-center ${previewClass}`}
          style={previewStyle}
        >
          <img
            src={item.resultThumb}
            alt={item.filename}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#2F5FA8] text-sm truncate">{item.filename}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {timeAgo(item.createdAt)}
          </p>
        </div>

        <a
          href={item.resultFull}
          download={item.filename}
          title="Download"
          className="shrink-0 w-9 h-9 rounded-full bg-[#E8F1FF] text-[#2F5FA8] hover:bg-[#d7e6fb] flex items-center justify-center transition"
        >
          <i className="fa-solid fa-download text-xs"></i>
        </a>
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            title="Delete"
            className="shrink-0 w-9 h-9 rounded-full bg-[#FBEAEA] hover:bg-[#f6d6d6] cursor-pointer text-[#a15454] flex items-center justify-center transition"
          >
            <i className="fa-solid fa-trash text-xs"></i>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#EDEEF1] shadow-[0px_4px_0px_#F3F4F6] hover:shadow-[0px_4px_0px_#F3F4F6,0px_6px_14px_#e5e5e5] transition-all overflow-hidden group">
      <div
        className={`relative h-40 flex items-center justify-center ${previewClass}`}
        style={previewStyle}
      >
        <img
          src={item.resultThumb}
          alt={item.filename}
          className="max-h-full max-w-full object-contain"
        />
        <span className="absolute top-2 left-2 bg-black/55 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">
          {item.format}
        </span>
      </div>
      <div className="p-4">
        <p className="font-bold text-[#2F5FA8] text-sm truncate">{item.filename}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <a
            href={item.resultFull}
            download={item.filename}
            className="flex-1 text-center bg-[#2F5FA8] hover:bg-[#1F4278] text-white text-xs font-medium py-2 rounded-lg transition"
          >
            <i className="fa-solid fa-download mr-1"></i> Download
          </a>
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="bg-[#f8e2e2] hover:bg-[#f6d6d6] cursor-pointer text-[#704040] w-8 h-8 rounded-lg flex items-center justify-center transition"
              title="Delete"
            >
              <i className="fa-solid fa-trash text-xs"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryCard;
