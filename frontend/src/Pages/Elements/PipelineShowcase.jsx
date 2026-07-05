import React from "react";

// Generic, non-branded stand-ins for "a photo" — kept as icons rather than
// real images so the showcase isn't tied to any one photo and stays crisp
// at any size. Colors/icons reuse the same palette as the Use Cases section
// below for visual consistency across the page.
const PIPELINE_ITEMS = [
  { icon: "fa-solid fa-camera-retro", bg: "bg-[#E0F2FE]", color: "text-sky-600" },
  { icon: "fa-solid fa-cart-shopping", bg: "bg-[#E8F1FF]", color: "text-[#2F5FA8]" },
  { icon: "fa-solid fa-user-large", bg: "bg-[#DCFCE7]", color: "text-emerald-600" },
];

const PipelineShowcase = () => {
  return (
    <div className="relative bg-white/80 backdrop-blur-sm border border-[#E4ECFB] rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-blue-200/50">
      <div className="relative h-[300px] md:h-[340px]">
        {/* dashed connectors: 3 inputs -> center -> 3 outputs */}
        <svg
          viewBox="0 0 600 340"
          className="absolute inset-0 w-full h-full"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M80,38 C170,38 170,170 258,170" stroke="#B9CBEF" strokeWidth="2" strokeDasharray="1.5 9" strokeLinecap="round" />
          <path d="M80,170 L258,170" stroke="#B9CBEF" strokeWidth="2" strokeDasharray="1.5 9" strokeLinecap="round" />
          <path d="M80,302 C170,302 170,170 258,170" stroke="#B9CBEF" strokeWidth="2" strokeDasharray="1.5 9" strokeLinecap="round" />

          <path d="M342,170 C430,170 430,38 520,38" stroke="#A9D6C4" strokeWidth="2" strokeDasharray="1.5 9" strokeLinecap="round" />
          <path d="M342,170 L520,170" stroke="#A9D6C4" strokeWidth="2" strokeDasharray="1.5 9" strokeLinecap="round" />
          <path d="M342,170 C430,170 430,302 520,302" stroke="#A9D6C4" strokeWidth="2" strokeDasharray="1.5 9" strokeLinecap="round" />
        </svg>

        {/* input column */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
          {PIPELINE_ITEMS.map((item, i) => (
            <div
              key={`in-${i}`}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${item.bg} flex items-center justify-center shadow-sm`}
            >
              <i className={`${item.icon} text-xl md:text-2xl ${item.color}`}></i>
            </div>
          ))}
        </div>

        {/* center AI node */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#2F5FA8]/30 blur-xl"></div>
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#2F5FA8] flex items-center justify-center shadow-xl">
              <i className="fa-solid fa-wand-magic-sparkles text-white text-xl md:text-2xl"></i>
            </div>
          </div>
          <span className="text-[10px] md:text-[11px] font-manrope font-bold text-[#2F5FA8] bg-white px-2.5 py-1 rounded-full shadow-sm border border-[#E4ECFB] whitespace-nowrap">
            Feather AI
          </span>
        </div>

        {/* output column, on a checkerboard to signal transparency */}
        <div className="absolute right-0 top-0 h-full flex flex-col justify-between">
          {PIPELINE_ITEMS.map((item, i) => (
            <div
              key={`out-${i}`}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-checkerboard border border-white flex items-center justify-center shadow-sm"
            >
              <i className={`${item.icon} text-xl md:text-2xl ${item.color}`}></i>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1 font-manrope">
        <span className="text-slate-500 text-xs">
          <i className="fa-solid fa-bolt mr-1 text-amber-400"></i>
          3 photos processed
        </span>
        <span className="text-slate-500 text-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Ready in 3.2s
        </span>
      </div>
    </div>
  );
};

export default PipelineShowcase;
