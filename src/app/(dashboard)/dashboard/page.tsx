"use client";

import {
  kpiData,
  prActivityData,
  reviewTimeTrendData,
  topContributors,
  prSizeDistribution,
  heatmapData,
  recentActivity,
} from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GitMerge,
  Clock,
  Zap,
  GitPullRequest,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";

// ── helpers ──────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function fmtDate(iso: string) {
  return iso.slice(5); // "MM-DD"
}

// ── Heatmap intensity ─────────────────────────────────────────────────────────

function heatColor(count: number) {
  if (count === 0) return "bg-muted";
  if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900";
  if (count <= 4) return "bg-emerald-400 dark:bg-emerald-700";
  if (count <= 6) return "bg-emerald-600 dark:bg-emerald-500";
  return "bg-emerald-800 dark:bg-emerald-300";
}

// ── KPI Sparkline ─────────────────────────────────────────────────────────────

function MiniSparkline({ data }: { data: number[] }) {
  const series = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={series} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.4} />
            <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={CHART_COLORS[0]}
          strokeWidth={1.5}
          fill="url(#sparkGrad)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  delta?: number;
  sparkline?: number[];
}

function KpiCard({ icon, label, value, trend, trendLabel, delta, sparkline }: KpiCardProps) {
  const trendPositive =
    trend !== undefined ? (trend > 0 ? true : trend < 0 ? false : null) : null;
  // For review time: negative trend is good (improvement)
  const isImprovement = label === "Avg PR Review Time";

  const badgeVariant =
    trendPositive === null
      ? "secondary"
      : isImprovement
      ? trendPositive
        ? "destructive"
        : "default"
      : trendPositive
      ? "default"
      : "destructive";

  const TrendIcon =
    trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <Card className="shadow-sm border border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="pt-6 pb-4 px-5">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-muted">{icon}</div>
          {trend !== undefined && TrendIcon && (
            <Badge
              variant={badgeVariant as "default" | "secondary" | "destructive" | "outline"}
              className="flex items-center gap-1 text-xs"
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(trend)}%
            </Badge>
          )}
          {delta !== undefined && (
            <Badge
              variant={delta < 0 ? "default" : "destructive"}
              className="flex items-center gap-1 text-xs"
            >
              {delta > 0 ? "+" : ""}
              {delta} from yesterday
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight mb-0.5">{value}</div>
        <div className="text-sm text-muted-foreground mb-2">{label}</div>
        {trendLabel && <div className="text-xs text-muted-foreground">{trendLabel}</div>}
        {sparkline && (
          <div className="mt-2 -mx-1">
            <MiniSparkline data={sparkline} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltips ───────────────────────────────────────────────────────────

function PrActivityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="capitalize text-muted-foreground">{p.dataKey}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewTimeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value}h</span>
        </div>
      ))}
    </div>
  );
}

function ContributorsTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg text-sm">
      <p className="font-medium">{payload[0].payload.name}</p>
      <p className="text-muted-foreground">
        PRs merged: <span className="font-medium text-foreground">{payload[0].value}</span>
      </p>
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg text-sm">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">
        PRs: <span className="font-medium text-foreground">{payload[0].value}</span>
      </p>
    </div>
  );
}

