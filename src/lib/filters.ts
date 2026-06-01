import * as M from "@/lib/mock-data";
import type { Range } from "@/lib/filters-context";

export interface Filters {
  range: Range;
  repo: string;
  member: string;
}

export const REPOS = ["devmetrics/api", "devmetrics/web", "devmetrics/infra"];
export const MEMBERS: string[] = M.topContributors.map((c) => c.name);

export function windowDays(range: Range): number {
  return range === "7d" ? 7 : range === "30d" ? 30 : 90;
}

// ── deterministyczne skalowanie (seed z nazw) ────────────────────────────────
function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function repoFactor(repo: string): number {
  if (repo === "all") return 1;
  return 0.25 + ((hash(repo) % 1000) / 1000) * 0.25; // 0.25–0.50
}
export function memberShare(member: string): number {
  if (member === "all") return 1;
  const total = M.topContributors.reduce((s, c) => s + c.prsMerged, 0);
  const me = M.topContributors.find((c) => c.name === member)?.prsMerged ?? 0;
  return total ? me / total : 0;
}
function combined(f: Filters): number {
  return repoFactor(f.repo) * memberShare(f.member);
}
const sInt = (n: number, k: number) => Math.max(0, Math.round(n * k));
const sFloat = (n: number, k: number, d = 1) =>
  parseFloat((n * k).toFixed(d));

function fmtHM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

// ── 90-dniowe serie bazowe (deterministyczne) ────────────────────────────────
const BASE_DAYS = 90;
function dayAt(i: number, total: number): string {
  const end = new Date(2026, 2, 30); // anchor: 2026-03-30
  const d = new Date(end);
  d.setDate(end.getDate() - (total - 1 - i));
  return d.toISOString().slice(0, 10);
}
const _prR = rng(42);
const basePrActivity = Array.from({ length: BASE_DAYS }, (_, i) => ({
  date: dayAt(i, BASE_DAYS),
  opened: Math.floor(_prR() * 8) + 2,
  merged: Math.floor(_prR() * 7) + 1,
  rejected: Math.floor(_prR() * 2),
}));
const _rvR = rng(137);
const baseReview = Array.from({ length: BASE_DAYS }, (_, i) => ({
  date: dayAt(i, BASE_DAYS),
  avgHours: parseFloat((_rvR() * 6 + 2).toFixed(1)),
  target: 6,
}));
const _slaR = rng(512);
const baseSla = Array.from({ length: BASE_DAYS }, (_, i) => ({
  date: dayAt(i, BASE_DAYS),
  compliance: parseFloat((_slaR() * 30 + 65).toFixed(1)),
  target: 80,
}));

function sliceByRange<T>(arr: T[], range: Range): T[] {
  return arr.slice(-windowDays(range));
}
function repoForIndex(i: number): string {
  return REPOS[i % REPOS.length];
}

// ── Selektory per strona ─────────────────────────────────────────────────────

export function selectDashboard(f: Filters) {
  const k = combined(f);
  const days = windowDays(f.range);

  const prActivityData = sliceByRange(basePrActivity, f.range).map((d) => ({
    date: d.date,
    opened: sInt(d.opened, k),
    merged: sInt(d.merged, k),
    rejected: sInt(d.rejected, k),
  }));
  const reviewTimeTrendData = sliceByRange(baseReview, f.range);

  const mergedSum = prActivityData.reduce((s, d) => s + d.merged, 0);
  const avgHours =
    reviewTimeTrendData.reduce((s, d) => s + d.avgHours, 0) /
    (reviewTimeTrendData.length || 1);

  let topContributors = M.topContributors.map((c) => ({
    ...c,
    prsMerged: sInt(c.prsMerged, repoFactor(f.repo)),
  }));
  if (f.member !== "all")
    topContributors = topContributors.filter((c) => c.name === f.member);

  const prSizeDistribution = M.prSizeDistribution.map((d) => ({
    ...d,
    value: sInt(d.value, k),
  }));

  const heatmapData = M.heatmapData.slice(-days).map((d) => ({
    ...d,
    count: sInt(d.count, k),
  }));

  let recent = M.recentActivity.map((r, i) => ({ ...r, _repo: repoForIndex(i) }));
  if (f.repo !== "all") recent = recent.filter((r) => r._repo === f.repo);
  if (f.member !== "all") recent = recent.filter((r) => r.author === f.member);
  const recentActivity = recent.map(({ _repo, ...r }) => r);

  const kpiData = {
    totalPRsMerged: {
      value: mergedSum,
      trend: M.kpiData.totalPRsMerged.trend,
      previousValue: sInt(M.kpiData.totalPRsMerged.previousValue, k),
    },
    avgReviewTime: {
      value: fmtHM(avgHours),
      trendMinutes: M.kpiData.avgReviewTime.trendMinutes,
      trend: M.kpiData.avgReviewTime.trend,
    },
    teamVelocity: {
      value: sInt(M.kpiData.teamVelocity.value, k),
      trend: M.kpiData.teamVelocity.trend,
      sparkline: M.kpiData.teamVelocity.sparkline.map((v) => sInt(v, k)),
    },
    openPRs: {
      value: sInt(M.kpiData.openPRs.value, k),
      delta: M.kpiData.openPRs.delta,
    },
  };

  return {
    kpiData,
    prActivityData,
    reviewTimeTrendData,
    topContributors,
    prSizeDistribution,
    heatmapData,
    recentActivity,
    rangeDays: days,
  };
}

