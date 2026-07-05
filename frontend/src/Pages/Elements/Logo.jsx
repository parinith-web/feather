import React from "react";

const Logo = ({ light = false, size = "md", showIcon = true }) => {
  const box = size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-lg";
  const text = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div className="flex items-center gap-2">
      {showIcon && (
        <div className={`${box} flex items-center justify-center shrink-0`}>
          <img
            src={light ? "/logo/feather-white.png" : "/logo/feather-blue.png"}
            alt="Feather logo"
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <span
        className={`${text} font-bricereg font-black tracking-tight ${
          light ? "text-white" : "text-[#487DCC]"
        }`}
      >
        Feather
      </span>
    </div>
  );
};

export default Logo;
