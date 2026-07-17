import { useState, useRef } from "react";

const ACCEPT = ".py,.js,.jsx,.ts,.tsx,.java,.php,.go,.cs,.cpp,.c,.h,.hpp,.html,.css,.sql,.sh,.bash";

/**
 * Drag-and-drop / browse file upload box for code review.
 * Rejects unsupported extensions before calling onFile.
 */
export default function UploadBox({ onFile, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    setError("");
    const file = files && files[0];
    if (!file) return;
    const ok = file.name.toLowerCase().endsWith(
      ACCEPT.split(",").map((e) => e.trim())
    );
    if (!ok) {
      setError("Unsupported file type. Allowed: " + ACCEPT);
      return;
    }
    onFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-blue-400"}`}
      >
        <p className="text-gray-600">📁 Drop a file here</p>
        <p className="text-sm text-gray-400 mt-1">or click to browse</p>
        <p className="text-xs text-gray-400 mt-2">
          {ACCEPT.replace(/\./g, "").toUpperCase().split(",").join("  ")}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
