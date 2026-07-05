import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import DashboardNav from "./Elements/DashboardNav";
import DashboardBg from "../assets/dashboard-bg.png";

function formatCountdown(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

const Dashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usage = profile?.usage || { count: 0, limit: 10, remaining: 10, unlimited: false };
  const usagePercent = usage.unlimited ? 100 : Math.min(100, (usage.count / (usage.limit || 10)) * 100);
  const firstName = user?.displayName?.split(" ")[0] || "there";
  const historyCount = profile?.historyCount ?? 0;
  const resetsInMs = profile?.usageResetsInMs;

  const memberSince = profile?.memberSince
    ? new Date(profile.memberSince).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen relative isolate overflow-hidden bg-[#FAFAFA] font-sans text-slate-800">
      {/* Background with fade effect, extracted from the reference design */}
      <div
        className="absolute inset-x-0 top-0 z-[-1] blur-md saturate-75 pointer-events-none"
        style={{
          backgroundImage: `url(${DashboardBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          height: "60vh",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      ></div>

      <DashboardNav />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-brice font-heading font-black text-[#2F5FA8]">
          Welcome back, {firstName}
        </h1>
        <p className="text-slate-500 font-manrope mt-1 mb-7">
          Here's what's happening with your images.
        </p>

        {/* Stats row */}
        <div className="grid sm:grid-cols-3 gap-5 mb-7">
          <div className="bg-white rounded-3xl border border-[#EDEEF1] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#657692]">
                Today's Usage
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#E8F1FF] text-[#2F5FA8] flex items-center justify-center">
                <i className="fa-solid fa-bolt text-sm"></i>
              </div>
            </div>
            <p className="text-3xl font-brice font-black text-[#2F5FA8]">
              {usage.count}
              <span className="text-lg text-slate-400 font-manrope font-normal">
                /{usage.unlimited ? "∞" : usage.limit}
              </span>
            </p>
            {!usage.unlimited && (
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-[#2F5FA8] rounded-full" style={{ width: `${usagePercent}%` }}></div>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              {usage.unlimited ? "Pro — unlimited images" : `Resets in ${formatCountdown(resetsInMs ?? 0)}`}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#EDEEF1] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#657692]">
                Total Processed
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-emerald-600 flex items-center justify-center">
                <i className="fa-solid fa-images text-sm"></i>
              </div>
            </div>
            <p className="text-3xl font-brice font-black text-[#2F5FA8]">{historyCount}</p>
            <p className="text-[11px] text-slate-400 mt-2">
              Images cut out with Feather
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#EDEEF1] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#657692]">
                Member Since
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-amber-500 flex items-center justify-center">
                <i className="fa-solid fa-star text-sm"></i>
              </div>
            </div>
            <p className="text-3xl font-brice font-black text-[#2F5FA8]">{memberSince}</p>
            <p className="text-[11px] text-slate-400 mt-2">
              {profile?.plan === "pro" ? "Pro plan" : "Free plan"}
            </p>
          </div>
        </div>

        {/* Quick action */}
        <button
          onClick={() => navigate("/remove-background")}
          className="w-full text-left relative overflow-hidden rounded-[2.5rem] bg-[#2F5FA8] px-8 py-8 mb-8 group hover:shadow-xl transition-all cursor-pointer isolate"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-brice font-heading font-black text-white mb-1">
                Remove a Background
              </h2>
              <p className="text-blue-200 font-manrope text-sm">
                Upload a photo and get a clean cutout in seconds.
              </p>
            </div>
            <span className="shrink-0 bg-white text-[#2F5FA8] px-6 py-3 rounded-xl font-manrope font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
              Get Started
              <i className="fa-solid fa-chevron-right text-sm"></i>
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
