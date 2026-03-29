"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import { burndownData, scopeChanges } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Constants ────────────────────────────────────────────────────────────────

const STARTING_POINTS = 89;
const COMPLETED       = 52;
const REMAINING       = STARTING_POINTS - COMPLETED;
const DAYS_REMAINING  = 4;
const VELOCITY_NEEDED = parseFloat((REMAINING / DAYS_REMAINING).toFixed(2));
const PROJECTED_PTS   = 78;

const SPRINTS = [
  { value: "sprint-23", label: "Sprint 23: Mar 17–28" },
  { value: "sprint-22", label: "Sprint 22: Mar 3–14" },
  { value: "sprint-21", label: "Sprint 21: Feb 17–28" },
];

// Current day = day 6 (0-indexed day 5)
const CURRENT_DAY_INDEX = 5;
const CURRENT_DAY_LABEL = burndownData[CURRENT_DAY_INDEX]?.day ?? "Day 6";

// Build chart data: clamp actual so it doesn't go below 0 and add a
// "gap" series that fills the area between ideal and actual.
const chartData = burndownData.map((d, i) => {
  const actual = i <= CURRENT_DAY_INDEX ? Math.max(0, d.actual) : null;
  return {
    day: d.day,
    ideal: parseFloat(d.ideal.toFixed(1)),
    actual,
    completed: d.completed,
  };
});

// Fake daily standup data derived from burndownData
const standupData = burndownData.slice(0, CURRENT_DAY_INDEX + 1).map((d, i) => ({
  date: new Date(2026, 2, 17 + i).toISOString().slice(0, 10),
  pointsCompleted: d.completed,
  blockers: i === 2 ? 2 : i === 4 ? 1 : 0,
  notes:
    i === 0 ? "Kickoff, environment setup"
    : i === 1 ? "OAuth flow started"
    : i === 2 ? "CI pipeline blocked on node version"
    : i === 3 ? "CI unblocked, merged 3 PRs"
    : i === 4 ? "Review backlog building"
    : "On track, reviews cleared",
}));

// ── Tooltip ──────────────────────────────────────────────────────────────────

interface BurnTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number | null; color: string }>;
  label?: string;
}

function BurnTooltip({ active, payload, label }: BurnTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm min-w-[160px]">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => {
        if (p.value === null || p.value === undefined) return null;
        const isActual = p.name === "Actual";
        const dayEntry = burndownData.find((d) => d.day === label);
        return (
          <div key={p.name} className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{p.value} pts remaining</span>
            {isActual && dayEntry && (
              <span className="text-muted-foreground text-xs ml-1">(+{dayEntry.completed} done)</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Change badge helper ───────────────────────────────────────────────────────

function ChangeBadge({ change }: { change: "added" | "removed" | "changed" }) {
  const variantMap = {
    added:   "success",
    removed: "destructive",
    changed: "warning",
  } as const;
  return (
    <Badge variant={variantMap[change]} className="capitalize">
      {change}
    </Badge>
  );
}

// ── Stat row helper ───────────────────────────────────────────────────────────

function StatRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold">{value}</span>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BurndownPage() {
  const [selectedSprint, setSelectedSprint] = useState("sprint-23");

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sprint Burn-Down</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track remaining work against the ideal burn-down line
          </p>
        </div>
        <Select value={selectedSprint} onValueChange={setSelectedSprint}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select sprint" />
          </SelectTrigger>
          <SelectContent>
            {SPRINTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main content: chart + stats panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">

        {/* Burn-down Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Burn-Down Chart</CardTitle>
            <CardDescription>
              Ideal vs actual remaining story points · dashed line = current day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  {/* Behind-schedule shading */}
                  <linearGradient id="behindGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--chart-4))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: string) => v.replace("Day ", "D")}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  domain={[0, STARTING_POINTS + 5]}
                  tickCount={8}
                  label={{
                    value: "Points Remaining",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <Tooltip content={<BurnTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

                {/* Ideal burn-down: dashed */}
                <Area
                  type="linear"
                  dataKey="ideal"
                  name="Ideal"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#behindGrad)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />

                {/* Actual burn-down: solid */}
                <Area
                  type="stepAfter"
                  dataKey="actual"
                  name="Actual"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.5}
                  fill="url(#actualGrad)"
                  connectNulls={false}
                  dot={{ r: 3, fill: "hsl(var(--chart-1))" }}
                  activeDot={{ r: 5 }}
                />

                {/* Current day marker */}
                <ReferenceLine
                  x={CURRENT_DAY_LABEL}
                  stroke="hsl(var(--chart-3))"
                  strokeDasharray="4 3"
                  strokeWidth={2}
                  label={{
                    value: "Today",
                    position: "top",
                    fontSize: 11,
                    fill: "hsl(var(--chart-3))",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sprint Stats Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sprint Stats</CardTitle>
              <CardDescription>Sprint 23 · Mar 17–28</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <StatRow label="Starting Points"   value={STARTING_POINTS} />
              <StatRow label="Completed"          value={`${COMPLETED} pts`} />
              <StatRow
                label="Remaining"
                value={`${REMAINING} pts`}
                sub={`${DAYS_REMAINING} days left`}
              />
              <StatRow label="Days Remaining"     value={DAYS_REMAINING} />
              <StatRow
                label="Velocity Needed"
                value={`${VELOCITY_NEEDED} pts/day`}
                sub="to clear all remaining work"
              />
            </CardContent>
          </Card>

          {/* Projection Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Projection</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="success">On track</Badge>
                <span className="text-xs text-muted-foreground">based on current pace</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Projected to complete{" "}
                <span className="font-semibold text-foreground">{PROJECTED_PTS} points</span>{" "}
                (
                <span className="font-semibold text-foreground">
                  {Math.round((PROJECTED_PTS / STARTING_POINTS) * 100)}%
                </span>
                ) by end of sprint.
              </p>
              <p className="text-xs text-muted-foreground">
                Velocity needed: {VELOCITY_NEEDED} pts/day
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scope Changes Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scope Changes</CardTitle>
          <CardDescription>
            Items added, removed, or resized during the sprint
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Change</TableHead>
                <TableHead className="text-right pr-6">Points Delta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopeChanges.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6 text-muted-foreground text-xs">{row.date}</TableCell>
                  <TableCell className="font-medium">{row.item}</TableCell>
                  <TableCell>
                    <ChangeBadge change={row.change} />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <span
                      className={
                        row.points > 0
                          ? "text-green-500 font-semibold"
                          : row.points < 0
                          ? "text-red-500 font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {row.points > 0 ? `+${row.points}` : row.points}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Daily Standup Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Standup Summary</CardTitle>
          <CardDescription>
            Points completed, blockers, and notes per day
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Date</TableHead>
                <TableHead className="text-right">Points Completed</TableHead>
                <TableHead className="text-center">Blockers</TableHead>
                <TableHead className="pr-6">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standupData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6 text-muted-foreground text-xs whitespace-nowrap">
                    {row.date}
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.pointsCompleted}</TableCell>
                  <TableCell className="text-center">
                    {row.blockers > 0 ? (
                      <Badge variant="destructive">{row.blockers}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground pr-6">{row.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
