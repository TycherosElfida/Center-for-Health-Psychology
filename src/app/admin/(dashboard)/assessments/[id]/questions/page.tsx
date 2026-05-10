"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { DARK_TEXT, LIGHT_TEXT, RED, STATUS_CONFIG } from "../../../../_components/DesignTokens";
import { QuestionManager } from "../_components/QuestionManager";

export default function QuestionManagementPage() {
  const params = useParams();
  const testId = params.id as string;

  const { data, isLoading, error } = trpc.adminQuestions.getQuestions.useQuery(
    { testId },
    { enabled: !!testId }
  );

  const test = data?.test;
  const questions = data?.questions ?? [];

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div
          className="admin-shimmer"
          style={{ height: 32, width: 300, margin: "0 auto 16px", borderRadius: 8 }}
        />
        <div
          className="admin-shimmer"
          style={{ height: 20, width: 200, margin: "0 auto 32px", borderRadius: 6 }}
        />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: RED }}>
        <AlertTriangle size={32} style={{ margin: "0 auto 12px", display: "block" }} />
        <p style={{ fontSize: 14, fontWeight: 600 }}>{error?.message ?? "Assessment not found."}</p>
        <button
          className="admin-btn-secondary"
          style={{ marginTop: 16 }}
          onClick={() => {
            window.location.href = "/admin/assessments";
          }}
        >
          ← Back to Assessments
        </button>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[test.status as keyof typeof STATUS_CONFIG];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <button
          className="admin-btn-ghost"
          onClick={() => {
            window.location.href = `/admin/assessments/${testId}`;
          }}
          style={{ marginBottom: 12 }}
        >
          <ArrowLeft size={14} /> Back to Assessment
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: DARK_TEXT,
                margin: "0 0 4px",
                fontFamily: "'DM Sans', 'Inter', sans-serif",
              }}
            >
              Question Management
            </h1>
            <p style={{ fontSize: 13, color: LIGHT_TEXT, margin: 0 }}>
              {test.title} · {questions.length} question{questions.length !== 1 ? "s" : ""}
              {statusConf && (
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: 8,
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    background: statusConf.bg,
                    color: statusConf.color,
                    border: `1px solid ${statusConf.border}`,
                  }}
                >
                  {statusConf.label}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Extracted Component ── */}
      <QuestionManager testId={testId} sessionCount={data?.sessionCount ?? 0} />
    </div>
  );
}
