"use client";

/**
 * AssessmentHeader — Sticky top bar during assessment.
 *
 * Displays:
 *   - Test short name + brand color pill
 *   - Save status indicator (Saving.../Saved)
 *   - "Save & Exit" button → navigates to /tests
 *
 * Sticky positioning with backdrop-blur for glassmorphism.
 */

import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import type { TestMeta } from "@/lib/data/tests";

interface AssessmentHeaderProps {
  testMeta: TestMeta;
  isSaving: boolean;
}

export function AssessmentHeader({ testMeta, isSaving }: AssessmentHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        {/* Left: Exit + test badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/tests")}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Save and exit assessment"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: testMeta.color }} />
            <span className="font-heading text-sm font-semibold text-foreground">
              {testMeta.shortName}
            </span>
          </div>
        </div>

        {/* Right: Save indicator */}
        <div className="flex items-center gap-2">
          {isSaving ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs font-medium">Saving…</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground/70">
              <Check size={14} />
              <span className="text-xs font-medium">Saved</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
