"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
} from "recharts";

import { velocityData, memberVelocity } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const MEMBER_COLORS: Record<string, string> = {
  "Sarah Chen":    "hsl(var(--chart-1))",
  "Alex Rivera":   "hsl(var(--chart-2))",
  "Jordan Kim":    "hsl(var(--chart-3))",
  "Taylor Swift":  "hsl(var(--chart-4))",
  "Morgan Lee":    "hsl(var(--chart-5))",
  "Casey Johnson": "hsl(220 70% 50%)",
  "Riley Park":    "hsl(280 65% 55%)",
  "Jamie Woods":   "hsl(30 80% 55%)",
};

const MEMBER_NAMES = Object.keys(MEMBER_COLORS);

// Compute rolling 6-sprint average for the velocity trend chart
function withRollingAvg(data: typeof velocityData) {
  return data.map((row, idx) => {
    const window = data.slice(Math.max(0, idx - 5), idx + 1);
    const avg = window.reduce((sum, r) => sum + r.completed, 0) / window.length;
    return { ...row, rollingAvg: parseFloat(avg.toFixed(1)) };
  });
}

const velocityWithAvg = withRollingAvg(velocityData);
const AVG_LAST_6 = (() => {
  const last6 = velocityData.slice(-6);
  return Math.round(last6.reduce((s, r) => s + r.completed, 0) / last6.length);
})();

const SPRINT_LABELS = [
  "Sprint 14", "Sprint 15", "Sprint 16", "Sprint 17", "Sprint 18",
  "Sprint 19", "Sprint 20", "Sprint 21", "Sprint 22", "Sprint 23",
];

const SPRINT_META: Record<string, { label: string; dateRange: string; daysRemaining: number; progress: number }> = {
  "Sprint 23": { label: "Sprint 23", dateRange: "Mar 17–28", daysRemaining: 4, progress: 58 },
  "Sprint 22": { label: "Sprint 22", dateRange: "Mar 3–14",  daysRemaining: 0, progress: 100 },
};

function getSprintMeta(sprint: string) {
  return SPRINT_META[sprint] ?? { label: sprint, dateRange: "—", daysRemaining: 0, progress: 100 };
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold">{value}</span>
          {trend && (
            <TrendIcon className={`h-5 w-5 mb-1 ${trendColor}`} />
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface VelocityTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function VelocityTooltip({ active, payload, label }: VelocityTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value} pts</span>
        </div>
      ))}
    </div>
  );
}

interface MemberTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function MemberTooltip({ active, payload, label }: MemberTooltipProps) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value} pts</span>
        </div>
      ))}
      <div className="border-t border-border mt-1 pt-1 font-semibold">
        Total: {total} pts
      </div>
    </div>
  );
}

