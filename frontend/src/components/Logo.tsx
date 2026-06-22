import { useMemo } from "react";
import { statePaths, densityPoints } from "../lib/geo";

interface Props {
  size?: number;
  showWordmark?: boolean;
  /** stippled point-cloud (hero) vs clean outline (compact / nav) */
  variant?: "stipple" | "outline";
}

/**
 * Dialingua mark - the map of Nigeria rendered as a language-density star-chart.
 * Each dot is a language; the field is denser over the Middle Belt (the most
 * language-dense region on earth). The border is implied, never drawn flat.
 */
export default function Logo({
  size = 40,
  showWordmark = false,
  variant = "outline",
}: Props) {
  const W = 100;
  const H = 100;
  const paths = useMemo(() => statePaths(W, H), []);
  const dots = useMemo(
    () => (variant === "stipple" ? densityPoints(W, H, 360, 11) : []),
    [variant],
  );

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 12 }}
      aria-label="Dialingua"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-hidden="true"
        style={{ overflow: "visible", flex: "0 0 auto" }}
      >
        <defs>
          <radialGradient id="dl-glow" cx="46%" cy="42%" r="70%">
            <stop offset="0%" stopColor="var(--ochre-400)" />
            <stop offset="55%" stopColor="var(--indigo-400)" />
            <stop offset="100%" stopColor="var(--indigo-700)" />
          </radialGradient>
          <clipPath id="dl-clip">
            {paths.map((p, i) => (
              <path key={i} d={p.d} />
            ))}
          </clipPath>
        </defs>

        {/* implied landmass fill, faint */}
        <g clipPath="url(#dl-clip)">
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="url(#dl-glow)"
            opacity={variant === "stipple" ? 0.16 : 0.22}
          />
        </g>

        {/* state hairlines */}
        <g
          fill="none"
          stroke="var(--indigo-300)"
          strokeWidth={0.5}
          opacity={variant === "stipple" ? 0.35 : 0.62}
          strokeLinejoin="round"
        >
          {paths.map((p, i) => (
            <path key={i} d={p.d} />
          ))}
        </g>

        {/* stippled language dots */}
        {variant === "stipple" && (
          <g>
            {dots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={d.r}
                fill={d.w > 0.5 ? "var(--ochre-400)" : "var(--indigo-300)"}
                opacity={0.45 + d.w * 0.5}
              >
                <animate
                  attributeName="opacity"
                  values={`${0.3 + d.w * 0.4};${0.6 + d.w * 0.4};${0.3 + d.w * 0.4}`}
                  dur={`${3 + (i % 5)}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>
        )}

        {/* Niger–Benue confluence "Y" - recurring secondary glyph */}
        <g
          stroke="var(--ochre-400)"
          strokeWidth={1.1}
          fill="none"
          opacity={0.8}
          strokeLinecap="round"
        >
          <path d="M30 40 L49 56 L70 38" opacity={0.55} />
          <path d="M49 56 L49 78" opacity={0.55} />
        </g>
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: size * 0.62,
            letterSpacing: "-0.02em",
            color: "var(--text-hi)",
            lineHeight: 1,
          }}
        >
          Dialingua
        </span>
      )}
    </span>
  );
}
