"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  prActivityData,
  prSizeDistribution,
  recentActivity,
} from "@/lib/mock-data";

// ── Additional inline mock data ──────────────────────────────────────────────

const REPOS = ["All Repos", "frontend", "backend", "infra", "mobile"];
const AUTHORS = [
  "All Authors",
  "Sarah Chen",
  "Alex Rivera",
  "Jordan Kim",
  "Taylor Swift",
  "Morgan Lee",
  "Casey Johnson",
  "Riley Park",
  "Jamie Woods",
];

const fullPRList = [
  { id: 342, title: "Add user authentication flow", author: "Sarah Chen", repo: "frontend", linesAdded: 234, linesRemoved: 56, reviewers: ["Alex Rivera", "Jordan Kim"], comments: 12, status: "merged" as const, created: "2026-03-25", merged: "2026-03-28" },
  { id: 341, title: "Fix pagination bug in dashboard", author: "Alex Rivera", repo: "frontend", linesAdded: 45, linesRemoved: 12, reviewers: ["Sarah Chen"], comments: 4, status: "merged" as const, created: "2026-03-26", merged: "2026-03-28" },
  { id: 340, title: "Update CI/CD pipeline configuration", author: "Jordan Kim", repo: "infra", linesAdded: 189, linesRemoved: 67, reviewers: ["Morgan Lee"], comments: 7, status: "open" as const, created: "2026-03-27", merged: "-" },
  { id: 339, title: "Refactor API client module", author: "Taylor Swift", repo: "backend", linesAdded: 312, linesRemoved: 198, reviewers: ["Casey Johnson", "Alex Rivera"], comments: 21, status: "merged" as const, created: "2026-03-24", merged: "2026-03-27" },
  { id: 338, title: "Add dark mode support", author: "Morgan Lee", repo: "frontend", linesAdded: 567, linesRemoved: 123, reviewers: [], comments: 0, status: "draft" as const, created: "2026-03-28", merged: "-" },
  { id: 337, title: "Optimize database queries", author: "Casey Johnson", repo: "backend", linesAdded: 89, linesRemoved: 34, reviewers: ["Taylor Swift"], comments: 5, status: "merged" as const, created: "2026-03-25", merged: "2026-03-27" },
  { id: 336, title: "Add unit tests for auth module", author: "Riley Park", repo: "backend", linesAdded: 412, linesRemoved: 18, reviewers: ["Sarah Chen", "Jordan Kim"], comments: 9, status: "merged" as const, created: "2026-03-22", merged: "2026-03-26" },
  { id: 335, title: "Implement webhook handlers", author: "Riley Park", repo: "backend", linesAdded: 278, linesRemoved: 44, reviewers: ["Sarah Chen", "Alex Rivera"], comments: 3, status: "open" as const, created: "2026-03-20", merged: "-" },
  { id: 334, title: "Migrate to new logging library", author: "Jamie Woods", repo: "infra", linesAdded: 155, linesRemoved: 210, reviewers: ["Morgan Lee"], comments: 6, status: "rejected" as const, created: "2026-03-19", merged: "-" },
  { id: 333, title: "Add rate limiting middleware", author: "Jamie Woods", repo: "backend", linesAdded: 98, linesRemoved: 12, reviewers: ["Jordan Kim"], comments: 2, status: "open" as const, created: "2026-03-18", merged: "-" },
  { id: 332, title: "Mobile responsive nav redesign", author: "Sarah Chen", repo: "mobile", linesAdded: 634, linesRemoved: 290, reviewers: ["Alex Rivera", "Taylor Swift", "Riley Park"], comments: 34, status: "merged" as const, created: "2026-03-15", merged: "2026-03-22" },
  { id: 331, title: "Update deployment scripts", author: "Casey Johnson", repo: "infra", linesAdded: 67, linesRemoved: 88, reviewers: ["Morgan Lee", "Taylor Swift"], comments: 8, status: "open" as const, created: "2026-03-17", merged: "-" },
];

const scatterData = [
  { size: 45, reviewTime: 1.5, status: "merged" },
  { size: 89, reviewTime: 3.2, status: "merged" },
  { size: 155, reviewTime: 2.8, status: "merged" },
  { size: 189, reviewTime: 4.5, status: "open" },
  { size: 234, reviewTime: 2.25, status: "merged" },
  { size: 278, reviewTime: 36, status: "open" },
  { size: 312, reviewTime: 5.75, status: "merged" },
  { size: 412, reviewTime: 4.0, status: "merged" },
  { size: 510, reviewTime: 6.5, status: "draft" },
  { size: 567, reviewTime: 0, status: "draft" },
  { size: 634, reviewTime: 7.0, status: "merged" },
  { size: 790, reviewTime: 8.2, status: "rejected" },
  { size: 1024, reviewTime: 9.5, status: "merged" },
  { size: 1280, reviewTime: 12.0, status: "rejected" },
].map((d) => ({ x: d.size, y: d.reviewTime, status: d.status }));

// ── Helpers ──────────────────────────────────────────────────────────────────

type SortKey = keyof typeof fullPRList[0];
type StatusFilter = "All" | "open" | "merged" | "draft" | "rejected";

const STATUS_LABELS: Record<string, string> = {
  merged: "Merged",
  open: "Open",
  draft: "Draft",
  rejected: "Rejected",
};

function statusVariant(status: string) {
  switch (status) {
    case "merged": return "success";
    case "open": return "default";
    case "draft": return "secondary";
    case "rejected": return "destructive";
    default: return "outline";
  }
}

