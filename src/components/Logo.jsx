export default function Logo({ size = 34 }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <g stroke="#D4AF37" strokeWidth="3" strokeLinecap="round">
          <line x1="2" y1="16" x2="12" y2="16" /><line x1="4" y1="24" x2="13" y2="24" /><line x1="7" y1="32" x2="14" y2="32" />
        </g>
        <circle cx="29" cy="23" r="13" fill="none" stroke="#F4F1EB" strokeWidth="6" />
        <path d="M33 31 L43 43" stroke="#D4AF37" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <span>Quick<b>Run</b></span>
    </span>
  )
}
