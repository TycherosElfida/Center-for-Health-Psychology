"use client";

import { useState, useMemo } from "react";
import { ClipboardList, BarChart2, Monitor, ShieldCheck } from "lucide-react";
import { TestResultsView } from "./_components/TestResultsView";
import { TEST_TABS, DT } from "./_components/types";

/* ── Icon map matching the TESTS catalog ── */
const TEST_ICONS: Record<string, React.ElementType> = {
  srq29: ClipboardList,
  pss10: BarChart2,
  gpius2: Monitor,
  srs: ShieldCheck,
};

export default function TestResultsPage() {
  // TEST_TABS is a compile-time constant with 4 entries — safe to assert non-null.
  const [activeSlug, setActiveSlug] = useState(TEST_TABS[0]!.slug);
  const activeConfig = useMemo(
    () => TEST_TABS.find((t) => t.slug === activeSlug) ?? TEST_TABS[0]!,
    [activeSlug]
  );

  return (
    <div
      className="admin-fade-in"
      style={{
        padding: "0.5rem 0",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Page Header + Tab Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: DT.DARK_TEXT,
              margin: 0,
              letterSpacing: "-0.015em",
            }}
          >
            Test Results
          </h1>
          <p
            style={{
              fontSize: 13,
              color: DT.LIGHT_TEXT,
              margin: "4px 0 0",
            }}
          >
            Browse, filter, and export assessment results
          </p>
        </div>
      </div>

      {/* Test-type tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {TEST_TABS.map((tab) => {
          const isActive = tab.slug === activeSlug;
          const IconComp = TEST_ICONS[tab.slug] ?? ClipboardList;
          return (
            <button
              key={tab.slug}
              onClick={() => setActiveSlug(tab.slug)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 12,
                border: `1.5px solid ${isActive ? tab.color : DT.BORDER}`,
                background: isActive ? `${tab.color}12` : DT.WHITE,
                color: isActive ? tab.color : DT.MID_TEXT,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive ? `0 2px 12px ${tab.color}20` : "none",
                whiteSpace: "nowrap",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = tab.color;
                  e.currentTarget.style.background = `${tab.color}08`;
                  e.currentTarget.style.color = tab.color;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = DT.BORDER;
                  e.currentTarget.style.background = DT.WHITE;
                  e.currentTarget.style.color = DT.MID_TEXT;
                }
              }}
            >
              <IconComp size={16} />
              {tab.shortName}
            </button>
          );
        })}
      </div>

      {/* Active test view */}
      <TestResultsView key={activeSlug} testConfig={activeConfig} />
    </div>
  );
}
