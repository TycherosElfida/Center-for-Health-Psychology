import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface RecentResult {
  id: string;
  totalScore: string | null;
  resultLabel: string | null;
  createdAt: Date;
  testTitle: string;
  testSlug: string;
}

const SEVERITY_MAP: Record<string, string> = {
  low: "severity-low",
  rendah: "severity-low",
  moderate: "severity-moderate",
  sedang: "severity-moderate",
  high: "severity-high",
  tinggi: "severity-high",
  critical: "severity-critical",
  "sangat tinggi": "severity-critical",
};

function getSeverityClass(label: string | null): string {
  if (!label) return "";
  const lower = label.toLowerCase();
  for (const [key, cls] of Object.entries(SEVERITY_MAP)) {
    if (lower.includes(key)) return cls;
  }
  return "";
}

export function RecentResultsTable({
  results,
  isLoading,
}: {
  results?: RecentResult[];
  isLoading: boolean;
}) {
  return (
    <Card className="border-0 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
          Recent Results
        </h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ color: "var(--text-muted)" }}>Date</TableHead>
            <TableHead style={{ color: "var(--text-muted)" }}>Test</TableHead>
            <TableHead style={{ color: "var(--text-muted)" }}>Score</TableHead>
            <TableHead style={{ color: "var(--text-muted)" }}>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="admin-skeleton" style={{ width: 80, height: 14 }} />
                </TableCell>
                <TableCell>
                  <div className="admin-skeleton" style={{ width: 100, height: 14 }} />
                </TableCell>
                <TableCell>
                  <div className="admin-skeleton" style={{ width: 40, height: 14 }} />
                </TableCell>
                <TableCell>
                  <div className="admin-skeleton" style={{ width: 70, height: 22 }} />
                </TableCell>
              </TableRow>
            ))
          ) : results && results.length > 0 ? (
            results.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm" style={{ color: "var(--text-body)" }}>
                  {new Intl.DateTimeFormat("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(r.createdAt))}
                </TableCell>
                <TableCell className="text-sm font-medium" style={{ color: "var(--text-heading)" }}>
                  {r.testTitle}
                </TableCell>
                <TableCell className="text-sm" style={{ color: "var(--text-body)" }}>
                  {r.totalScore ?? "—"}
                </TableCell>
                <TableCell>
                  {r.resultLabel ? (
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getSeverityClass(r.resultLabel)}`}
                    >
                      {r.resultLabel}
                    </Badge>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      —
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-8 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                No results yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
