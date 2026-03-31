import { CheckCircle2 } from "lucide-react";

export interface Step {
  label: string;
  text: string;
  status: "done" | "active" | "pending";
}

interface StepIndicatorProps {
  steps: Step[];
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2">
          {i > 0 && (
            <div
              className="h-0.5 w-7 rounded-full"
              style={{
                background:
                  step.status === "pending"
                    ? "oklch(0.88 0.02 260)"
                    : "oklch(0.55 0.14 185 / 0.4)",
              }}
            />
          )}
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{
                background:
                  step.status === "done"
                    ? "oklch(0.55 0.14 185)"
                    : step.status === "active"
                      ? "linear-gradient(135deg, oklch(0.55 0.14 185), oklch(0.45 0.12 185))"
                      : "oklch(0.88 0.02 260)",
                boxShadow:
                  step.status === "active"
                    ? "0 4px 12px oklch(0.55 0.14 185 / 0.35)"
                    : "none",
              }}
            >
              {step.status === "done" ? (
                <CheckCircle2 size={14} className="text-white" />
              ) : (
                <span
                  className="text-xs font-bold"
                  style={{
                    color:
                      step.status === "active"
                        ? "#fff"
                        : "oklch(0.50 0.02 240)",
                  }}
                >
                  {step.label}
                </span>
              )}
            </div>
            <span
              className="text-[10px]"
              style={{
                color:
                  step.status === "active"
                    ? "oklch(0.45 0.12 185)"
                    : step.status === "done"
                      ? "oklch(0.40 0.02 240)"
                      : "oklch(0.50 0.02 240)",
                fontWeight: step.status === "active" ? 600 : 400,
              }}
            >
              {step.text}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
