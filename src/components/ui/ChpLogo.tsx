/**
 * CHP Logo — Center for Health Psychology / UKRIDA
 *
 * Renders a circular branded logo mark at any size.
 * Uses the Ψ (Psi) symbol — the universal psychology symbol.
 *
 * This is a pure presentational component with zero interactivity.
 * Safe to use inside Server Components.
 */
export function ChpLogo({ size = 36, className = "" }: { size?: number; className?: string }) {
  const r = size / 2;
  const borderW = Math.max(1.5, size * 0.04);
  const innerR = r - borderW * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
      aria-label="CHP Logo"
      role="img"
    >
      {/* Outer ring */}
      <circle
        cx={r}
        cy={r}
        r={r - borderW / 2}
        stroke="var(--brand-primary-dark, #6B5CA0)"
        strokeWidth={borderW}
        fill="#FFFFFF"
      />
      {/* Inner fill */}
      <circle cx={r} cy={r} r={innerR} fill="var(--surface-subtle, #F5F3FA)" />

      {/* Psi symbol (Ψ) — universal psychology symbol */}
      <text
        x={r}
        y={r * 0.95}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-outfit), 'Outfit', sans-serif"
        fontWeight="800"
        fontSize={size * 0.38}
        fill="var(--brand-primary-dark, #6B5CA0)"
      >
        Ψ
      </text>

      {/* "CHP" text below the symbol */}
      <text
        x={r}
        y={r + innerR * 0.6}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-outfit), 'Outfit', sans-serif"
        fontWeight="700"
        fontSize={size * 0.15}
        fill="var(--brand-primary, #9B8EC4)"
        letterSpacing="0.08em"
      >
        CHP
      </text>
    </svg>
  );
}
