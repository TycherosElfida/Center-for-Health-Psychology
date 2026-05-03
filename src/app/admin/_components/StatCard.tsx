import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
}

export function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <Card className="admin-stat-card border-0" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              {title}
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--text-heading)", fontFamily: "var(--font-heading)" }}
            >
              {value}
            </p>
            {subtitle && (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <span className="text-2xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="border-0" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="p-5">
        <div className="admin-skeleton mb-2" style={{ width: 80, height: 12 }} />
        <div className="admin-skeleton" style={{ width: 60, height: 28 }} />
      </CardContent>
    </Card>
  );
}
