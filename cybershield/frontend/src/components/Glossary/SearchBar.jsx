import { useState, useEffect } from "react";
import { Search } from "lucide-react";

/**
 * Search bar (spec Step 17). Debounced input that calls onSearch.
 */
export default function SearchBar({ onSearch, initial = "" }) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const t = setTimeout(() => onSearch(value.trim()), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="cs-gs-search">
      <span className="cs-gs-search__icon">
        <Search size={18} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search cybersecurity terms…"
      />
    </div>
  );
}