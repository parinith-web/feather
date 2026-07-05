import React, { useRef } from "react";

const PRESET_COLORS = ["#000000", "#2F5FA8", "#F87171", "#34D399", "#FBBF24", "#A855F7"];

const BgOptionPicker = ({ value, onChange }) => {
  const fileInputRef = useRef(null);

  const setType = (type) => onChange({ ...value, type });
  const setColor = (color) => onChange({ ...value, type: "color", color });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      onChange({ ...value, type: "image", imageDataUrl: reader.result });
    reader.readAsDataURL(file);
  };

  const swatchBase =
    "w-11 h-11 rounded-xl border-2 transition flex items-center justify-center cursor-pointer";
  const active = "border-[#2F5FA8] ring-2 ring-[#A4BADD]";
  const inactive = "border-gray-200 hover:border-gray-300";

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-[#657692]">
        Background
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setType("transparent")}
          title="Transparent"
          className={`${swatchBase} bg-[repeating-conic-gradient(#e5e7eb_0%_25%,white_0%_50%)] bg-[length:12px_12px] ${
            value.type === "transparent" ? active : inactive
          }`}
        />
        <button
          type="button"
          onClick={() => setType("white")}
          title="White"
          className={`${swatchBase} bg-white ${value.type === "white" ? active : inactive}`}
        />

        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            title={c}
            style={{ backgroundColor: c }}
            className={`${swatchBase} ${
              value.type === "color" && value.color === c ? active : inactive
            }`}
          />
        ))}

        <label
          title="Custom color"
          className={`${swatchBase} relative overflow-hidden ${inactive}`}
        >
          <input
            type="color"
            value={value.type === "color" ? value.color : "#2F5FA8"}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <i className="fa-solid fa-eye-dropper text-[#2F5FA8] text-sm pointer-events-none"></i>
        </label>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Custom image"
          style={
            value.type === "image" && value.imageDataUrl
              ? { backgroundImage: `url(${value.imageDataUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : {}
          }
          className={`${swatchBase} ${value.type === "image" ? active : inactive}`}
        >
          {!(value.type === "image" && value.imageDataUrl) && (
            <i className="fa-solid fa-image text-[#2F5FA8] text-sm"></i>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
};

export default BgOptionPicker;
