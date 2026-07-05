import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { signInWithGoogle } from "../firebase";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import GoogleLogo from "../assets/google.png";
import ExampleShowcase from "../assets/showcase/example-train.jpg";
import StepBeforeImg from "../assets/showcase/step-before.jpg";
import StepAfterImg from "../assets/showcase/step-after.png";
import HistorySleepyCat from "../assets/showcase/pikachu-cutout.png";
import ProfileMenu from "./Elements/ProfileMenu";
import Logo from "./Elements/Logo";
import CompareSlider from "./Elements/CompareSlider";
import HeroSpotlightBg from "../assets/hero-spotlight-bg.jpg";

const USE_CASES = [
  {
    icon: "fa-solid fa-cart-shopping",
    title: "E-commerce",
    text: "Clean product photos for your online store.",
    bg: "bg-[#E8F1FF]",
    iconWrap: "text-[#487DCC]",
    heading: "text-[#274C79]",
    body: "text-slate-600",
  },
  {
    icon: "fa-solid fa-camera-retro",
    title: "Photography",
    text: "Professional edits in seconds, not hours.",
    bg: "bg-[#E0F2FE]",
    iconWrap: "text-sky-600",
    heading: "text-[#0c4a6e]",
    body: "text-sky-700/80",
  },
  {
    icon: "fa-solid fa-layer-group",
    title: "Design",
    text: "Create compositions with transparent assets.",
    bg: "bg-[#FEF3C7]",
    iconWrap: "text-amber-500",
    heading: "text-[#78350f]",
    body: "text-[#92400e]",
  },
  {
    icon: "fa-solid fa-user-large",
    title: "Social Media",
    text: "Stand out with professional profile images.",
    bg: "bg-[#DCFCE7]",
    iconWrap: "text-emerald-600",
    heading: "text-[#064e3b]",
    body: "text-[#065f46]",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Upload",
    text: "Drag and drop or click to upload your image. We support PNG, JPG, and WEBP.",
    icon: "fa-solid fa-cloud-arrow-up",
  },
  {
    number: "2",
    title: "AI Removes Background",
    text: "Our AI processes your image in under 5 seconds with high-accuracy segmentation.",
    icon: "fa-solid fa-wand-magic-sparkles",
  },
  {
    number: "3",
    title: "Download PNG",
    text: "Get your transparent PNG instantly. Compare before & after with our slider.",
    icon: "fa-solid fa-download",
  },
];

const FEATURES = [
  {
    icon: "fa-solid fa-images",
    title: "PNG, JPG & WEBP",
    text: "Upload and export in whatever format fits your workflow — processed in under 5 seconds, every time.",
    bg: "bg-[#E8F1FF]",
    iconColor: "text-[#487DCC]",
    large: true,
  },
  {
    icon: "fa-solid fa-droplet-slash",
    title: "No Watermarks",
    text: "Every image you generate is 100% clean, ready to use anywhere.",
    bg: "bg-[#DCFCE7]",
    iconColor: "text-emerald-600",
  },
  {
    icon: "fa-solid fa-calendar-day",
    title: "10 Free Images a Day",
    text: "Your quota resets automatically at 12 AM midnight, every day.",
    bg: "bg-[#FEF3C7]",
    iconColor: "text-amber-500",
  },
];

const HISTORY_ITEMS = [
  { name: "jiji-cutout.png", time: "2 min ago", thumb: StepAfterImg, checkered: true },
  { name: "pikachu-cutout.png", time: "1 hour ago", thumb: HistorySleepyCat, checkered: true },
];

const BG_SWATCHES = [
  { id: "white", label: "White", style: "bg-white border border-slate-200" },
  { id: "black", label: "Black", style: "bg-slate-900" },
  {
    id: "transparent",
    label: "Transparent",
    style: "",
    checkered: true,
  },
];

const FREE_PLAN_FEATURES = [
  "10 free images a day",
  "PNG, JPG & WEBP export",
  "No watermarks, ever",
  "Automatic image history",
  "Solid color & transparent backgrounds",
];

