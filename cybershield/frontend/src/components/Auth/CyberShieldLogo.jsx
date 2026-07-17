/**
 * CyberShield brand logo (inline SVG shield) used on the auth screens.
 * `light` renders a white/translucent version for dark backgrounds.
 */
export default function CyberShieldLogo({ size = 48, light = false }) {
  const stroke = light ? "#ffffff" : "#ffffff";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="csShield" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 L56 14 V30 C56 46 45 56 32 60 C19 56 8 46 8 30 V14 Z"
        fill="url(#csShield)"
      />
      <path
        d="M22 32 L29 40 L43 24"
        stroke={stroke}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
