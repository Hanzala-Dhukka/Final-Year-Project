import { useState } from "react";

// Profile header card (Module 3.1 — Step 9).
export default function ProfileCard({ profile, authUser, onEdit, onUpload }) {
  const [imgError, setImgError] = useState(false);

  const avatarUrl = profile.profile_image
    ? `http://localhost:8000${profile.profile_image}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        profile.full_name || "User"
      )}&background=0D8ABC&color=fff&size=128`;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center gap-6 mb-6">
        <div className="relative">
          <img
            src={imgError ? "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile.full_name || "U") : avatarUrl}
            alt="Profile"
            onError={() => setImgError(true)}
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
          />
          <button
            onClick={onUpload}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
            title="Change picture"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{profile.full_name}</h2>
          <p className="text-gray-600 capitalize">{profile.role}</p>
          <p className="text-gray-500">{profile.email}</p>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Edit Profile
      </button>
    </div>
  );
}
