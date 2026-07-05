import React, { useRef, useState } from "react";

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_BYTES = 15 * 1024 * 1024;

const UploadDropzone = ({ onFile, compact = false }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      onFile?.(null, "Please upload a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      onFile?.(null, "Image must be smaller than 15MB.");
      return;
    }
    onFile?.(file, null);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center transition-all h-full ${
        compact ? "p-6" : "p-12"
      } ${
        dragOver
          ? "border-[#2F5FA8] bg-[#E8F1FF]"
          : "border-[#CFD0D5] bg-white hover:bg-[#F9FAFB]"
      }`}
    >
      <div
        className={`${
          compact ? "w-12 h-12 mb-3" : "w-16 h-16 mb-4"
        } rounded-2xl bg-[#E8F1FF] flex items-center justify-center text-[#2F5FA8]`}
      >
        <i className={`fa-solid fa-cloud-arrow-up ${compact ? "text-lg" : "text-2xl"}`}></i>
      </div>
      <p className="font-bold text-[#2F5FA8] font-manrope">
        Drag and drop your image here
      </p>
      <p className="text-sm text-slate-500 mt-1">
        or click to browse — PNG, JPG, WEBP up to 15MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

export default UploadDropzone;
