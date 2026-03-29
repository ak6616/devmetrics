// Mock data for DevMetrics dashboard

// Deterministic seeded PRNG (LCG) — avoids SSR/client hydration mismatch from Math.random()
function makeSeededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223;
    s = s >>> 0;
    return s / 0xffffffff;
  };
}

export const kpiData = {
  totalPRsMerged: { value: 142, trend: 12.5, previousValue: 126 },
  avgReviewTime: { value: "4h 32m", trendMinutes: -18, trend: -6.2 },
  teamVelocity: { value: 89, trend: 8.3, sparkline: [62, 71, 68, 75, 82, 78, 85, 89] },
  openPRs: { value: 23, delta: -3 },
};

const _prRng = makeSeededRandom(42);
export const prActivityData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 2, i + 1);
  return {
    date: date.toISOString().slice(0, 10),
    opened: Math.floor(_prRng() * 8) + 2,
    merged: Math.floor(_prRng() * 7) + 1,
    rejected: Math.floor(_prRng() * 2),
  };
});

const _reviewRng = makeSeededRandom(137);
export const reviewTimeTrendData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 2, i + 1);
  return {
    date: date.toISOString().slice(0, 10),
    avgHours: parseFloat((_reviewRng() * 6 + 2).toFixed(1)),
    target: 6,
  };
});

export const topContributors = [
  { name: "Sarah Chen", avatar: "SC", prsMerged: 28 },
  { name: "Alex Rivera", avatar: "AR", prsMerged: 24 },
  { name: "Jordan Kim", avatar: "JK", prsMerged: 21 },
  { name: "Taylor Swift", avatar: "TS", prsMerged: 19 },
  { name: "Morgan Lee", avatar: "ML", prsMerged: 17 },
  { name: "Casey Johnson", avatar: "CJ", prsMerged: 15 },
  { name: "Riley Park", avatar: "RP", prsMerged: 12 },
  { name: "Jamie Woods", avatar: "JW", prsMerged: 6 },
];

export const prSizeDistribution = [
  { name: "XS (<50)", value: 32, fill: "hsl(var(--chart-1))" },
  { name: "S (50-200)", value: 45, fill: "hsl(var(--chart-2))" },
  { name: "M (200-500)", value: 38, fill: "hsl(var(--chart-3))" },
  { name: "L (500-1k)", value: 18, fill: "hsl(var(--chart-4))" },
  { name: "XL (>1k)", value: 9, fill: "hsl(var(--chart-5))" },
];

const _heatmapRng = makeSeededRandom(256);
export const heatmapData = Array.from({ length: 52 * 7 }, (_, i) => ({
  week: Math.floor(i / 7),
  day: i % 7,
  count: Math.floor(_heatmapRng() * 8),
}));

export const recentActivity = [
  { id: 1, number: "#342", title: "Add user authentication flow", author: "Sarah Chen", status: "merged" as const, size: "+234 / -56", reviewTime: "2h 15m", mergedAt: "2026-03-28" },
  { id: 2, number: "#341", title: "Fix pagination bug in dashboard", author: "Alex Rivera", status: "merged" as const, size: "+45 / -12", reviewTime: "1h 30m", mergedAt: "2026-03-28" },
  { id: 3, number: "#340", title: "Update CI/CD pipeline configuration", author: "Jordan Kim", status: "open" as const, size: "+189 / -67", reviewTime: "-", mergedAt: "-" },
  { id: 4, number: "#339", title: "Refactor API client module", author: "Taylor Swift", status: "merged" as const, size: "+312 / -198", reviewTime: "5h 45m", mergedAt: "2026-03-27" },
  { id: 5, number: "#338", title: "Add dark mode support", author: "Morgan Lee", status: "draft" as const, size: "+567 / -123", reviewTime: "-", mergedAt: "-" },
  { id: 6, number: "#337", title: "Optimize database queries", author: "Casey Johnson", status: "merged" as const, size: "+89 / -34", reviewTime: "3h 10m", mergedAt: "2026-03-27" },
];

export const codeReviewMetrics = {
  avgFirstResponse: "1h 45m",
  avgReviewCycle: "4h 12m",
  avgTimeToMerge: "8h 30m",
  prsWithNoReviews: 3,
};

export const reviewByMember = [
  { name: "Sarah Chen", avgTime: "2h 15m", reviewed: 34, fastest: "12m", slowest: "18h", pending: 2 },
  { name: "Alex Rivera", avgTime: "3h 30m", reviewed: 28, fastest: "25m", slowest: "24h", pending: 1 },
  { name: "Jordan Kim", avgTime: "1h 45m", reviewed: 41, fastest: "8m", slowest: "12h", pending: 3 },
  { name: "Taylor Swift", avgTime: "4h 10m", reviewed: 22, fastest: "30m", slowest: "36h", pending: 0 },
  { name: "Morgan Lee", avgTime: "2h 50m", reviewed: 31, fastest: "15m", slowest: "20h", pending: 2 },
];

const _slaRng = makeSeededRandom(512);
export const slaComplianceData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2026, 2, i + 1).toISOString().slice(0, 10),
  compliance: parseFloat((_slaRng() * 30 + 65).toFixed(1)),
  target: 80,
}));