function downloadCSV(rows: typeof fullPRList) {
  const header = "PR#,Title,Author,Repo,Lines+,Lines-,Reviewers,Comments,Status,Created,Merged";
  const body = rows.map((r) =>
    [r.id, `"${r.title}"`, r.author, r.repo, r.linesAdded, r.linesRemoved, `"${r.reviewers.join("; ")}"`, r.comments, r.status, r.created, r.merged].join(",")
  );
  const csv = [header, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pr-metrics.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function PRMetricsPage() {
  const [repo, setRepo] = useState("All Repos");
  const [author, setAuthor] = useState("All Authors");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-29");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredPRs = useMemo(() => {
    return fullPRList
      .filter((pr) => {
        if (repo !== "All Repos" && pr.repo !== repo) return false;
        if (author !== "All Authors" && pr.author !== author) return false;
        if (statusFilter !== "All" && pr.status !== statusFilter) return false;
        if (pr.created < dateFrom || pr.created > dateTo) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortAsc ? cmp : -cmp;
      });
  }, [repo, author, dateFrom, dateTo, statusFilter, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortIndicator({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Page Title ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PR Metrics</h1>
        <p className="text-muted-foreground mt-1">Pull request activity, size analysis, and review data</p>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Repo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Repository</label>
              <select
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {REPOS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            {/* Author */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Author</label>
              <select
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {AUTHORS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            {/* Date From */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {/* Date To */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <div className="flex gap-1">
                {(["All", "open", "merged", "draft", "rejected"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`h-9 px-3 rounded-md text-sm font-medium border transition-colors ${
                      statusFilter === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input hover:bg-muted"
                    }`}
                  >
                    {s === "All" ? "All" : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total PRs", value: "142", color: "text-foreground" },
          { label: "Merged", value: "118", color: "text-green-500" },
          { label: "Rejected", value: "8", color: "text-red-500" },
          { label: "Still Open", value: "16", color: "text-blue-500" },
          { label: "Avg Size", value: "234 lines", color: "text-purple-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 pb-4 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── PR Activity Over Time ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>PRs Opened vs Merged Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={prActivityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMerged" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              />
              <Legend />
              <Area type="monotone" dataKey="opened" name="Opened" stroke="hsl(var(--chart-1))" fill="url(#colorOpened)" strokeWidth={2} stackId="1" />
              <Area type="monotone" dataKey="merged" name="Merged" stroke="hsl(var(--chart-2))" fill="url(#colorMerged)" strokeWidth={2} stackId="2" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── PR Size Analysis ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Histogram */}
        <Card>
          <CardHeader>
            <CardTitle>PR Size Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={prSizeDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Bar dataKey="value" name="PRs" radius={[4, 4, 0, 0]}>
                  {prSizeDistribution.map((entry, idx) => (
                    <rect key={idx} fill={entry.fill} />
                  ))}
                </Bar>
                <Bar dataKey="value" name="PRs" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Scatter: Size vs Review Time */}
        <Card>
          <CardHeader>
            <CardTitle>PR Size vs Review Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="x" name="Lines Changed" type="number" tick={{ fontSize: 11 }} label={{ value: "Lines Changed", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis dataKey="y" name="Review Time (h)" type="number" tick={{ fontSize: 11 }} label={{ value: "Review Time (h)", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(value, name) => [value, name === "x" ? "Lines Changed" : "Review Time (h)"]}
                />
                <Scatter
                  name="Merged"
                  data={scatterData.filter((d) => d.status === "merged")}
                  fill="hsl(var(--chart-2))"
                  opacity={0.8}
                />
                <Scatter
                  name="Open"
                  data={scatterData.filter((d) => d.status === "open")}
                  fill="hsl(var(--chart-1))"
                  opacity={0.8}
                />
                <Scatter
                  name="Draft"
                  data={scatterData.filter((d) => d.status === "draft")}
                  fill="hsl(var(--chart-4))"
                  opacity={0.8}
                />
                <Scatter
                  name="Rejected"
                  data={scatterData.filter((d) => d.status === "rejected")}
                  fill="hsl(var(--chart-5))"
                  opacity={0.8}
                />
                <Legend />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── PR List Table ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pull Request List</CardTitle>
          <button
            onClick={() => downloadCSV(filteredPRs)}
            className="flex items-center gap-2 h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { key: "id" as SortKey, label: "#" },
                  { key: "title" as SortKey, label: "Title" },
                  { key: "author" as SortKey, label: "Author" },
                  { key: "repo" as SortKey, label: "Repo" },
                  { key: "linesAdded" as SortKey, label: "Lines +/-" },
                  { key: "reviewers" as SortKey, label: "Reviewers" },
                  { key: "comments" as SortKey, label: "Comments" },
                  { key: "status" as SortKey, label: "Status" },
                  { key: "created" as SortKey, label: "Created" },
                  { key: "merged" as SortKey, label: "Merged" },
                ].map(({ key, label }) => (
                  <TableHead
                    key={key}
                    onClick={() => handleSort(key)}
                    className="cursor-pointer select-none whitespace-nowrap"
                  >
                    {label}
                    <SortIndicator col={key} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPRs.map((pr) => (
                <TableRow key={pr.id} className="cursor-pointer">
                  <TableCell className="font-mono text-xs text-muted-foreground">#{pr.id}</TableCell>
                  <TableCell className="max-w-[220px]">
                    <span className="font-medium text-sm line-clamp-1">{pr.title}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{pr.author}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{pr.repo}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    <span className="text-green-600 font-medium">+{pr.linesAdded}</span>
                    {" / "}
                    <span className="text-red-500 font-medium">-{pr.linesRemoved}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {pr.reviewers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {pr.reviewers.map((r) => (
                          <span key={r} className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{r.split(" ")[0]}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-center">{pr.comments}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(pr.status) as any}>
                      {STATUS_LABELS[pr.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{pr.created}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{pr.merged}</TableCell>
                </TableRow>
              ))}
              {filteredPRs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No pull requests match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
