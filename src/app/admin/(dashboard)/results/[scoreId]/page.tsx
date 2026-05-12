"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  ArrowLeft,
  User,
  Mail,
  Hash,
  MapPin,
  Calendar,
  Send,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Shield,
  Trash2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { DT, CATEGORY_COLORS } from "../_components/types";
import { RadarChart } from "./_components/RadarChart";

/* ── Helpers ── */
function getCatStyle(slug: string, label: string | null) {
  const map = CATEGORY_COLORS[slug] ?? {};
  return map[label ?? ""] ?? { bg: DT.TEAL_LIGHT, text: DT.TEAL_DARK };
}

function GaugeChart({
  score,
  max,
  globalAverage,
  catStyle,
}: {
  score: number;
  max: number;
  globalAverage: number | null;
  catStyle: { bg: string; text: string };
}) {
  const pct = Math.round((score / max) * 100);
  const angle = (pct / 100) * 180;
  const cx = 100,
    cy = 90,
    needleLen = 58;
  const rad = ((180 - angle) * Math.PI) / 180;
  const nx = cx + needleLen * Math.cos(rad);
  const ny = cy - needleLen * Math.sin(rad);
  const arcs = [
    { value: 33, color: "#E8F5E9" },
    { value: 34, color: "#FFF8E1" },
    { value: 33, color: "#FFEBEE" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="200" height="115" viewBox="0 0 200 115">
        {(() => {
          let startAngle = 180;
          return arcs.map((seg, i) => {
            const sweep = (seg.value / 100) * 180;
            const r = 70;
            const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
            const y1 = cy - r * Math.sin((startAngle * Math.PI) / 180);
            const endAngle = startAngle - sweep;
            const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
            const y2 = cy - r * Math.sin((endAngle * Math.PI) / 180);
            const path = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
            startAngle = endAngle;
            return (
              <path
                key={i}
                d={path}
                fill="none"
                stroke={seg.color}
                strokeWidth="18"
                strokeLinecap="round"
              />
            );
          });
        })()}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={catStyle.text}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill={catStyle.text} />
        <circle cx={cx} cy={cy} r="2.5" fill="#fff" />
      </svg>
      <div style={{ marginTop: -8, textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 28, color: catStyle.text, lineHeight: 1 }}>
          {score}
          <span style={{ fontSize: 14, fontWeight: 500, color: DT.LIGHT_TEXT }}>/{max}</span>
        </div>
        {globalAverage !== null && (
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: DT.MID_TEXT }}>
            Average: {globalAverage}/{max}
            <span
              style={{
                marginLeft: 6,
                padding: "2px 6px",
                borderRadius: 4,
                background: score > globalAverage ? `${DT.TEAL}20` : score < globalAverage ? "#ffebee" : `${DT.BORDER}80`,
                color: score > globalAverage ? DT.TEAL_DARK : score < globalAverage ? "#c62828" : DT.LIGHT_TEXT,
              }}
            >
              {score > globalAverage ? "+" : ""}{score - globalAverage} pts ({Math.round(((score - globalAverage) / max) * 100)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Dimension bar chart (pure CSS) ── */
function DimensionBars({
  dimensions,
}: {
  dimensions: { dimension: string; score: number; maxScore: number; label?: string }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {dimensions.map((d) => {
        const pct = d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0;
        return (
          <div key={d.dimension}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: DT.DARK_TEXT }}>
                {d.dimension}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: DT.TEAL_DARK }}>
                {d.score}/{d.maxScore}
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: `${DT.TEAL}18`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${DT.TEAL}, ${DT.TEAL_DARK})`,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            {d.label && (
              <span style={{ fontSize: 10, color: DT.LIGHT_TEXT, marginTop: 2, display: "block" }}>
                {d.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DETAILED REPORT PAGE
   ══════════════════════════════════════════════════════ */
export default function DetailedReportPage() {
  const params = useParams<{ scoreId: string }>();
  const router = useRouter();
  const scoreId = params.scoreId;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteMutation = trpc.adminResults.deleteResult.useMutation({
    onSuccess: () => {
      router.push("/admin/results");
    },
    onError: (err) => {
      alert(`Failed to delete: ${err.message}`);
      setIsDeleteDialogOpen(false);
    },
  });

  const { data, isLoading, error } = trpc.results.getDetailedReport.useQuery(
    { scoreId },
    { enabled: !!scoreId, retry: 1 }
  );

  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pdfState, setPdfState] = useState<"idle" | "loading">("idle");
  const items = data?.items;
  const processedItems = useMemo(() => {
    if (!items) return [];
    const list = [...items];
    if (sortCol === "no")
      list.sort((a, b) => (sortDir === "asc" ? a.order - b.order : b.order - a.order));
    if (sortCol === "points")
      list.sort((a, b) =>
        sortDir === "asc" ? a.rawAnswer - b.rawAnswer : b.rawAnswer - a.rawAnswer
      );
    return list;
  }, [items, sortCol, sortDir]);

  function handleSort(col: string) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  async function handleDownloadPdf() {
    setPdfState("loading");
    try {
      const res = await fetch(`/api/admin/report-pdf?scoreId=${scoreId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${data?.testSlug ?? "assessment"}-${scoreId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfState("idle");
    }
  }

  /* ── Loading / Error states ── */
  if (isLoading) {
    return (
      <div className="admin-fade-in" style={{ padding: "1.5rem 0" }}>
        <div className="admin-skeleton" style={{ height: 24, width: 200, marginBottom: 24 }} />
        <div
          className="admin-skeleton"
          style={{ height: 200, marginBottom: 16, borderRadius: 16 }}
        />
        <div className="admin-skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "5rem 0",
          gap: 16,
        }}
      >
        <AlertTriangle size={40} color={DT.LIGHT_TEXT} />
        <p style={{ fontSize: 16, color: DT.MID_TEXT, fontWeight: 600 }}>Report not found</p>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 12,
            background: DT.TEAL_LIGHT,
            color: DT.TEAL_DARK,
            fontWeight: 600,
            fontSize: 13,
            border: "none",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={14} /> Go Back
        </button>
      </div>
    );
  }

  const { profile, dimensionScores, interpretation } = data;
  const catStyle = getCatStyle(data.testSlug, data.resultLabel);
  const profileFields = [
    { icon: Calendar, label: "Age", value: profile.age ? `${profile.age} years` : "Not specified" },
    { icon: User, label: "Sex", value: profile.sex },
    {
      icon: MapPin,
      label: "Province / Regency",
      value: `${profile.province} — ${profile.regency}`,
    },
  ];

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 700,
    color: DT.MID_TEXT,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    borderBottom: `1px solid ${DT.BORDER}`,
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <div
      className="admin-fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0.5rem 0" }}
    >
      {/* ═══ BACK + ACTION BUTTONS ═══ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 12,
              background: DT.TEAL_LIGHT,
              color: DT.TEAL_DARK,
              fontWeight: 600,
              fontSize: 12,
              border: "none",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={13} /> Back to Results
          </button>
          <span style={{ fontSize: 12, color: DT.LIGHT_TEXT }}>
            / {data.testName} /{" "}
            <span style={{ color: DT.TEAL_DARK, fontWeight: 600 }}>{profile.name}</span>
          </span>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={pdfState === "loading"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 12,
            background: pdfState === "loading" ? `${DT.TEAL}60` : DT.TEAL_LIGHT,
            color: DT.TEAL_DARK,
            fontWeight: 600,
            fontSize: 12,
            border: `1.5px solid ${DT.TEAL}50`,
            cursor: pdfState === "loading" ? "wait" : "pointer",
          }}
        >
          <Download size={13} /> {pdfState === "loading" ? "Generating…" : "Download PDF"}
        </button>
        <button
          onClick={() => setIsDeleteDialogOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 12,
            background: "#ffebee",
            color: "#c62828",
            fontWeight: 600,
            fontSize: 12,
            border: `1.5px solid #ffcdd2`,
            cursor: "pointer",
          }}
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>

      {/* ═══ 1. PROFILE HEADER ═══ */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${DT.BORDER}`,
          background: DT.WHITE,
        }}
      >
        <div
          style={{
            height: 80,
            background: `linear-gradient(135deg, ${DT.TEAL}30, ${DT.TEAL_DARK}18, ${DT.TEAL_LIGHT})`,
          }}
        />
        <div style={{ padding: "0 24px 24px", marginTop: -36 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${DT.TEAL}, ${DT.TEAL_DARK})`,
                boxShadow: `0 4px 20px ${DT.TEAL}40`,
                border: `3px solid ${DT.WHITE}`,
                flexShrink: 0,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 24, color: DT.WHITE }}>
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 22,
                  color: DT.DARK_TEXT,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {profile.name}
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginTop: 6,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: DT.LIGHT_TEXT,
                  }}
                >
                  <Mail size={12} /> {profile.email}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: DT.LIGHT_TEXT,
                  }}
                >
                  <Hash size={12} /> {profile.id}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: DT.LIGHT_TEXT,
                  }}
                >
                  <Calendar size={12} /> Test Date: {profile.testDate}
                </span>
              </div>
            </div>
            {/* Result badge */}
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 12,
                background: catStyle.bg,
                border: `1.5px solid ${catStyle.text}20`,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: catStyle.text,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  opacity: 0.8,
                }}
              >
                Result
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: catStyle.text }}>
                {data.resultLabel ?? "—"}
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div
            style={{
              marginTop: 20,
              borderRadius: 12,
              border: `1px solid ${DT.BORDER}`,
              padding: 16,
              background: DT.BG_CONTENT,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Shield size={14} color={DT.TEAL_DARK} />
              <span style={{ fontSize: 13, fontWeight: 700, color: DT.TEAL_DARK }}>
                Profile Summary
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {profileFields.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    style={{
                      borderRadius: 8,
                      padding: 12,
                      background: DT.WHITE,
                      border: `1px solid ${DT.BORDER}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Icon size={11} color={DT.TEAL} />
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: DT.LIGHT_TEXT,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {f.label}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: DT.DARK_TEXT,
                        lineHeight: 1.3,
                      }}
                    >
                      {f.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 2. SCORE + DIMENSION BREAKDOWN ═══ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: dimensionScores.length > 0 ? "1fr 2fr" : "1fr",
          gap: 20,
        }}
      >
        {/* Global Score Gauge */}
        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${DT.BORDER}`,
            padding: 20,
            background: DT.WHITE,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              alignSelf: "flex-start",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: catStyle.bg,
              }}
            >
              <FileText size={12} color={catStyle.text} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: DT.DARK_TEXT }}>Global Score</span>
          </div>
          <GaugeChart score={data.totalScore} max={data.maxPossibleScore} globalAverage={data.globalAverage} catStyle={catStyle} />
          <div
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              background: catStyle.bg,
              color: catStyle.text,
              fontSize: 11,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {data.resultLabel ?? "—"}
          </div>
        </div>

        {/* Dimension Scores */}
        {dimensionScores.length > 0 && (
          <div
            style={{
              borderRadius: 16,
              border: `1px solid ${DT.BORDER}`,
              padding: 20,
              background: DT.WHITE,
              display: "flex",
              gap: 20,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#E3F2FD",
                  }}
                >
                  <FileText size={12} color="#1565C0" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: DT.DARK_TEXT }}>
                  Dimension Scores
                </span>
              </div>
              <DimensionBars dimensions={dimensionScores} />
            </div>
            {dimensionScores.length >= 2 && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RadarChart dimensions={dimensionScores} catStyle={catStyle} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ 3. INTERPRETATION ═══ */}
      {interpretation && (
        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${DT.BORDER}`,
            padding: 20,
            background: DT.WHITE,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <CheckCircle2 size={15} color={DT.TEAL_DARK} />
            <span style={{ fontSize: 14, fontWeight: 700, color: DT.DARK_TEXT }}>
              Interpretation
            </span>
          </div>
          <div
            style={{
              borderRadius: 12,
              padding: 16,
              background: DT.BG_CONTENT,
              border: `1px solid ${DT.BORDER}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: DT.TEAL_DARK, marginBottom: 6 }}>
              {interpretation.label}
            </div>
            <p style={{ fontSize: 13, color: DT.MID_TEXT, lineHeight: 1.7, margin: "0 0 8px" }}>
              {interpretation.description}
            </p>
            {interpretation.recommendation && (
              <p
                style={{
                  fontSize: 12,
                  color: DT.LIGHT_TEXT,
                  lineHeight: 1.6,
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                <strong>Recommendation:</strong> {interpretation.recommendation}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══ 4. ITEM-LEVEL RESPONSE ANALYSIS ═══ */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${DT.BORDER}`,
          background: DT.WHITE,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${DT.BORDER}`,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: DT.DARK_TEXT, margin: 0 }}>
              Item-Level Response Analysis
            </h3>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                background: DT.TEAL_LIGHT,
                color: DT.TEAL_DARK,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {data.items.length} items
            </span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 50 }} />
              <col />
              <col style={{ width: 140 }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr style={{ background: DT.BG_HEADER }}>
                <th
                  style={{ ...thStyle, textAlign: "center", cursor: "pointer" }}
                  onClick={() => handleSort("no")}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    #
                    {sortCol === "no" &&
                      (sortDir === "asc" ? (
                        <ChevronUp size={10} color={DT.TEAL_DARK} />
                      ) : (
                        <ChevronDown size={10} color={DT.TEAL_DARK} />
                      ))}
                  </span>
                </th>
                <th style={{ ...thStyle, cursor: "default" }}>Question Text</th>
                <th style={{ ...thStyle, textAlign: "center" }}>User&apos;s Answer</th>
                <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => handleSort("points")}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    Points
                    {sortCol === "points" &&
                      (sortDir === "asc" ? (
                        <ChevronUp size={10} color={DT.TEAL_DARK} />
                      ) : (
                        <ChevronDown size={10} color={DT.TEAL_DARK} />
                      ))}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {processedItems.map((item, i) => (
                <tr
                  key={item.order}
                  style={{
                    background: i % 2 === 0 ? DT.WHITE : DT.BG_ALT,
                    borderBottom: `1px solid ${DT.BORDER}`,
                  }}
                >
                  <td
                    style={{
                      padding: "10px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: DT.TEAL_DARK,
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {String(item.order).padStart(2, "0")}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      paddingRight: 28,
                      fontSize: 12,
                      color: DT.DARK_TEXT,
                      lineHeight: 1.6,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      verticalAlign: "middle",
                    }}
                  >
                    {item.questionText}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 999,
                        background: `${DT.TEAL}15`,
                        color: DT.TEAL_DARK,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {item.answerText}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      verticalAlign: "middle",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: DT.TEAL_DARK,
                          textAlign: "right",
                        }}
                      >
                        {item.rawAnswer}/{item.maxPoints}
                      </div>
                      <div
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: `${DT.TEAL}18`,
                          overflow: "hidden",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            width: `${item.maxPoints > 0 ? (item.rawAnswer / item.maxPoints) * 100 : 0}%`,
                            height: "100%",
                            borderRadius: 2,
                            background: DT.TEAL,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 5. SEND REPORT CARD ═══ */}
      <div
        style={{
          borderRadius: 16,
          border: `1px solid ${DT.BORDER}`,
          padding: 20,
          background: DT.WHITE,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Send size={15} color={DT.TEAL_DARK} />
          <span style={{ fontSize: 14, fontWeight: 700, color: DT.DARK_TEXT }}>
            Report Delivery
          </span>
        </div>
        <div
          style={{
            borderRadius: 12,
            padding: 12,
            background: DT.BG_CONTENT,
            border: `1px solid ${DT.BORDER}`,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: DT.LIGHT_TEXT,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            Recipient
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Mail size={12} color={DT.TEAL} />
            <span style={{ fontSize: 12, fontWeight: 600, color: DT.DARK_TEXT }}>
              {profile.email}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ DELETE MODAL ═══ */}
      {isDeleteDialogOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: DT.WHITE,
              borderRadius: 16,
              padding: 24,
              width: 380,
              boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: `${DT.RED}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={20} color={DT.RED} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: DT.DARK_TEXT }}>
                Delete Result?
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: DT.LIGHT_TEXT, lineHeight: 1.5 }}>
              This action cannot be undone. Are you sure you want to permanently delete this test result?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: DT.BG_CONTENT,
                  border: `1px solid ${DT.BORDER}`,
                  color: DT.DARK_TEXT,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ scoreId })}
                disabled={deleteMutation.isPending}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: DT.RED,
                  border: "none",
                  color: DT.WHITE,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deleteMutation.isPending ? "wait" : "pointer",
                  opacity: deleteMutation.isPending ? 0.7 : 1,
                }}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