export const velocityData = [
  { sprint: "Sprint 14", planned: 75, completed: 68, teamSize: 8 },
  { sprint: "Sprint 15", planned: 80, completed: 72, teamSize: 8 },
  { sprint: "Sprint 16", planned: 78, completed: 71, teamSize: 7 },
  { sprint: "Sprint 17", planned: 82, completed: 78, teamSize: 8 },
  { sprint: "Sprint 18", planned: 85, completed: 80, teamSize: 8 },
  { sprint: "Sprint 19", planned: 80, completed: 75, teamSize: 7 },
  { sprint: "Sprint 20", planned: 88, completed: 82, teamSize: 8 },
  { sprint: "Sprint 21", planned: 85, completed: 85, teamSize: 8 },
  { sprint: "Sprint 22", planned: 90, completed: 86, teamSize: 8 },
  { sprint: "Sprint 23", planned: 89, completed: 52, teamSize: 8 },
];

export const memberVelocity = [
  { sprint: "Sprint 20", "Sarah Chen": 14, "Alex Rivera": 12, "Jordan Kim": 11, "Taylor Swift": 10, "Morgan Lee": 13, "Casey Johnson": 11, "Riley Park": 7, "Jamie Woods": 4 },
  { sprint: "Sprint 21", "Sarah Chen": 15, "Alex Rivera": 13, "Jordan Kim": 12, "Taylor Swift": 11, "Morgan Lee": 12, "Casey Johnson": 10, "Riley Park": 8, "Jamie Woods": 4 },
  { sprint: "Sprint 22", "Sarah Chen": 16, "Alex Rivera": 12, "Jordan Kim": 13, "Taylor Swift": 12, "Morgan Lee": 11, "Casey Johnson": 11, "Riley Park": 7, "Jamie Woods": 4 },
  { sprint: "Sprint 23", "Sarah Chen": 10, "Alex Rivera": 8, "Jordan Kim": 7, "Taylor Swift": 6, "Morgan Lee": 8, "Casey Johnson": 6, "Riley Park": 4, "Jamie Woods": 3 },
];

const _burndownRng = makeSeededRandom(999);
export const burndownData = Array.from({ length: 10 }, (_, i) => ({
  day: `Day ${i + 1}`,
  ideal: 89 - (89 / 10) * (i + 1),
  actual: i < 6 ? 89 - Math.floor(_burndownRng() * 5 + 6) * (i + 1) : 89 - 52 + Math.floor(_burndownRng() * 3) - (i - 5) * 5,
  completed: Math.floor(_burndownRng() * 5 + 4),
}));

export const scopeChanges = [
  { date: "2026-03-18", item: "Add OAuth flow", change: "added" as const, points: 5 },
  { date: "2026-03-20", item: "Remove legacy migration", change: "removed" as const, points: -3 },
  { date: "2026-03-22", item: "Expand API coverage", change: "changed" as const, points: 2 },
];

export const teamMembers = [
  { id: 1, name: "Sarah Chen", username: "sarachen", role: "Full-stack", prsMerged: 28, avgReviewTime: "2h 15m", openPRs: 3, sparkline: [4, 5, 3, 6, 4, 3, 3] },
  { id: 2, name: "Alex Rivera", username: "arivera", role: "Backend", prsMerged: 24, avgReviewTime: "3h 30m", openPRs: 2, sparkline: [3, 4, 2, 5, 3, 4, 3] },
  { id: 3, name: "Jordan Kim", username: "jkim", role: "Frontend", prsMerged: 21, avgReviewTime: "1h 45m", openPRs: 1, sparkline: [2, 3, 4, 3, 2, 4, 3] },
  { id: 4, name: "Taylor Swift", username: "tswift", role: "Backend", prsMerged: 19, avgReviewTime: "4h 10m", openPRs: 4, sparkline: [3, 2, 3, 2, 3, 3, 3] },
  { id: 5, name: "Morgan Lee", username: "mlee", role: "DevOps", prsMerged: 17, avgReviewTime: "2h 50m", openPRs: 1, sparkline: [2, 3, 2, 3, 2, 2, 3] },
  { id: 6, name: "Casey Johnson", username: "cjohnson", role: "Full-stack", prsMerged: 15, avgReviewTime: "3h 15m", openPRs: 2, sparkline: [1, 2, 3, 2, 2, 3, 2] },
  { id: 7, name: "Riley Park", username: "rpark", role: "Frontend", prsMerged: 12, avgReviewTime: "2h 30m", openPRs: 1, sparkline: [1, 2, 1, 2, 2, 2, 2] },
  { id: 8, name: "Jamie Woods", username: "jwoods", role: "Backend", prsMerged: 6, avgReviewTime: "5h 20m", openPRs: 0, sparkline: [1, 0, 1, 1, 1, 1, 1] },
];

export const reviewBottlenecks = [
  { prNumber: "#335", title: "Implement webhook handlers", author: "Riley Park", waitTime: "36h", reviewers: ["Sarah Chen", "Alex Rivera"] },
  { prNumber: "#333", title: "Add rate limiting middleware", author: "Jamie Woods", waitTime: "28h", reviewers: ["Jordan Kim"] },
  { prNumber: "#331", title: "Update deployment scripts", author: "Casey Johnson", waitTime: "25h", reviewers: ["Morgan Lee", "Taylor Swift"] },
];
