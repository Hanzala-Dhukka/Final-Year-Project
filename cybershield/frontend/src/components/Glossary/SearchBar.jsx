/**
 * Search bar (spec Step 17). Debounced input that calls onSearch.
 */
import { useState, useEffect } from "react";

export default function SearchBar({ onSearch, initial = "" }) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const t = setTimeout(() => onSearch(value.trim()), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search cybersecurity terms…"
        className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="absolute left-3 top-3 text-gray-400">🔍</span>
    </div>
  );
}
