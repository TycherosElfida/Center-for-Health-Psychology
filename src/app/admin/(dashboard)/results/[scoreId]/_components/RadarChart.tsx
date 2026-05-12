
import { DT } from "../../_components/types";
import type { DimensionScore } from "@/server/reports/assemble";

export function RadarChart({
  dimensions,
  catStyle,
}: {
  dimensions: DimensionScore[];
  catStyle: { bg: string; text: string };
}) {
  const cx = 150;
  const cy = 150;
  const radius = 90;

  const points = dimensions.map((d, i) => {
    const angle = (i / dimensions.length) * 2 * Math.PI - Math.PI / 2;
    const r = d.maxScore > 0 ? (d.score / d.maxScore) * radius : 0;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelX: cx + (radius + 28) * Math.cos(angle),
      labelY: cy + (radius + 28) * Math.sin(angle),
      label: d.dimension,
      val: `${d.score}/${d.maxScore}`,
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Background webs
  const levels = 4;
  const webPaths = Array.from({ length: levels }).map((_, levelIndex) => {
    const levelRadius = (radius / levels) * (levelIndex + 1);
    const levelPoints = dimensions.map((_, i) => {
      const angle = (i / dimensions.length) * 2 * Math.PI - Math.PI / 2;
      return `${cx + levelRadius * Math.cos(angle)},${cy + levelRadius * Math.sin(angle)}`;
    });
    return levelPoints.join(" ");
  });

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", padding: "10px 0" }}>
      <svg width={320} height={320} viewBox="0 0 300 300" style={{ overflow: "visible" }}>
        {/* Webs */}
        {webPaths.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke={DT.BORDER}
            strokeWidth={1}
            strokeDasharray={i < levels - 1 ? "4 4" : "none"}
          />
        ))}
        {/* Spokes */}
        {points.map((_, i) => {
          const angle = (i / dimensions.length) * 2 * Math.PI - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + radius * Math.cos(angle)}
              y2={cy + radius * Math.sin(angle)}
              stroke={DT.BORDER}
              strokeWidth={1}
            />
          );
        })}
        {/* Data Polygon */}
        <polygon
          points={polygonPoints}
          fill={catStyle.bg}
          fillOpacity={0.7}
          stroke={catStyle.text}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={catStyle.text} stroke={DT.WHITE} strokeWidth={1.5} />
        ))}
        {/* Labels */}
        {points.map((p, i) => (
          <g key={`label-${i}`}>
            <text
              x={p.labelX}
              y={p.labelY}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={DT.DARK_TEXT}
              fontSize={10}
              fontWeight={700}
            >
              {p.label.length > 20 ? p.label.substring(0, 18) + "…" : p.label}
            </text>
            <text
              x={p.labelX}
              y={p.labelY + 14}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={catStyle.text}
              fontSize={10}
              fontWeight={700}
            >
              {p.val}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
