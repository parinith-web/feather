import React, { useCallback, useRef, useState } from "react";

const CompareSlider = ({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
}) => {
  const containerRef = useRef(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX) => {
    if (!containerRef.current || clientX == null) return;
    const rect = containerRef.current.getBoundingClientRect();
    let percent = ((clientX - rect.left) / rect.width) * 100;
    percent = Math.min(100, Math.max(0, percent));
    setPos(percent);
  }, []);

  const onDown = (e) => {
    dragging.current = true;
    updateFromClientX(e.clientX ?? e.touches?.[0]?.clientX);
  };
  const onMove = (e) => {
    if (!dragging.current) return;
    updateFromClientX(e.clientX ?? e.touches?.[0]?.clientX);
  };
  const stop = () => (dragging.current = false);

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none overflow-hidden rounded-3xl bg-[repeating-conic-gradient(#e5e7eb_0%_25%,white_0%_50%)] bg-[length:22px_22px] ${className}`}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={onDown}
      onTouchMove={onMove}
      onTouchEnd={stop}
    >
      <div className="absolute inset-0">{after}</div>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        {before}
      </div>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.05)] cursor-ew-resize"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-[#2F5FA8]">
          <i className="fa-solid fa-arrows-left-right text-xs"></i>
        </div>
      </div>

      <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-black/55 text-white px-2 py-1 rounded-md pointer-events-none">
        {beforeLabel}
      </span>
      <span className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-black/55 text-white px-2 py-1 rounded-md pointer-events-none">
        {afterLabel}
      </span>
    </div>
  );
};

export default CompareSlider;
