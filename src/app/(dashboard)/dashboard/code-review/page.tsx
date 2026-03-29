"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  codeReviewMetrics,
  reviewByMember,
  slaComplianceData,
  reviewBottlenecks,
} from "@/lib/mock-data";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert "Xh Ym" to fractional hours for bar width calculation */
function parseHours(s: string): number {
  const hMatch = s.match(/(\d+)h/);
  const mMatch = s.match(/(\d+)m/);
  const h = hMatch ? parseInt(hMatch[1]) : 0;
  const m = mMatch ? parseInt(mMatch[1]) : 0;
  return h + m / 60;
}

const MAX_REVIEW_HOURS = 6; // scale reference for mini bar

function slaBadgeClass(compliance: number) {
  if (compliance >= 80) return "bg-green-100 text-green-800 border-green-200";
  if (compliance >= 65) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
}

// ── Flow Diagram ─────────────────────────────────────────────────────────────

interface FlowStage {
  label: string;
  sublabel?: string;
}

interface FlowArrow {
  duration: string;
  sla: "green" | "amber" | "red";
}

const flowStages: FlowStage[] = [
  { label: "PR Opened" },
  { label: "First Review" },
  { label: "Approved" },
  { label: "Merged" },
];

const flowArrows: FlowArrow[] = [
  { duration: "1h 45m", sla: "green" },
  { duration: "2h 30m", sla: "amber" },
  { duration: "4h 00m", sla: "red" },
];

const slaColors = {
  green: "text-green-600",
  amber: "text-amber-500",
  red: "text-red-500",
};

const stageBorderColors = {
  green: "border-green-400",
  amber: "border-amber-400",
  red: "border-red-400",
};

// ── Page Component ────────────────────────────────────────────────────────────

export default function CodeReviewPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Page Title ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Code Review Time Analytics</h1>
        <p className="text-muted-foreground mt-1">Review cycle times, SLA compliance, and bottleneck detection</p>
      </div>

      {/* ── Header Metrics ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg First Response</p>
            <p className="mt-2 text-3xl font-bold text-green-500">{codeReviewMetrics.avgFirstResponse}</p>
            <p className="mt-1 text-xs text-muted-foreground">SLA target: 2h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Review Cycle</p>
            <p className="mt-2 text-3xl font-bold text-amber-500">{codeReviewMetrics.avgReviewCycle}</p>
            <p className="mt-1 text-xs text-muted-foreground">SLA target: 4h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Time to Merge</p>
            <p className="mt-2 text-3xl font-bold text-red-500">{codeReviewMetrics.avgTimeToMerge}</p>
            <p className="mt-1 text-xs text-muted-foreground">SLA target: 8h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PRs with 0 Reviews</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{codeReviewMetrics.prsWithNoReviews}</p>
            <p className="mt-1 text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Flow Diagram ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Review Pipeline Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center flex-wrap gap-0 py-4">
            {flowStages.map((stage, i) => {
              const arrow = flowArrows[i];
              const borderColor = arrow ? stageBorderColors[arrow.sla] : "border-border";
              return (
                <div key={stage.label} className="flex items-center">
                  {/* Stage Node */}
                  <div
                    className={`flex flex-col items-center justify-center w-32 h-20 rounded-xl border-2 ${borderColor} bg-card shadow-sm px-3 text-center`}
                  >
                    <span className="font-semibold text-sm leading-tight">{stage.label}</span>
                    {stage.sublabel && (
                      <span className="text-xs text-muted-foreground mt-0.5">{stage.sublabel}</span>
                    )}
                  </div>

                  {/* Arrow + Duration */}
                  {arrow && (
                    <div className="flex flex-col items-center mx-2">
                      <span className={`text-xs font-semibold ${slaColors[arrow.sla]}`}>{arrow.duration}</span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <div className={`h-0.5 w-10 ${arrow.sla === "green" ? "bg-green-400" : arrow.sla === "amber" ? "bg-amber-400" : "bg-red-400"}`} />
                        <svg className={`${arrow.sla === "green" ? "text-green-400" : arrow.sla === "amber" ? "text-amber-400" : "text-red-400"}`} width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
                          <polygon points="0,0 8,5 0,10" />
                        </svg>
                      </div>
                      <span className={`text-xs mt-0.5 ${slaColors[arrow.sla]}`}>
                        {arrow.sla === "green" ? "On track" : arrow.sla === "amber" ? "At risk" : "Over SLA"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-green-400" /> On track (&lt; SLA)
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-amber-400" /> At risk (approaching SLA)
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-red-400" /> Over SLA
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Review Time by Team Member + SLA Chart ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Member Table */}
        <Card>
          <CardHeader>
            <CardTitle>Review Time by Team Member</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Avg Time</TableHead>
                  <TableHead className="text-center">Reviewed</TableHead>
                  <TableHead>Fastest</TableHead>
                  <TableHead>Slowest</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewByMember.map((member) => {
                  const hours = parseHours(member.avgTime);
                  const barPct = Math.min((hours / MAX_REVIEW_HOURS) * 100, 100);
                  const barColor =
                    hours < 2 ? "bg-green-400" : hours < 4 ? "bg-amber-400" : "bg-red-400";
                  return (
                    <TableRow key={member.name}>
                      <TableCell className="font-medium whitespace-nowrap">{member.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm whitespace-nowrap">{member.avgTime}</span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">{member.reviewed}</TableCell>
                      <TableCell className="text-sm text-green-600">{member.fastest}</TableCell>
                      <TableCell className="text-sm text-red-500">{member.slowest}</TableCell>
                      <TableCell className="text-center">
                        {member.pending > 0 ? (
                          <Badge variant="warning">{member.pending}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* SLA Compliance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Compliance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={slaComplianceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(value) => [`${value}%`, "Compliance"]}
                />
                <Legend />
                <ReferenceLine y={80} stroke="hsl(var(--chart-2))" strokeDasharray="6 3" label={{ value: "80% Target", position: "insideTopRight", fontSize: 11, fill: "hsl(var(--chart-2))" }} />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  name="SLA Compliance %"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Last 30 days</span>
              <div className="flex items-center gap-4">
                {(() => {
                  const recent = slaComplianceData.slice(-7);
                  const avg = (recent.reduce((s, d) => s + d.compliance, 0) / recent.length).toFixed(1);
                  const cls = parseFloat(avg) >= 80 ? "text-green-600" : parseFloat(avg) >= 65 ? "text-amber-500" : "text-red-500";
                  return (
                    <span>
                      7-day avg:{" "}
                      <span className={`font-semibold ${cls}`}>{avg}%</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Review Bottleneck Alerts ────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Review Bottleneck Alerts</h2>
        <div className="flex flex-col gap-3">
          {reviewBottlenecks.map((item) => (
            <div
              key={item.prNumber}
              className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                {/* Warning Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="text-amber-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-amber-800 dark:text-amber-200">{item.prNumber}</span>
                    <span className="font-medium text-sm text-foreground">{item.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    by <span className="font-medium">{item.author}</span>
                    {" · "}
                    Assigned to:{" "}
                    {item.reviewers.map((r, i) => (
                      <span key={r}>
                        <span className="font-medium">{r}</span>
                        {i < item.reviewers.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Waiting</p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{item.waitTime}</p>
                </div>
                <Badge variant="warning" className="whitespace-nowrap">Overdue</Badge>
              </div>
            </div>
          ))}
          {reviewBottlenecks.length === 0 && (
            <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 p-6 text-center text-green-700 dark:text-green-400">
              No bottlenecks detected. All PRs are progressing within SLA.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
