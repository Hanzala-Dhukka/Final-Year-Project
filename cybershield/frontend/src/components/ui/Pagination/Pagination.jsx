import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

/**
 * CyberShield Pagination
 * page (1-based), totalPages, onChange. Shows windowed page numbers.
 */
export default function Pagination({ page = 1, totalPages = 1, onChange, className = "" }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className={`cs-pagination ${className}`} aria-label="Pagination">
      <button
        className="cs-pagination__btn"
        disabled={page <= 1}
        onClick={() => onChange?.(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {start > 1 && (
        <>
          <button className="cs-pagination__btn" onClick={() => onChange?.(1)}>
            1
          </button>
          {start > 2 && <span className="cs-pagination__ellipsis">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          className={`cs-pagination__btn ${p === page ? "is-active" : ""}`}
          onClick={() => onChange?.(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="cs-pagination__ellipsis">…</span>}
          <button className="cs-pagination__btn" onClick={() => onChange?.(totalPages)}>
            {totalPages}
          </button>
        </>
      )}
      <button
        className="cs-pagination__btn"
        disabled={page >= totalPages}
        onClick={() => onChange?.(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