export default function VelocityPage() {
  const [sprintIndex, setSprintIndex] = useState(SPRINT_LABELS.length - 1);
  const currentSprintName = SPRINT_LABELS[sprintIndex];
  const meta = getSprintMeta(currentSprintName);

  const currentSprintData = velocityData.find((d) => d.sprint === currentSprintName);
  const prevSprintData    = velocityData.find((d) => d.sprint === SPRINT_LABELS[sprintIndex - 1]);

  const planned   = currentSprintData?.planned   ?? 0;
  const completed = currentSprintData?.completed ?? 0;
  const teamSize  = currentSprintData?.teamSize  ?? 0;

  const prevPlanned   = prevSprintData?.planned   ?? 0;
  const prevCompleted = prevSprintData?.completed ?? 0;
  const prevTeamSize  = prevSprintData?.teamSize  ?? 0;
  const prevName      = SPRINT_LABELS[sprintIndex - 1] ?? "—";

  // PR count is approximate from mock (use index-based stand-in)
  const prCount     = 18 + sprintIndex;
  const prevPrCount = 17 + (sprintIndex - 1);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Velocity</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sprint-by-sprint story point tracking and delivery trends
        </p>
      </div>

      {/* Sprint Selector */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSprintIndex((i) => Math.max(0, i - 1))}
          disabled={sprintIndex === 0}
          aria-label="Previous sprint"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[180px] text-center font-semibold text-sm border border-border rounded-md px-4 py-2 bg-muted">
          {currentSprintName}: {meta.dateRange}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSprintIndex((i) => Math.min(SPRINT_LABELS.length - 1, i + 1))}
          disabled={sprintIndex === SPRINT_LABELS.length - 1}
          aria-label="Next sprint"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Sprint Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{meta.label}</CardTitle>
              <CardDescription>{meta.dateRange}</CardDescription>
            </div>
            {meta.daysRemaining > 0 ? (
              <Badge variant="warning">{meta.daysRemaining} days remaining</Badge>
            ) : (
              <Badge variant="success">Completed</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Sprint Progress</span>
            <span className="font-medium text-foreground">{meta.progress}%</span>
          </div>
          <Progress value={meta.progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Key Velocity Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Planned Story Points" value={planned} subtitle={`${currentSprintName}`} />
        <StatCard
          title="Completed Story Points"
          value={completed}
          subtitle={`${Math.round((completed / planned) * 100)}% of plan`}
          trend={completed >= planned ? "up" : completed >= planned * 0.85 ? "neutral" : "down"}
        />
        <StatCard
          title="Velocity pts/sprint"
          value={completed}
          subtitle="This sprint"
          trend={completed >= prevCompleted ? "up" : "down"}
        />
        <StatCard
          title="Avg velocity (last 6)"
          value={AVG_LAST_6}
          subtitle="Story points"
          trend="neutral"
        />
      </div>

      {/* Velocity Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Velocity Trend — Last 10 Sprints</CardTitle>
          <CardDescription>
            Completed story points per sprint with rolling 6-sprint average and 80-point target
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={velocityWithAvg} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="sprint"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: string) => v.replace("Sprint ", "S")}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                domain={[0, 120]}
                tickCount={7}
              />
              <Tooltip content={<VelocityTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <ReferenceLine
                y={80}
                stroke="hsl(var(--chart-4))"
                strokeDasharray="6 3"
                label={{ value: "Target 80", position: "right", fontSize: 11, fill: "hsl(var(--chart-4))" }}
              />
              <Bar
                dataKey="planned"
                name="Planned"
                fill="hsl(var(--chart-2))"
                opacity={0.4}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="completed"
                name="Completed"
                fill="hsl(var(--chart-1))"
                radius={[3, 3, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="rollingAvg"
                name="Rolling Avg (6)"
                stroke="hsl(var(--chart-5))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sprint-over-Sprint Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current Sprint */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{currentSprintName}</CardTitle>
              <Badge variant="default">Current</Badge>
            </div>
            <CardDescription>{meta.dateRange}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Planned" value={`${planned} pts`} />
            <Row label="Completed" value={`${completed} pts`} />
            <Row label="% Completion" value={`${Math.round((completed / planned) * 100)}%`} />
            <Row label="PRs Merged" value={String(prCount)} />
            <Row label="Team Size" value={`${teamSize} members`} />
          </CardContent>
        </Card>

        {/* Previous Sprint */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{prevName}</CardTitle>
              <Badge variant="secondary">Previous</Badge>
            </div>
            <CardDescription>Mar 3–14</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Planned" value={`${prevPlanned} pts`} />
            <Row label="Completed" value={`${prevCompleted} pts`} />
            <Row label="% Completion" value={`${Math.round((prevCompleted / prevPlanned) * 100)}%`} />
            <Row label="PRs Merged" value={String(prevPrCount)} />
            <Row label="Team Size" value={`${prevTeamSize} members`} />
          </CardContent>
        </Card>
      </div>

      {/* Individual Contribution Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Individual Contribution Breakdown</CardTitle>
          <CardDescription>
            Story points per member per sprint (last 4 sprints)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={memberVelocity} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="sprint"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: string) => v.replace("Sprint ", "S")}
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<MemberTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {MEMBER_NAMES.map((name) => (
                <Bar
                  key={name}
                  dataKey={name}
                  stackId="members"
                  fill={MEMBER_COLORS[name]}
                  radius={name === MEMBER_NAMES[MEMBER_NAMES.length - 1] ? [3, 3, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
