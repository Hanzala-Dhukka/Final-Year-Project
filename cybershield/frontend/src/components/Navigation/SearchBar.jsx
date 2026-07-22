import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft } from "lucide-react";
import Modal from "../ui/Modal";
import { searchIndex } from "./navConfig";

/**
 * Global search entry point. Opens a command-palette on click or Ctrl/Cmd+K.
 * Searches pages, OWASP labs, glossary, and quizzes (mock data).
 */
export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchIndex.slice(0, 6);
    return searchIndex.filter(
      (r) => r.label.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)
    );
  }, [query]);

  const go = (item) => {
    if (item?.to) navigate(item.to);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <>
      <button className="cs-searchbar" onClick={() => setOpen(true)} aria-label="Open search">
        <Search size={16} />
        <span className="cs-searchbar__label">Search pages, reports, labs…</span>
        <kbd className="cs-searchbar__kbd">Ctrl K</kbd>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} size="md" title={null}>
        <div className="cs-search-modal">
          <div className="cs-search-modal__input">
            <Search size={18} />
            <input
              autoFocus
              placeholder="Search CyberShield…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          <ul className="cs-search-modal__list">
            {results.length === 0 && <li className="cs-search-modal__empty">No results</li>}
            {results.map((r, i) => {
              const Icon = r.icon;
              return (
                <li
                  key={i}
                  className={`cs-search-modal__item ${i === active ? "is-active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                >
                  <span className="cs-search-modal__icon">
                    {Icon ? <Icon size={16} /> : <Search size={16} />}
                  </span>
                  <span className="cs-search-modal__text">
                    <span className="cs-search-modal__title">{r.label}</span>
                    <span className="cs-search-modal__type">{r.type}</span>
                  </span>
                  {i === active && <CornerDownLeft size={14} className="cs-search-modal__enter" />}
                </li>
              );
            })}
          </ul>
        </div>
      </Modal>
    </>
  );
}