const PRO_PLAN_FEATURES = [
  "Unlimited image processing",
  "HD & 4K download quality",
  "No daily limits, ever",
  "Priority, faster processing",
  "Custom colors & saved backdrop presets",
  "All future features included",
];


// Small HSV <-> HEX helpers for the custom color popover
function hsvToHex(h, s, v) {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToHsv(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  return { h, s, v };
}

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [historyView, setHistoryView] = useState("compact");
  const [bgChoice, setBgChoice] = useState("transparent");
  const [accentColor, setAccentColor] = useState("#F4A6C6");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const [hsv, setHsv] = useState(() => hexToHsv("#F4A6C6"));
  const heroHeadingRef = useRef(null);
  const colorButtonWrapRef = useRef(null);
  const colorPanelRef = useRef(null);
  const colorSquareRef = useRef(null);
  const colorHueRef = useRef(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const updatePickerPosition = () => {
    if (!colorButtonWrapRef.current) return;
    const rect = colorButtonWrapRef.current.getBoundingClientRect();
    setPickerPos({ top: rect.bottom + 12, left: rect.left + rect.width / 2 });
  };

  const toggleColorPicker = () => {
    if (!showColorPicker) updatePickerPosition();
    setShowColorPicker((v) => !v);
  };

  useEffect(() => {
    if (!showColorPicker) return;
    const handleClickOutside = (e) => {
      const insideButton =
        colorButtonWrapRef.current && colorButtonWrapRef.current.contains(e.target);
      const insidePanel =
        colorPanelRef.current && colorPanelRef.current.contains(e.target);
      if (!insideButton && !insidePanel) setShowColorPicker(false);
    };
    const handleReposition = () => updatePickerPosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [showColorPicker]);

  const updateHsv = (patch) => {
    setHsv((prev) => {
      const next = { ...prev, ...patch };
      setAccentColor(hsvToHex(next.h, next.s, next.v));
      setBgChoice("custom");
      return next;
    });
  };

  const dragOnElement = (onMove) => (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const update = (clientX, clientY) => {
      const x = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
      onMove(x, y);
    };
    update(e.clientX, e.clientY);
    const move = (ev) => update(ev.clientX, ev.clientY);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const previewBgStyle =
    bgChoice === "white"
      ? { backgroundColor: "#ffffff" }
      : bgChoice === "black"
      ? { backgroundColor: "#0f172a" }
      : bgChoice === "custom"
      ? { backgroundColor: accentColor }
      : {
          backgroundImage:
            "conic-gradient(#e9e9ee 90deg, transparent 90deg 180deg, #e9e9ee 180deg 270deg, transparent 270deg)",
          backgroundSize: "14px 14px",
          backgroundColor: "#fff",
        };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // AuthContext's onAuthStateChanged listener calls /api/auth/sync automatically.
      navigate("/dashboard");
    } catch (error) {
      console.error("Error during sign-in:", error);
      toast.error("Sign-in failed. Please try again.");
    }
  };

  const handleGetStarted = () => {
    if (!user) {
      handleSignIn();
      return;
    }
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      const confirmLogout = window.confirm("Are you sure you want to Logout?");
      if (!confirmLogout) return;
      await signOut(auth);
      toast.info("Logged out");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const heading = heroHeadingRef.current;
    if (!heading) return;
    // Nav becomes solid once the hero heading scrolls up past the fixed nav bar,
    // rather than reacting to the "Get Started" button (or any scroll at all).
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: "-96px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(heading);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen font-sans text-slate-800 overflow-x-hidden bg-[#F3F4F6]">
      {/* Navbar */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-white backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="container max-w-5xl mx-auto px-6 flex justify-between items-center">
          <div className="ml-2 sm:ml-4 md:ml-6">
            <Logo light={!scrolled} showIcon={false} />
          </div>

          {!user && !loading ? (
            <button
              onClick={handleSignIn}
              className="bg-white hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-black px-5 py-2.5 rounded-lg border border-slate-200 shadow-sm transition"
            >
              Sign In With Google
              <img src={GoogleLogo} alt="google-logo" className="w-6 h-6" />
            </button>
          ) : (
            <ProfileMenu user={user} handleLogout={handleLogout} />
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="relative w-full min-h-screen flex items-start justify-center overflow-hidden isolate bg-[#0B1E3A] pt-32 sm:pt-36 md:pt-40">
        {/* Full-screen brand background image — real <img> so it stays crisp and correctly scaled at any browser zoom level */}
        <img
          src={HeroSpotlightBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none select-none"
        />

        {/* Light contrast wash so the type stays readable without dulling the artwork */}
        <div className="absolute inset-0 z-0 bg-black/15 pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div
            className="max-w-4xl mx-auto text-center"
            style={{ transform: "scale(1.25)", transformOrigin: "top center" }}
          >
            <h1
              ref={heroHeadingRef}
              className="text-[clamp(1.5rem,4.8vw,3.5rem)] font-brice font-heading font-black leading-tight mb-4 tracking-tight"
            >
              <span className="block whitespace-nowrap">
                <span className="text-white">Every pixel</span>
                <span className="text-[#487DCC] ml-6 sm:ml-8">deserves</span>
              </span>
              <span className="block whitespace-nowrap">
                <span className="text-white">the spot</span>
                <span className="text-[#487DCC] ml-4 sm:ml-6">light.</span>
              </span>
            </h1>
            <p className="text-base sm:text-lg mb-8 leading-relaxed max-w-xl mx-auto font-manrope">
              <span className="text-white/85">Upload a photo, let our AI cut it out in </span>
              <span className="text-[#487DCC] ml-2 sm:ml-3">seconds, and download.</span>
            </p>

            <div className="flex items-center justify-center font-manrope">
              <button
                onClick={handleGetStarted}
                className="bg-white hover:bg-gray-100 cursor-pointer text-[#487DCC] px-8 py-4 rounded-xl font-bold text-lg transition shadow-xl shadow-black/20 flex items-center justify-center gap-2 group"
              >
                Get Started
                <i className="fa-solid fa-chevron-right text-sm group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Everything below the hero is scaled up to 110% */}
      <div style={{ transform: "scale(1.1)", transformOrigin: "top center" }}>

      {/* Use Cases */}
      <section id="use-cases" className="py-20 bg-white relative overflow-hidden isolate">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/40 blur-3xl -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-[-1]"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/40 blur-3xl translate-x-1/2 translate-y-1/2 rounded-full pointer-events-none z-[-1]"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-brice font-heading font-black text-[#487DCC] mb-4">
              Built for Every Use Case
            </h2>
            <p className="text-slate-600 font-manrope max-w-2xl mx-auto">
              One tool, endless applications — wherever a clean cutout matters.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {USE_CASES.map((useCase) => (
              <div
                key={useCase.title}
                className={`${useCase.bg} rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group hover:shadow-xl transition-all duration-500`}
              >
                <div
                  className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 ${useCase.iconWrap}`}
                >
                  <i className={`${useCase.icon} text-2xl`}></i>
                </div>
                <h3 className={`text-xl font-bricereg font-bold mb-2 ${useCase.heading}`}>
                  {useCase.title}
                </h3>
                <p className={`text-sm font-body ${useCase.body}`}>{useCase.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-aesthetic-dots relative isolate overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 blur-3xl -translate-x-1/3 -translate-y-1/3 rounded-full pointer-events-none z-[-1]"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/30 blur-3xl translate-x-1/3 translate-y-1/3 rounded-full pointer-events-none z-[-1]"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-brice font-heading font-black text-[#487DCC] mb-4">
              How It Works
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto font-manrope">
              Three simple steps to remove any background with pixel-perfect
              accuracy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative items-stretch">
            {/* Curved dashed connector arrows (desktop only) */}
            <svg
              className="hidden md:block absolute top-[118px] left-0 w-full h-28 pointer-events-none z-0"
              viewBox="0 0 1000 120"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <marker
                  id="howItWorksArrow"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L10,5 L0,10 Z" fill="#AAB8DA" />
                </marker>
              </defs>
              <path
                d="M255,100 C 300,20 355,20 395,95"
                stroke="#AAB8DA"
                strokeWidth="2.5"
                strokeDasharray="1.5 10"
                strokeLinecap="round"
                markerEnd="url(#howItWorksArrow)"
              />
              <path
                d="M605,95 C 645,20 700,20 745,100"
                stroke="#AAB8DA"
                strokeWidth="2.5"
                strokeDasharray="1.5 10"
                strokeLinecap="round"
                markerEnd="url(#howItWorksArrow)"
              />
            </svg>

            {/* Step 1 — Upload (before photo) */}
            <div className="group relative bg-[#E8F1FF] rounded-[2rem] p-6 pt-7 flex flex-col hover:shadow-xl transition-all duration-500 z-10">
              <span className="inline-flex self-start items-center gap-1.5 text-xs font-manrope font-bold uppercase tracking-wider bg-white text-[#487DCC] px-3.5 py-2 rounded-full mb-4 shadow-sm">
                <i className="fa-solid fa-cloud-arrow-up"></i>
                Step 1 · Original
              </span>
              <div className="relative rounded-2xl overflow-hidden border-[6px] border-white shadow-xl -rotate-3 mb-5 origin-bottom-left transition-transform duration-500 ease-out group-hover:-rotate-6">
                <img
                  src={StepBeforeImg}
                  alt="Original photo before background removal"
                  className="w-full h-52 object-cover"
                />
              </div>
              <h3 className="text-lg font-bricereg font-bold text-[#274C79] mb-1">
                {STEPS[0].title}
              </h3>
              <p className="text-slate-600 text-sm font-body leading-relaxed">
                {STEPS[0].text}
              </p>
            </div>

            {/* Step 2 — AI processing */}
            <div className="relative bg-[#FEF3C7] rounded-[2rem] p-6 flex flex-col justify-center items-center text-center hover:shadow-xl transition-all duration-500 z-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-5 text-amber-500 text-2xl">
                <i className={`${STEPS[1].icon}`}></i>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-manrope font-bold uppercase tracking-wider bg-white text-amber-600 px-3.5 py-2 rounded-full mb-4 shadow-sm">
                Step 2 · Processing
              </span>
              <h3 className="text-lg font-bricereg font-bold text-[#7A5B12] mb-1">
                {STEPS[1].title}
              </h3>
              <p className="text-[#8A6D2E] text-sm font-body leading-relaxed">
                {STEPS[1].text}
              </p>
            </div>

            {/* Step 3 — Download (after photo, transparent) */}
            <div className="group relative bg-[#F3E8FF] rounded-[2rem] p-6 pt-7 flex flex-col hover:shadow-xl transition-all duration-500 z-10">
              <span className="inline-flex self-start items-center gap-1.5 text-xs font-manrope font-bold uppercase tracking-wider bg-white text-[#7C3AED] px-3.5 py-2 rounded-full mb-4 shadow-sm">
                <i className="fa-solid fa-download"></i>
                Step 3 · Cutout
              </span>
              <div
                className="relative rounded-2xl overflow-hidden border-[6px] border-white shadow-xl rotate-3 mb-5 origin-bottom-right transition-transform duration-500 ease-out group-hover:rotate-6"
                style={{
                  backgroundImage:
                    "conic-gradient(#e9e9ee 90deg, transparent 90deg 180deg, #e9e9ee 180deg 270deg, transparent 270deg)",
                  backgroundSize: "16px 16px",
                  backgroundColor: "#fff",
                }}
              >
                <img
                  src={StepAfterImg}
                  alt="Photo after background removal, transparent PNG"
                  className="w-full h-52 object-contain"
                />
              </div>
              <h3 className="text-lg font-bricereg font-bold text-[#4C1D95] mb-1">
                {STEPS[2].title}
              </h3>
              <p className="text-[#6D5A8A] text-sm font-body leading-relaxed">
                {STEPS[2].text}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white relative overflow-hidden isolate">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/40 blur-3xl -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-[-1]"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/40 blur-3xl translate-x-1/2 translate-y-1/2 rounded-full pointer-events-none z-[-1]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-brice font-heading font-black text-[#487DCC] mb-4">
              Everything You Need
            </h2>
            <p className="text-slate-600 font-manrope max-w-2xl mx-auto">
              No subscriptions to start, no watermarks, ever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[0.85fr_230px_1.5fr] gap-6 max-w-6xl mx-auto items-stretch">
            {FEATURES.map((feature) =>
              feature.large ? (
                <div
                  key={feature.title}
                  className={`${feature.bg} rounded-[2rem] p-7 flex flex-col justify-between hover:shadow-xl transition-all duration-500`}
                >
                  <div>
                    <div
                      className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-5 ${feature.iconColor}`}
                    >
                      <i className={`${feature.icon} text-xl`}></i>
                    </div>
                    <h3 className="text-2xl font-bricereg font-bold text-[#274C79] mb-2 leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 text-sm font-body leading-relaxed">
                      {feature.text}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {[
                      { f: "PNG", d: "Transparent, lossless" },
                      { f: "JPG", d: "Small, universal" },
                      { f: "WEBP", d: "Modern & compact" },
                    ].map((item) => (
                      <div
                        key={item.f}
                        className="flex items-center gap-3 bg-white/70 rounded-xl px-3.5 py-2.5"
                      >
                        <span className="w-10 h-8 rounded-md bg-[#487DCC] text-white flex items-center justify-center text-[10px] font-manrope font-black tracking-wide shrink-0">
                          {item.f}
                        </span>
                        <span className="text-xs text-slate-500 font-manrope">
                          {item.d}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}

            <div className="flex md:flex-col gap-6">
              {FEATURES.filter((f) => !f.large).map((feature) => (
                <div
                  key={feature.title}
                  className={`${feature.bg} flex-1 rounded-[2rem] p-6 flex flex-col justify-center hover:shadow-xl transition-all duration-500`}
                >
                  <div
                    className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 ${feature.iconColor}`}
                  >
                    <i className={`${feature.icon} text-lg`}></i>
                  </div>
                  <h3 className="text-base font-bricereg font-bold text-[#274C79] mb-2 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm font-body leading-relaxed">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="group bg-[#F3E8FF] rounded-[2rem] p-8 flex flex-col relative overflow-hidden hover:shadow-xl transition-all duration-500">
              <span className="inline-flex self-start items-center gap-1.5 text-xs font-manrope font-bold uppercase tracking-wider bg-white text-[#7C3AED] px-3.5 py-2 rounded-full mb-5 shadow-sm">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                Real Result
              </span>
              <h3 className="text-3xl font-bricereg font-bold text-[#4C1D95] mb-3 leading-tight">
                High-Quality Cutouts, Under Seconds
              </h3>
              <p className="text-[#6D5A8A] text-base font-body leading-relaxed max-w-[85%]">
                No blurry edges, no shortcuts — just a clean, pixel-accurate
                result every time.
              </p>

              <div className="mt-auto pt-6 flex justify-end">
                <img
                  src={ExampleShowcase}
                  alt="Example of a photo with the sky background swapped to white, edges kept crisp and uncropped"
                  className="w-[92%] h-auto rounded-xl border-[6px] border-white shadow-2xl -rotate-9 origin-bottom-right transition-transform duration-500 ease-out group-hover:-rotate-3"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* There's More */}
      <section id="more" className="py-20 bg-aesthetic-dots relative isolate overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/30 blur-3xl translate-x-1/3 -translate-y-1/3 rounded-full pointer-events-none z-[-1]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/30 blur-3xl -translate-x-1/3 translate-y-1/3 rounded-full pointer-events-none z-[-1]"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-brice font-heading font-black text-[#487DCC] mb-4">
              There's More!
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto font-manrope">
              A couple more tools tucked in to make your workflow even
              smoother.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* History feature */}
            <div className="bg-[#E8F1FF] rounded-[2rem] p-8 flex flex-col relative overflow-hidden hover:shadow-xl transition-all duration-500">
              <span className="inline-flex self-start items-center gap-1.5 text-xs font-manrope font-bold uppercase tracking-wider bg-white text-[#487DCC] px-3.5 py-2 rounded-full mb-5 shadow-sm">
                <i className="fa-solid fa-clock-rotate-left"></i>
                Image History
              </span>
              <h3 className="text-2xl md:text-3xl font-bricereg font-bold text-[#274C79] mb-3 leading-tight">
                Every Edit, Saved Automatically
              </h3>
              <p className="text-slate-600 text-sm font-body leading-relaxed max-w-[90%] mb-6">
                Revisit and re-download any image you've processed. Your
                recent edits stay right where you left them — no re-uploading
                needed.
              </p>

              {/* Compact / Cards toggle (click to switch) */}
              <div className="relative inline-flex self-start items-center bg-white/80 rounded-full p-1 mb-4 shadow-sm w-56">
                <motion.div
                  className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-[#487DCC]"
                  animate={{ x: historyView === "compact" ? 2 : "calc(100% + 2px)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                />
                <button
                  type="button"
                  onClick={() => setHistoryView("compact")}
                  className={`relative z-10 w-1/2 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-manrope font-bold uppercase tracking-wider transition-colors duration-300 cursor-pointer ${
                    historyView === "compact" ? "text-white" : "text-[#487DCC]"
                  }`}
                >
                  <i className="fa-solid fa-list"></i>
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryView("cards")}
                  className={`relative z-10 w-1/2 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-manrope font-bold uppercase tracking-wider transition-colors duration-300 cursor-pointer ${
                    historyView === "cards" ? "text-white" : "text-[#487DCC]"
                  }`}
                >
                  <i className="fa-solid fa-grip"></i>
                  Cards
                </button>
              </div>

              <div className="mt-auto bg-white/70 rounded-2xl p-3 w-full min-h-[196px]">
                <AnimatePresence mode="wait">
                  {historyView === "compact" ? (
                    <motion.div
                      key="compact"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="flex flex-col gap-2.5 w-full"
                    >
                      {HISTORY_ITEMS.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-3 bg-white rounded-xl pr-3.5 py-2 pl-2 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                          <span
                            className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[#EDEEF1]"
                            style={
                              item.checkered
                                ? {
                                    backgroundImage:
                                      "conic-gradient(#eef0f4 90deg, transparent 90deg 180deg, #eef0f4 180deg 270deg, transparent 270deg)",
                                    backgroundSize: "10px 10px",
                                    backgroundColor: "#fff",
                                  }
                                : undefined
                            }
                          >
                            <img
                              src={item.thumb}
                              alt={item.name}
                              className={`w-full h-full ${
                                item.checkered ? "object-contain p-0.5" : "object-cover"
                              }`}
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-manrope font-bold text-[#274C79] truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-manrope">
                              {item.time}
                            </p>
                          </div>
                          <span className="w-7 h-7 rounded-full bg-[#E8F1FF] text-[#487DCC] flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-arrow-down text-[11px]"></i>
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cards"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="grid grid-cols-2 gap-2.5 w-full"
                    >
                      {HISTORY_ITEMS.map((item) => (
                        <div
                          key={item.name}
                          className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                          <div
                            className="h-24 w-full"
                            style={
                              item.checkered
                                ? {
                                    backgroundImage:
                                      "conic-gradient(#eef0f4 90deg, transparent 90deg 180deg, #eef0f4 180deg 270deg, transparent 270deg)",
                                    backgroundSize: "10px 10px",
                                    backgroundColor: "#fff",
                                  }
                                : undefined
                            }
                          >
                            <img
                              src={item.thumb}
                              alt={item.name}
                              className={`w-full h-full ${
                                item.checkered ? "object-contain p-1.5" : "object-cover"
                              }`}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-1.5 px-2.5 py-2">
                            <div className="min-w-0">
                              <p className="text-[11px] font-manrope font-bold text-[#274C79] truncate">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-manrope">
                                {item.time}
                              </p>
                            </div>
                            <span className="w-6 h-6 rounded-full bg-[#E8F1FF] text-[#487DCC] flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-arrow-down text-[10px]"></i>
                            </span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Custom background feature */}
            <div className="bg-[#F3E8FF] rounded-[2rem] p-8 flex flex-col relative hover:shadow-xl transition-all duration-500">
              <span className="inline-flex self-start items-center gap-1.5 text-xs font-manrope font-bold uppercase tracking-wider bg-white text-[#7C3AED] px-3.5 py-2 rounded-full mb-5 shadow-sm">
                <i className="fa-solid fa-fill-drip"></i>
                Custom Backgrounds
              </span>
              <h3 className="text-2xl md:text-3xl font-bricereg font-bold text-[#4C1D95] mb-3 leading-tight">
                Swap In Any Backdrop You Like
              </h3>
              <p className="text-[#6D5A8A] text-sm font-body leading-relaxed max-w-[90%] mb-6">
                Drop your cutout onto a solid color, gradient, or your own
                image — all without leaving the app.
              </p>

              <div className="mt-auto flex flex-col gap-5">
                <div className="flex items-stretch gap-4">
                  <div
                    className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-lg border-4 border-white shrink-0 transition-colors duration-300"
                    style={previewBgStyle}
                  >
                    <img
                      src={StepAfterImg}
                      alt="Jiji cutout on the selected background"
                      className="absolute inset-0 w-full h-full object-contain p-3"
                    />
                  </div>
                  <div
                    className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-lg border-4 border-white shrink-0 transition-colors duration-300"
                    style={previewBgStyle}
                  >
                    <img
                      src={HistorySleepyCat}
                      alt="Pikachu cutout on the selected background"
                      className="absolute inset-0 w-full h-full object-contain p-3"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <p className="text-[11px] font-manrope font-bold text-[#7C3AED] uppercase tracking-wider">
                    Pick a backdrop
                  </p>
                  <div className="flex items-center gap-3">
                    {BG_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.id}
                        type="button"
                        title={swatch.label}
                        onClick={() => setBgChoice(swatch.id)}
                        className={`w-8 h-8 rounded-full shrink-0 cursor-pointer transition-transform hover:scale-110 ${
                          swatch.style
                        } ${
                          bgChoice === swatch.id
                            ? "ring-2 ring-offset-2 ring-[#7C3AED]"
                            : ""
                        }`}
                        style={
                          swatch.checkered
                            ? {
                                backgroundImage:
                                  "conic-gradient(#d8dae3 90deg, transparent 90deg 180deg, #d8dae3 180deg 270deg, transparent 270deg)",
                                backgroundSize: "8px 8px",
                                backgroundColor: "#fff",
                              }
                            : undefined
                        }
                      ></button>
                    ))}

                    <div className="relative" ref={colorButtonWrapRef}>
                      <button
                        type="button"
                        title="Choose your own accent color"
                        onClick={toggleColorPicker}
                        className={`relative w-8 h-8 rounded-full shrink-0 cursor-pointer transition-transform hover:scale-110 flex items-center justify-center ${
                          bgChoice === "custom"
                            ? "ring-2 ring-offset-2 ring-[#7C3AED]"
                            : ""
                        }`}
                        style={{ backgroundColor: accentColor }}
                      >
                        <i className="fa-solid fa-plus text-white text-[10px] drop-shadow"></i>
                      </button>

                      {showColorPicker &&
                        createPortal(
                          <div
                            ref={colorPanelRef}
                            className="fixed z-[999] -translate-x-1/2 w-56 bg-white rounded-2xl shadow-2xl border border-purple-100 p-4 font-manrope"
                            style={{ top: pickerPos.top, left: pickerPos.left }}
                          >
                            <div
                              ref={colorSquareRef}
                              onMouseDown={dragOnElement((x, y) =>
                                updateHsv({ s: x * 100, v: (1 - y) * 100 })
                              )}
                              className="relative w-full h-32 rounded-xl cursor-crosshair select-none"
                              style={{
                                backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                                backgroundImage:
                                  "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
                              }}
                            >
                              <div
                                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 translate-y-1/2 pointer-events-none"
                                style={{
                                  left: `${hsv.s}%`,
                                  bottom: `${hsv.v}%`,
                                  backgroundColor: accentColor,
                                }}
                              />
                            </div>

                            <div
                              ref={colorHueRef}
                              onMouseDown={dragOnElement((x) => updateHsv({ h: x * 360 }))}
                              className="relative w-full h-3 rounded-full mt-3.5 cursor-pointer select-none"
                              style={{
                                backgroundImage:
                                  "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
                              }}
                            >
                              <div
                                className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                style={{
                                  left: `${(hsv.h / 360) * 100}%`,
                                  backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                                }}
                              />
                            </div>

                            <div className="flex items-center gap-2.5 mt-3.5 bg-purple-50 rounded-xl px-3 py-2">
                              <span
                                className="w-6 h-6 rounded-full border border-white shadow-sm shrink-0"
                                style={{ backgroundColor: accentColor }}
                              />
                              <span className="text-xs font-bold text-[#4C1D95] tracking-wide">
                                {accentColor}
                              </span>
                            </div>
                          </div>,
                          document.body
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white relative overflow-hidden isolate">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-brice font-heading font-black text-[#487DCC] mb-4">
              Pricing
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto font-manrope">
              No subscriptions, no surprise renewals. Try it for free, then
              pay once and keep every Pro feature forever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Free plan */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-[2rem] p-8 flex flex-col h-full">
              <h3 className="text-xl font-bricereg font-bold text-[#274C79] mb-1">
                Free
              </h3>
              <p className="text-slate-500 text-sm font-manrope mb-6">
                For casual, everyday edits
              </p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-4xl font-brice font-black text-[#274C79]">
                  $0
                </span>
                <span className="text-slate-500 font-manrope mb-1">
                  / forever
                </span>
              </div>
              <p className="text-slate-400 text-xs font-manrope mb-6">
                No card required
              </p>
              <button
                onClick={handleGetStarted}
                className="mb-8 w-full bg-white border-2 border-[#487DCC] text-[#487DCC] font-bold py-3 rounded-xl hover:bg-[#EEF3FC] transition cursor-pointer"
              >
                Get Started Free
              </button>
              <ul className="flex flex-col gap-3.5">
                {FREE_PLAN_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm font-manrope text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#E8F1FF] text-[#487DCC] flex items-center justify-center shrink-0 mt-0.5">
                      <i className="fa-solid fa-check text-[10px]"></i>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro plan */}
            <div className="relative bg-[#487DCC] rounded-[2rem] p-8 flex flex-col h-full text-white shadow-2xl shadow-blue-200/60">
              <span className="absolute -top-4 right-8 bg-amber-400 text-[#274C79] rounded-full px-4 py-1.5 text-xs font-manrope font-bold uppercase tracking-wide shadow-lg rotate-3">
                Lifetime Deal
              </span>
              <h3 className="text-xl font-bricereg font-bold mb-1">Pro</h3>
              <p className="text-blue-200 text-sm font-manrope mb-6">
                For creators & power users
              </p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-4xl font-brice font-black">$19</span>
                <span className="text-blue-200 font-manrope mb-1">
                  one-time
                </span>
              </div>
              <p className="text-blue-200 text-xs font-manrope mb-6">
                Pay once. Yours forever, no renewals.
              </p>
              <button
                onClick={handleGetStarted}
                className="mb-8 w-full bg-white text-[#487DCC] font-bold py-3 rounded-xl hover:bg-gray-100 transition shadow-lg cursor-pointer"
              >
                Get Pro — Lifetime Access
              </button>
              <ul className="flex flex-col gap-3.5">
                {PRO_PLAN_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm font-manrope text-blue-50"
                  >
                    <span className="w-5 h-5 rounded-full bg-white/15 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <i className="fa-solid fa-check text-[10px]"></i>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#487DCC] text-white py-16">
        <div className="container max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Logo light />
          <p className="text-white/85 text-sm font-manrope">
            Designed &amp; Developed by Parinith
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Home;
