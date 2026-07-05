import React from "react";

// A small, original, flat-silhouette cat mascot used as a decorative brand
// accent on light/airy sections. Color inherits from `currentColor` via the
// `text-*` utility passed in `className`, so it can be recolored to match
// any section's palette.
const CatMascot = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 220 260"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* body, tapering off the bottom edge */}
      <path
        d="M45 260C40 190 46 140 70 118C58 96 54 74 66 56C78 66 86 80 90 96C110 88 130 88 150 96C154 80 162 66 174 56C186 74 182 96 170 118C194 140 200 190 195 260H45Z"
        fill="currentColor"
      />
      {/* left ear */}
      <path d="M66 56C58 40 52 22 52 6C68 14 82 30 90 48Z" fill="currentColor" />
      {/* right ear */}
      <path d="M174 56C182 40 188 22 188 6C172 14 158 30 150 48Z" fill="currentColor" />

      {/* eyes */}
      <ellipse cx="90" cy="112" rx="13" ry="15" fill="white" />
      <ellipse cx="150" cy="112" rx="13" ry="15" fill="white" />
      <circle cx="93" cy="116" r="5" fill="#1E2A44" />
      <circle cx="147" cy="116" r="5" fill="#1E2A44" />

      {/* nose + mouth */}
      <path d="M116 132L124 132L120 138Z" fill="#1E2A44" />
      <path
        d="M120 138C120 144 114 148 108 146M120 138C120 144 126 148 132 146"
        stroke="#1E2A44"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* whiskers */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
        <path d="M62 126H24" />
        <path d="M64 136H28" />
        <path d="M66 146H32" />
        <path d="M158 126H196" />
        <path d="M156 136H192" />
        <path d="M154 146H188" />
      </g>
    </svg>
  );
};

export default CatMascot;
