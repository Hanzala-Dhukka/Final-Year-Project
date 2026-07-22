import { forwardRef } from "react";
import "./Card.css";

/**
 * CyberShield Card — compound component.
 * Variants: default | glass | elevated | outlined | gradient
 *   <Card>
 *     <Card.Header title="..." action={<Button/>} />
 *     <Card.Content>...</Card.Content>
 *     <Card.Footer>...</Card.Footer>
 *   </Card>
 */
const Card = forwardRef(function Card(
  { children, variant = "default", hover = true, className = "", padding, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={[
        "cs-card",
        `cs-card--${variant}`,
        hover ? "cs-card--hover" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={padding != null ? { padding } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
});

function Header({ title, subtitle, icon, action }) {
  return (
    <div className="cs-card__header">
      <div className="cs-card__heading">
        {icon && <span className="cs-card__icon">{icon}</span>}
        <div>
          {title && <h3 className="cs-card__title">{title}</h3>}
          {subtitle && <p className="cs-card__subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="cs-card__action">{action}</div>}
    </div>
  );
}

function Content({ children, className = "" }) {
  return <div className={`cs-card__content ${className}`}>{children}</div>;
}

function Footer({ children, className = "" }) {
  return <div className={`cs-card__footer ${className}`}>{children}</div>;
}

Card.Header = Header;
Card.Content = Content;
Card.Footer = Footer;

export default Card;