// ── Heatmap grid ──────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ReviewHeatmap() {
  // Use last 20 weeks × 7 days = 140 data points
  const slice = heatmapData.slice(-140);
  const weeks = 20;

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          <div className="h-3" /> {/* spacer for week header */}
          {DAYS.map((d) => (
            <div key={d} className="h-3 w-6 text-[10px] text-muted-foreground flex items-center">
              {d.slice(0, 1)}
            </div>
          ))}
        </div>

        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} className="flex flex-col gap-1">
            <div className="h-3 text-[10px] text-muted-foreground text-center">
              {w % 4 === 0 ? `W${w + 1}` : ""}
            </div>
            {Array.from({ length: 7 }, (_, d) => {
              const idx = w * 7 + d;
              const cell = slice[idx] ?? { count: 0 };
              return (
                <div
                  key={d}
                  title={`${cell.count} review${cell.count !== 1 ? "s" : ""}`}
                  className={`h-3 w-3 rounded-sm ${heatColor(cell.count)} cursor-pointer transition-opacity hover:opacity-70`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 2, 4, 6, 8].map((v) => (
          <div key={v} className={`h-3 w-3 rounded-sm ${heatColor(v)}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "merged" | "open" | "draft" }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    merged: { label: "Merged", variant: "default" },
    open: { label: "Open", variant: "secondary" },
    draft: { label: "Draft", variant: "outline" },
  };
  const { label, variant } = map[status] ?? map.open;
  return <Badge variant={variant}>{label}</Badge>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const totalPRs = prSizeDistribution.reduce((s, d) => s + d.value, 0);

  // Thin out date labels for X-axis readability (every 5th label)
  const prActivityThin = prActivityData.map((d, i) => ({
    ...d,
    displayDate: i % 5 === 0 ? fmtDate(d.date) : "",
  }));
  const reviewThin = reviewTimeTrendData.map((d, i) => ({
    ...d,
    displayDate: i % 5 === 0 ? fmtDate(d.date) : "",
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your team&apos;s development metrics — last 30 days
        </p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={<GitMerge className="h-4 w-4 text-muted-foreground" />}
          label="Total PRs Merged"
          value={kpiData.totalPRsMerged.value}
          trend={kpiData.totalPRsMerged.trend}
          trendLabel={`vs ${kpiData.totalPRsMerged.previousValue} previous period`}
        />
        <KpiCard
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          label="Avg PR Review Time"
          value={kpiData.avgReviewTime.value}
          trend={kpiData.avgReviewTime.trend}
          trendLabel="18 min faster than last period"
        />
        <KpiCard
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
          label="Team Velocity"
          value={`${kpiData.teamVelocity.value} pts`}
          trend={kpiData.teamVelocity.trend}
          sparkline={kpiData.teamVelocity.sparkline}
        />
        <KpiCard
          icon={<GitPullRequest className="h-4 w-4 text-muted-foreground" />}
          label="Open PRs"
          value={kpiData.openPRs.value}
          delta={kpiData.openPRs.delta}
        />
      </div>

      {/* ── Charts Row 1 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PR Activity */}
        <Card className="shadow-sm border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">PR Activity</CardTitle>
            <p className="text-xs text-muted-foreground">Opened, merged, and rejected PRs over 30 days</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={prActivityThin} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<PrActivityTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="opened" name="Opened" fill="#38bdf8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="merged" name="Merged" fill="#34d399" radius={[2, 2, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#f87171" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Review Time Trend */}
        <Card className="shadow-sm border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Review Time Trend</CardTitle>
            <p className="text-xs text-muted-foreground">Average review hours vs. 6h target</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={reviewThin} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 12]}
                />
                <Tooltip content={<ReviewTimeTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="circle"
                  iconSize={8}
                />
                <ReferenceLine
                  y={6}
                  stroke="#f59e0b"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{ value: "Target 6h", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
                />
                <Line
                  type="monotone"
                  dataKey="avgHours"
                  name="Avg Hours"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Contributors */}
        <Card className="shadow-sm border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Contributors</CardTitle>
            <p className="text-xs text-muted-foreground">PRs merged by team member</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={topContributors}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<ContributorsTooltip />} />
                <Bar dataKey="prsMerged" name="PRs Merged" radius={[0, 3, 3, 0]}>
                  {topContributors.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PR Size Distribution — Donut */}
        <Card className="shadow-sm border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">PR Size Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Breakdown by lines changed</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={prSizeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {prSizeDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{totalPRs}</span>
                <span className="text-xs text-muted-foreground">Total PRs</span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
              {prSizeDistribution.map((d) => (
                <div key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full inline-block" style={{ background: d.fill }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Review Activity Heatmap */}
        <Card className="shadow-sm border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Review Activity Heatmap</CardTitle>
            <p className="text-xs text-muted-foreground">Reviews submitted per day (last 20 weeks)</p>
          </CardHeader>
          <CardContent>
            <ReviewHeatmap />
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Activity Feed ─────────────────────────────────────────────── */}
      <Card className="shadow-sm border border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <p className="text-xs text-muted-foreground">Latest pull request updates</p>
        </CardHeader>
        <CardContent className="p-0 pb-1">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 pl-6">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Size</TableHead>
                <TableHead className="hidden lg:table-cell">Review Time</TableHead>
                <TableHead className="hidden xl:table-cell pr-6">Merged At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                    {row.number}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium text-sm">
                    {row.title}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {row.author}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                    {row.size}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {row.reviewTime}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground pr-6">
                    {row.mergedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
