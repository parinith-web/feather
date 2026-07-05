import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../AuthContext";
import { toast } from "react-toastify";
import DashboardNav from "./Elements/DashboardNav";
import { clearHistory as clearHistoryApi } from "../api/history";
import { getPaymentConfig, createCheckout } from "../api/payments";
import { openPaddleCheckout } from "../utils/paddle";

const PLAN_ITEMS = [
  { icon: "fa-solid fa-images", text: "PNG, JPG & WEBP export formats" },
  { icon: "fa-solid fa-droplet-slash", text: "No watermark on any image" },
  { icon: "fa-solid fa-calendar-day", text: "10 free images per day, resets at midnight UTC" },
  { icon: "fa-solid fa-bolt", text: "Under 5 second processing time" },
];

const PRO_ITEMS = [
  { icon: "fa-solid fa-infinity", text: "Unlimited background removals" },
  { icon: "fa-solid fa-images", text: "PNG, JPG & WEBP export formats" },
  { icon: "fa-solid fa-droplet-slash", text: "No watermark on any image" },
  { icon: "fa-solid fa-bolt", text: "Priority processing" },
];

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usage = profile?.usage || { count: 0, limit: 10, unlimited: false };
  const historyCount = profile?.historyCount ?? 0;
  const isPro = profile?.plan === "pro";

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;
    try {
      await signOut(auth);
      toast.info("Logged out");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Couldn't log out. Try again.");
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Delete all your image history? This can't be undone.")) return;
    try {
      await clearHistoryApi();
      await refreshProfile();
      toast.success("History cleared");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Couldn't clear history.");
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const [config, checkout] = await Promise.all([getPaymentConfig(), createCheckout()]);
      if (!config.clientToken) {
        toast.error("Payments aren't configured yet. Set PADDLE_CLIENT_TOKEN on the backend.");
        return;
      }
      await openPaddleCheckout({
        environment: config.environment,
        clientToken: config.clientToken,
        transactionId: checkout.transactionId,
      });
      // Paddle's webhook flips the plan to "pro" server-side once payment
      // completes; poll briefly so the UI reflects it without a manual refresh.
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        const fresh = await refreshProfile();
        if (fresh?.plan === "pro" || attempts >= 10) clearInterval(poll);
      }, 3000);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Couldn't start checkout.");
    } finally {
      setUpgrading(false);
    }
  };

  const memberSince = profile?.memberSince
    ? new Date(profile.memberSince).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-slate-800">
      <DashboardNav />

      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-brice font-heading font-black text-[#2F5FA8] mb-8">
          Profile
        </h1>

        {/* Account card */}
        <div className="bg-white rounded-3xl border border-[#EDEEF1] p-8 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="profile"
              className="w-20 h-20 rounded-full border-2 border-[#E8F1FF] object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#2F5FA8] text-white flex items-center justify-center text-2xl font-bold shrink-0">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bricereg font-bold text-[#2F5FA8]">
              {user?.displayName || "Feather User"}
            </h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              <span
                className={`text-xs font-manrope font-bold px-3 py-1 rounded-full ${
                  isPro ? "bg-amber-100 text-amber-700" : "bg-[#E8F1FF] text-[#2F5FA8]"
                }`}
              >
                {isPro ? "Pro Plan" : "Free Plan"}
              </span>
              <span className="text-xs font-manrope font-bold bg-gray-100 text-slate-500 px-3 py-1 rounded-full">
                Member since {memberSince}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 flex items-center gap-2 border border-red-100 text-red-600 hover:bg-red-50 cursor-pointer px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            Logout
          </button>
        </div>

        {/* Usage card */}
        <div className="bg-white rounded-3xl border border-[#EDEEF1] p-8 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#657692] mb-4">
            Usage
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-2xl font-brice font-black text-[#2F5FA8]">
                {usage.count}
                <span className="text-base text-slate-400 font-manrope font-normal">
                  /{usage.unlimited ? "∞" : usage.limit}
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Used today</p>
            </div>
            <div>
              <p className="text-2xl font-brice font-black text-[#2F5FA8]">{historyCount}</p>
              <p className="text-xs text-slate-400 mt-1">Total images processed</p>
            </div>
          </div>
        </div>

        {/* Plan details / upgrade */}
        <div className="bg-white rounded-3xl border border-[#EDEEF1] p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#657692]">
              {isPro ? "Your Pro Plan Includes" : "Your Plan Includes"}
            </h3>
            {!isPro && (
              <span className="text-xs font-manrope font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                $19 one-time
              </span>
            )}
          </div>
          <ul className="flex flex-col gap-3">
            {(isPro ? PRO_ITEMS : PLAN_ITEMS).map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-sm text-slate-600 font-manrope">
                <span className="w-8 h-8 rounded-lg bg-[#E8F1FF] text-[#2F5FA8] flex items-center justify-center shrink-0">
                  <i className={`${item.icon} text-xs`}></i>
                </span>
                {item.text}
              </li>
            ))}
          </ul>

          {!isPro && (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="mt-6 w-full bg-[#2F5FA8] hover:bg-[#1F4278] disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer text-white py-3 rounded-xl font-manrope font-bold transition flex items-center justify-center gap-2"
            >
              {upgrading ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  Opening checkout...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-crown"></i>
                  Upgrade to Pro — $19 Lifetime
                </>
              )}
            </button>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-3xl border border-red-100 p-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-4">
            Danger Zone
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-slate-500 max-w-sm">
              Permanently delete all of your processed image history and its
              stored images.
            </p>
            <button
              onClick={handleClearHistory}
              className="shrink-0 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <i className="fa-solid fa-trash"></i>
              Clear History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
