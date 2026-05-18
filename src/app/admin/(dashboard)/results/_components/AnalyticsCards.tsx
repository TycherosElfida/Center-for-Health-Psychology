"use client";

import { useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { DT, type ResultsStats, type TestTabConfig } from "./types";
import { SaveChartButton } from "../[scoreId]/_components/SaveChartButton";

/* ── Filtered indicator badge ── */
function FilteredBadge({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        background: `${DT.TEAL}15`,
        color: DT.TEAL_DARK,
        fontSize: 9,
        fontWeight: 700,
        position: "absolute",
        top: 10,
        left: 12,
        zIndex: 10,
      }}
    >
      <Activity size={9} /> FILTERED
    </span>
  );
}

/* ── Y-axis integer tick helper ── */
function getIntegerTicks(maxVal: number): number[] {
  if (maxVal <= 0) return [0];
  let step = 1;
  if (maxVal > 50) step = 10;
  else if (maxVal > 20) step = 5;
  else if (maxVal > 8) step = 2;
  const ticks: number[] = [];
  for (let v = 0; v <= maxVal; v += step) ticks.push(v);
  const last = ticks[ticks.length - 1] ?? 0;
  if (last < maxVal) ticks.push(last + step);
  return ticks;
}

interface AnalyticsCardsProps {
  stats: ResultsStats | undefined;
  isLoading: boolean;
  hasAnyFilter: boolean;
  testConfig: TestTabConfig;
}

