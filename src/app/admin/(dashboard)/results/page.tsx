"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TestResultsView } from "./_components/TestResultsView";
import { TEST_TABS, DT } from "./_components/types";

function TestResultsContent() {
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("tab") ?? TEST_TABS[0]!.slug;

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
      {/* Page Header */}
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

      {/* Active test view */}
      <TestResultsView key={activeSlug} testConfig={activeConfig} />
    </div>
  );
}

export default function TestResultsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, color: DT.LIGHT_TEXT }}>Loading...</div>}>
      <TestResultsContent />
    </Suspense>
  );
}
