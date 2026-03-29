import { prisma } from "@/lib/db/client";
import { getCached, setCached, repoMetricsCacheKey, DEFAULT_TTL_SEC } from "@/lib/cache/kv";

interface DateRange {
  start: Date;
  end: Date;
}

export async function getOverviewMetrics(repoId: string, range: DateRange) {
  const cacheKey = repoMetricsCacheKey(repoId, `overview:${range.start.toISOString()}:${range.end.toISOString()}`);
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const [prCount, mergedCount, avgMetrics] = await Promise.all([
    prisma.pullRequest.count({
      where: { repositoryId: repoId, openedAt: { gte: range.start, lte: range.end } },
    }),
    prisma.pullRequest.count({
      where: { repositoryId: repoId, mergedAt: { gte: range.start, lte: range.end } },
    }),
    prisma.pullRequest.aggregate({
      where: { repositoryId: repoId, mergedAt: { gte: range.start, lte: range.end } },
      _avg: { cycleTimeHrs: true, reviewTimeHrs: true },
    }),
  ]);

  const result = {
    prsOpened: prCount,
    prsMerged: mergedCount,
    mergeRate: prCount > 0 ? mergedCount / prCount : 0,
    avgCycleTimeHrs: avgMetrics._avg.cycleTimeHrs ?? 0,
    avgReviewTimeHrs: avgMetrics._avg.reviewTimeHrs ?? 0,
  };

  await setCached(cacheKey, result);
  return result;
}

export async function getPrVolumeTimeSeries(repoId: string, range: DateRange) {
  const cacheKey = repoMetricsCacheKey(repoId, `pr-volume:${range.start.toISOString()}:${range.end.toISOString()}`);
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const metrics = await prisma.dailyMetric.findMany({
    where: { repositoryId: repoId, date: { gte: range.start, lte: range.end } },
    orderBy: { date: "asc" },
    select: { date: true, prsOpened: true, prsMerged: true },
  });

  await setCached(cacheKey, metrics);
  return metrics;
}

export async function getCycleTimeTrend(repoId: string, range: DateRange) {
  const cacheKey = repoMetricsCacheKey(repoId, `cycle-time:${range.start.toISOString()}:${range.end.toISOString()}`);
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const metrics = await prisma.dailyMetric.findMany({
    where: { repositoryId: repoId, date: { gte: range.start, lte: range.end } },
    orderBy: { date: "asc" },
    select: { date: true, avgCycleTime: true },
  });

  await setCached(cacheKey, metrics);
  return metrics;
}

export async function getReviewTimeTrend(repoId: string, range: DateRange) {
  const cacheKey = repoMetricsCacheKey(repoId, `review-time:${range.start.toISOString()}:${range.end.toISOString()}`);
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const metrics = await prisma.dailyMetric.findMany({
    where: { repositoryId: repoId, date: { gte: range.start, lte: range.end } },
    orderBy: { date: "asc" },
    select: { date: true, avgReviewTime: true },
  });

  await setCached(cacheKey, metrics);
  return metrics;
}

export async function getVelocity(repoId: string) {
  const cacheKey = repoMetricsCacheKey(repoId, "velocity");
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const sprints = await prisma.sprint.findMany({
    where: { repositoryId: repoId, status: "completed" },
    orderBy: { endDate: "desc" },
    take: 10,
    include: {
      items: { where: { completed: true } },
    },
  });

  const result = sprints.map((s: any) => {
    const totalPoints = s.items.reduce((sum: any, i: any) => sum + (i.storyPoints ?? 0), 0);
    const weeks = Math.max(1, (s.endDate.getTime() - s.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return {
      sprintName: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      totalPoints,
      pointsPerWeek: totalPoints / weeks,
    };
  });

  await setCached(cacheKey, result);
  return result;
}

export async function getBurndown(repoId: string, sprintId: string) {
  const cacheKey = repoMetricsCacheKey(repoId, `burndown:${sprintId}`);
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { items: true },
  });

  if (!sprint) return null;

  const totalPoints = sprint.items.reduce((sum: any, i: any) => sum + (i.storyPoints ?? 0), 0);
  const days: { date: string; remaining: number }[] = [];

  const current = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const completedByDay = sprint.items
      .filter((i: any) => i.completed && i.completedAt && i.completedAt <= current)
      .reduce((sum: any, i: any) => sum + (i.storyPoints ?? 0), 0);

    days.push({ date: dateStr, remaining: totalPoints - completedByDay });
    current.setDate(current.getDate() + 1);
  }

  const result = { totalPoints, days };
  await setCached(cacheKey, result);
  return result;
}

export async function getContributorMetrics(repoId: string, range: DateRange) {
  const cacheKey = repoMetricsCacheKey(repoId, `contributors:${range.start.toISOString()}:${range.end.toISOString()}`);
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const prs = await prisma.pullRequest.groupBy({
    by: ["authorLogin"],
    where: { repositoryId: repoId, openedAt: { gte: range.start, lte: range.end } },
    _count: { id: true },
    _avg: { cycleTimeHrs: true },
  });

  const result = prs.map((p: any) => ({
    authorLogin: p.authorLogin,
    prCount: p._count.id,
    avgCycleTimeHrs: p._avg.cycleTimeHrs ?? 0,
  }));

  await setCached(cacheKey, result);
  return result;
}

export class InvalidDateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDateRangeError";
  }
}

export function parseDateRange(searchParams: URLSearchParams): DateRange {
  const now = new Date();

  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const start = startParam
    ? new Date(startParam)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = endParam ? new Date(endParam) : now;

  if (isNaN(start.getTime())) {
    throw new InvalidDateRangeError(`Invalid start date: "${startParam}"`);
  }
  if (isNaN(end.getTime())) {
    throw new InvalidDateRangeError(`Invalid end date: "${endParam}"`);
  }

  return { start, end };
}