export function selectPrMetrics(f: Filters) {
  const d = selectDashboard(f);
  return {
    prActivityData: d.prActivityData,
    prSizeDistribution: d.prSizeDistribution,
    recentActivity: d.recentActivity,
  };
}

export function selectCodeReview(f: Filters) {
  const k = combined(f);
  const slaComplianceData = sliceByRange(baseSla, f.range);

  let reviewByMember = M.reviewByMember.map((m) => ({
    ...m,
    reviewed: sInt(m.reviewed, repoFactor(f.repo)),
  }));
  if (f.member !== "all")
    reviewByMember = reviewByMember.filter((m) => m.name === f.member);

  let bn = M.reviewBottlenecks.map((b, i) => ({ ...b, _repo: repoForIndex(i) }));
  if (f.repo !== "all") bn = bn.filter((b) => b._repo === f.repo);
  if (f.member !== "all") bn = bn.filter((b) => b.author === f.member);
  const reviewBottlenecks = bn.map(({ _repo, ...b }) => b);

  const codeReviewMetrics = {
    ...M.codeReviewMetrics,
    prsWithNoReviews: sInt(M.codeReviewMetrics.prsWithNoReviews, k),
  };

  return { codeReviewMetrics, reviewByMember, slaComplianceData, reviewBottlenecks };
}

function sprintsForRange(range: Range): number {
  return range === "7d" ? 2 : range === "30d" ? 4 : 10;
}

export function selectVelocity(f: Filters) {
  const rf = repoFactor(f.repo);
  const n = sprintsForRange(f.range);

  const velocityData = M.velocityData.slice(-n).map((s) => ({
    ...s,
    planned: sInt(s.planned, rf),
    completed: sInt(s.completed, rf),
  }));

  let memberVelocity = M.memberVelocity.slice(
    -Math.min(n, M.memberVelocity.length)
  );
  if (f.member !== "all") {
    memberVelocity = memberVelocity.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        sprint: r.sprint as string,
        [f.member]: (r[f.member] as number) ?? 0,
      };
    }) as typeof M.memberVelocity;
  }

  return { velocityData, memberVelocity };
}

export function selectBurndown(f: Filters) {
  const k = combined(f);
  const burndownData = M.burndownData.map((d) => ({
    day: d.day,
    ideal: sFloat(d.ideal, k),
    actual: sFloat(d.actual, k),
    completed: sInt(d.completed, k),
  }));
  let sc = M.scopeChanges.map((s, i) => ({ ...s, _repo: repoForIndex(i) }));
  if (f.repo !== "all") sc = sc.filter((s) => s._repo === f.repo);
  const scopeChanges = sc.map(({ _repo, ...s }) => s);
  return { burndownData, scopeChanges };
}

export function selectTeam(f: Filters) {
  const rf = repoFactor(f.repo);
  let teamMembers = M.teamMembers.map((m) => ({
    ...m,
    prsMerged: sInt(m.prsMerged, rf),
    openPRs: sInt(m.openPRs, rf),
    sparkline: m.sparkline.map((v) => sInt(v, rf)),
  }));
  if (f.member !== "all")
    teamMembers = teamMembers.filter((m) => m.name === f.member);
  return { teamMembers };
}
