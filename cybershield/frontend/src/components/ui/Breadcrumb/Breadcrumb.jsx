import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./Breadcrumb.css";

/**
 * CyberShield Breadcrumb
 * items: [{ label, to? }] — last item is the current page (not linked).
 */
export default function Breadcrumb({ items = [], className = "" }) {
  return (
    <nav className={`cs-breadcrumb ${className}`} aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="cs-breadcrumb__item">
            {item.to && !isLast ? (
              <Link to={item.to} className="cs-breadcrumb__link">
                {item.label}
              </Link>
            ) : (
              <span className="cs-breadcrumb__current" aria-current="page">
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight size={14} className="cs-breadcrumb__sep" />}
          </span>
        );
      })}
    </nav>
  );
}