export function AnalyticsCards({
  stats,
  isLoading,
  hasAnyFilter,
  testConfig,
}: AnalyticsCardsProps) {
  const { color, maxScore, shortName } = testConfig;

  // Refs for SaveChartButton screenshot targets
  const avgScoreRef = useRef<HTMLDivElement>(null);
  const quickStatsRef = useRef<HTMLDivElement>(null);
  const scoreDistRef = useRef<HTMLDivElement>(null);

  if (isLoading || !stats) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="admin-skeleton"
            style={{
              height: 230,
              borderRadius: 16,
            }}
          />
        ))}
      </div>
    );
  }

  const avgScore = Math.round(stats.avgScore);
  const gaugeMax = maxScore || 100;
  const donutData = [{ value: avgScore }, { value: Math.max(0, gaugeMax - avgScore) }];

  // Score distribution
  const scoreDistribution = stats.scoreDistribution ?? [];
  const distMax = Math.max(...scoreDistribution.map((r) => r.count), 1);
  const yTicks = getIntegerTicks(distMax);
  const yDomain: [number, number] = [0, yTicks[yTicks.length - 1] ?? 1];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
    >
      {/* Card 1 — Average Score Gauge */}
      <div
        ref={avgScoreRef}
        style={{
          background: DT.WHITE,
          border: `1.5px solid ${color}22`,
          borderRadius: 16,
          padding: "20px 20px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow: `0 4px 20px ${color}10`,
        }}
      >
        <FilteredBadge active={hasAnyFilter} />
        {/* Save button — top-right */}
        <div style={{ position: "absolute", top: 10, right: 12, zIndex: 10 }}>
          <SaveChartButton targetRef={avgScoreRef} fileName={`${shortName}-avg-score`} />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: DT.LIGHT_TEXT,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          Average Score
        </div>
        <div style={{ position: "relative" }}>
          <PieChart width={130} height={130}>
            <Pie
              data={donutData}
              cx={65}
              cy={65}
              innerRadius={44}
              outerRadius={60}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill={`${color}20`} />
            </Pie>
          </PieChart>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color: color,
                lineHeight: 1,
              }}
            >
              {stats.totalRecords > 0 ? avgScore : "—"}
            </span>
            <span style={{ fontSize: 10, color: DT.LIGHT_TEXT }}>/{gaugeMax}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
            fontSize: 10,
            color: DT.LIGHT_TEXT,
          }}
        >
          <Users size={10} />
          {stats.totalRecords} record
          {stats.totalRecords !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Card 2 — Quick Stats */}
      <div
        ref={quickStatsRef}
        style={{
          background: DT.WHITE,
          border: `1.5px solid ${DT.SAGE}22`,
          borderRadius: 16,
          padding: 20,
          position: "relative",
          boxShadow: `0 4px 20px ${DT.SAGE}10`,
        }}
      >
        <FilteredBadge active={hasAnyFilter} />
        {/* Save button — top-right */}
        <div style={{ position: "absolute", top: 10, right: 12, zIndex: 10 }}>
          <SaveChartButton targetRef={quickStatsRef} fileName={`${shortName}-quick-stats`} />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: DT.LIGHT_TEXT,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 12,
          }}
        >
          Quick Stats
        </div>
        {[
          {
            label: "Total Records",
            val: stats.totalRecords,
            color: DT.SAGE,
            icon: Users,
          },
          {
            label: "Male",
            val: stats.maleCount,
            color: "#1565C0",
            icon: null,
          },
          {
            label: "Female",
            val: stats.femaleCount,
            color: "#AD1457",
            icon: null,
          },
          {
            label: "Highest Score",
            val: stats.totalRecords > 0 ? stats.highestScore : "—",
            color: "#6BA3BE",
            icon: TrendingUp,
          },
          {
            label: "Lowest Score",
            val: stats.totalRecords > 0 ? stats.lowestScore : "—",
            color: "#FC8181",
            icon: TrendingDown,
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 0",
              borderBottom: i < 4 ? `1px solid ${DT.BORDER}` : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {s.icon && <s.icon size={11} color={s.color} />}
              <span style={{ fontSize: 12, color: DT.MID_TEXT }}>{s.label}</span>
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: s.color,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s.val}
            </span>
          </div>
        ))}
      </div>

      {/* Card 3 — Score Distribution */}
      <div
        ref={scoreDistRef}
        style={{
          background: DT.WHITE,
          border: "1.5px solid #E8F4F2",
          borderRadius: 16,
          padding: "20px 20px 12px",
          position: "relative",
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        }}
      >
        <FilteredBadge active={hasAnyFilter} />
        {/* Save button — top-right */}
        <div style={{ position: "absolute", top: 10, right: 12, zIndex: 10 }}>
          <SaveChartButton targetRef={scoreDistRef} fileName={`${shortName}-score-distribution`} />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: DT.LIGHT_TEXT,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 4,
          }}
        >
          Score Distribution
        </div>

        {scoreDistribution.length === 0 ? (
          <div
            style={{
              height: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 12, color: DT.LIGHT_TEXT }}>No data</span>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: DT.LIGHT_TEXT,
                  fontStyle: "italic",
                }}
              >
                ↑ Total Users
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: DT.LIGHT_TEXT,
                  fontStyle: "italic",
                }}
              >
                Score Range →
              </span>
            </div>
            <ResponsiveContainer width="100%" height={175}>
              <BarChart
                data={scoreDistribution}
                barSize={20}
                margin={{ left: 0, right: 4, top: 4, bottom: 8 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 10,
                    fill: DT.MID_TEXT,
                    fontWeight: 500,
                  }}
                  axisLine={{ stroke: DT.BORDER }}
                  tickLine={{
                    stroke: DT.BORDER,
                    strokeWidth: 0.5,
                  }}
                  interval={0}
                />
                <YAxis
                  domain={yDomain}
                  ticks={yTicks}
                  allowDecimals={false}
                  tick={{
                    fontSize: 10,
                    fill: DT.LIGHT_TEXT,
                  }}
                  axisLine={{ stroke: DT.BORDER }}
                  tickLine={{
                    stroke: DT.BORDER,
                    strokeWidth: 0.5,
                  }}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: `1px solid ${DT.BORDER}`,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                    fontSize: 12,
                    fontFamily: "'Inter', sans-serif",
                  }}
                  formatter={(value) => [`${value} user${value !== 1 ? "s" : ""}`, "Total Users"]}
                  labelFormatter={(label) => `Score Range: ${String(label)}`}
                  labelStyle={{
                    fontWeight: 700,
                    color: DT.DARK_TEXT,
                    marginBottom: 2,
                  }}
                  cursor={{ fill: `${color}08` }}
                />
                <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
