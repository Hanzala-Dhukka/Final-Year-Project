import { useState, useRef } from "react";

function UploadAvatar({ onClose, onUpload, onDelete, hasAvatar }) {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setError("");

    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, JPEG, PNG, and WEBP files are allowed");
      return;
    }

    // Validate file size (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2 MB");
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleDelete = () => {
    onDelete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Change Avatar</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center mb-6">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mb-4"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Choose Image
          </button>
        </div>

        <div className="space-y-3">
          {selectedFile && (
            <button
              onClick={handleUpload}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Upload
            </button>
          )}

          {hasAvatar && (
            <button
              onClick={handleDelete}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Remove Current Avatar
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Accepted formats: JPG, JPEG, PNG, WEBP (max 2 MB)
        </p>
      </div>
    </div>
  );
}

export default UploadAvatar;
