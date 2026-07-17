// Account information section (Module 3.1 — Step 9).
export default function AccountInfo({ profile, authUser }) {
  const fmt = (v) => (v ? new Date(v).toLocaleString() : "N/A");

  const rows = [
    { label: "Role", value: profile.role },
    { label: "Email Verified", value: authUser?.is_verified ? "Yes" : "No" },
    { label: "Member Since", value: authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString() : "N/A" },
    { label: "Last Login", value: authUser?.last_login ? fmt(authUser.last_login) : "N/A" },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Account Information</h3>
      <div className="space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-gray-600">{label}:</span>
            <span className={`font-semibold ${label === "Email Verified" && value === "No" ? "text-red-600" : ""}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
