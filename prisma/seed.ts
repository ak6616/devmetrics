import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding DevMetrics database...");

  // --- Organization ---
  const org = await prisma.organization.create({
    data: {
      githubId: BigInt(98765432),
      login: "acme-engineering",
      name: "Acme Engineering",
      avatarUrl: "https://avatars.githubusercontent.com/u/98765432?v=4",
    },
  });
  console.log("Created organization:", org.login);

  // --- Users (4 developers) ---
  const usersData = [
    {
      githubId: BigInt(10000001),
      login: "anna-kowalski",
      email: "anna.kowalski@acme.dev",
      avatarUrl: "https://avatars.githubusercontent.com/u/10000001?v=4",
    },
    {
      githubId: BigInt(10000002),
      login: "mark-johnson",
      email: "mark.johnson@acme.dev",
      avatarUrl: "https://avatars.githubusercontent.com/u/10000002?v=4",
    },
    {
      githubId: BigInt(10000003),
      login: "sarah-chen",
      email: "sarah.chen@acme.dev",
      avatarUrl: "https://avatars.githubusercontent.com/u/10000003?v=4",
    },
    {
      githubId: BigInt(10000004),
      login: "tomasz-nowak",
      email: "tomasz.nowak@acme.dev",
      avatarUrl: "https://avatars.githubusercontent.com/u/10000004?v=4",
    },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({ data: u });
    users.push(user);
  }
  console.log(`Created ${users.length} users`);

  // --- Org Memberships ---
  for (let i = 0; i < users.length; i++) {
    await prisma.orgMembership.create({
      data: {
        userId: users[i].id,
        organizationId: org.id,
        role: i === 0 ? "admin" : "member",
      },
    });
  }
  console.log("Created org memberships");

  // --- Repository ---
  const repo = await prisma.repository.create({
    data: {
      githubId: BigInt(555000111),
      organizationId: org.id,
      fullName: "acme-engineering/platform-api",
      name: "platform-api",
      private: true,
      lastSyncedAt: new Date("2026-03-29T18:00:00Z"),
    },
  });
  console.log("Created repository:", repo.fullName);

  // --- Sprint (2-week sprint ending soon) ---
  const sprint = await prisma.sprint.create({
    data: {
      repositoryId: repo.id,
      name: "Sprint 14 - Q1 Wrap-up",
      startDate: new Date("2026-03-16"),
      endDate: new Date("2026-03-30"),
      status: "active",
    },
  });
  console.log("Created sprint:", sprint.name);

  // --- Pull Requests (15 PRs with various states) ---
  const now = new Date("2026-03-29T12:00:00Z");

  const prsData: Array<{
    number: number;
    title: string;
    authorIdx: number;
    state: string;
    draft: boolean;
    openedAt: Date;
    closedAt: Date | null;
    mergedAt: Date | null;
    linesAdded: number;
    linesRemoved: number;
    reviewCount: number;
    cycleTimeHrs: number | null;
    reviewTimeHrs: number | null;
    labels: string[];
    storyPoints: number | null;
    completed: boolean;
  }> = [
    // --- Merged PRs (8) ---
    {
      number: 101,
      title: "feat: add rate limiting middleware for public API endpoints",
      authorIdx: 0,
      state: "closed",
      draft: false,
      openedAt: new Date("2026-03-17T09:00:00Z"),
      closedAt: new Date("2026-03-18T14:30:00Z"),
      mergedAt: new Date("2026-03-18T14:30:00Z"),
      linesAdded: 245,
      linesRemoved: 12,
      reviewCount: 2,
      cycleTimeHrs: 29.5,
      reviewTimeHrs: 4.2,
      labels: ["feature", "api"],
      storyPoints: 5,
      completed: true,
    },
    {
      number: 102,
      title: "fix: resolve race condition in webhook delivery queue",
      authorIdx: 1,
      state: "closed",
      draft: false,
      openedAt: new Date("2026-03-17T11:00:00Z"),
      closedAt: new Date("2026-03-18T10:00:00Z"),
      mergedAt: new Date("2026-03-18T10:00:00Z"),
      linesAdded: 67,
      linesRemoved: 23,
      reviewCount: 1,
      cycleTimeHrs: 23.0,
      reviewTimeHrs: 2.1,
      labels: ["bug", "critical"],
      storyPoints: 3,
      completed: true,
    },
    {
      number: 103,
      title: "refactor: extract authentication logic into shared service",
      authorIdx: 2,
      state: "closed",
      draft: false,
      openedAt: new Date("2026-03-18T08:00:00Z"),
      closedAt: new Date("2026-03-20T16:00:00Z"),
      mergedAt: new Date("2026-03-20T16:00:00Z"),
      linesAdded: 312,
      linesRemoved: 287,
      reviewCount: 3,
      cycleTimeHrs: 56.0,
      reviewTimeHrs: 8.5,
      labels: ["refactor"],
      storyPoints: 8,
      completed: true,
    },
    {
      number: 104,
      title: "feat: implement organization-level billing dashboard",
      authorIdx: 3,
      state: "closed",
      draft: false,
      openedAt: new Date("2026-03-19T10:00:00Z"),
      closedAt: new Date("2026-03-22T11:00:00Z"),
      mergedAt: new Date("2026-03-22T11:00:00Z"),
      linesAdded: 534,
      linesRemoved: 45,
      reviewCount: 2,
      cycleTimeHrs: 73.0,
      reviewTimeHrs: 6.3,
      labels: ["feature", "billing"],
      storyPoints: 8,
      completed: true,
    },
    {
      number: 105,
      title: "fix: correct timezone handling in daily metric aggregation",
      authorIdx: 0,
      state: "closed",
      draft: false,
      openedAt: new Date("2026-03-20T14:00:00Z"),
      closedAt: new Date("2026-03-21T09:30:00Z"),
      mergedAt: new Date("2026-03-21T09:30:00Z"),
      linesAdded: 38,
      linesRemoved: 15,
      reviewCount: 1,
      cycleTimeHrs: 19.5,
      reviewTimeHrs: 1.8,
      labels: ["bug"],
      storyPoints: 2,
      completed: true,
    },
    {
      number: 106,
      title: "chore: upgrade Next.js to 14.2.35 and patch dependencies",
      authorIdx: 1,
      state: "closed",
      draft: false,
      openedAt: new Date("2026-03-21T08:00:00Z"),
      closedAt: new Date("2026-03-21T15:00:00Z"),
      mergedAt: new Date("2026-03-21T15:00:00Z"),
      linesAdded: 1200,
      linesRemoved: 1180,
      reviewCount: 1,
      cycleTimeHrs: 7.0,
      reviewTimeHrs: 1.5,
      labels: ["chore", "dependencies"],
      storyPoints: 2,
      completed: true,
    },
    {
      number: 107,
      title: "feat: add CSV export for pull request metrics",
      authorIdx: 2,
      state: "closed",
      draft: false,
      openedAt: new Date("2026-03-22T09:00:00Z"),
      closedAt: new Date("2026-03-24T11:00:00Z"),
      mergedAt: new Date("2026-03-24T11:00:00Z"),
      linesAdded: 189,
      linesRemoved: 8,
      reviewCount: 2,
      cycleTimeHrs: 50.0,
      reviewTimeHrs: 5.0,
      labels: ["feature"],
      storyPoints: 5,
      completed: true,
    },
    {
      number: 108,
      title: "fix: prevent duplicate sprint items when syncing from GitHub",
      authorIdx: 3,
      state: "closed",
      draft: false,
      openedAt: new Date("2026-03-24T13:00:00Z"),
      closedAt: new Date("2026-03-25T10:00:00Z"),
      mergedAt: new Date("2026-03-25T10:00:00Z"),
      linesAdded: 52,
      linesRemoved: 11,
      reviewCount: 1,
      cycleTimeHrs: 21.0,
      reviewTimeHrs: 2.0,
      labels: ["bug"],
      storyPoints: 3,
      completed: true,
    },
    // --- Open PRs (5) ---
    {
      number: 109,
      title: "feat: real-time notification system for PR status changes",
      authorIdx: 0,
      state: "open",
      draft: false,
      openedAt: new Date("2026-03-26T09:00:00Z"),
      closedAt: null,
      mergedAt: null,
      linesAdded: 410,
      linesRemoved: 25,
      reviewCount: 1,
      cycleTimeHrs: null,
      reviewTimeHrs: 12.0,
      labels: ["feature", "notifications"],
      storyPoints: 8,
      completed: false,
    },
    {
      number: 110,
      title: "feat: add team velocity chart with moving average overlay",
      authorIdx: 1,
      state: "open",
      draft: false,
      openedAt: new Date("2026-03-27T10:00:00Z"),
      closedAt: null,
      mergedAt: null,
      linesAdded: 278,
      linesRemoved: 34,
      reviewCount: 2,
      cycleTimeHrs: null,
      reviewTimeHrs: 6.5,
      labels: ["feature", "charts"],
      storyPoints: 5,
      completed: false,
    },
    {
      number: 111,
      title: "refactor: migrate remaining API routes to app router",
      authorIdx: 2,
      state: "open",
      draft: true,
      openedAt: new Date("2026-03-28T08:00:00Z"),
      closedAt: null,
      mergedAt: null,
      linesAdded: 156,
      linesRemoved: 198,
      reviewCount: 0,
      cycleTimeHrs: null,
      reviewTimeHrs: null,
      labels: ["refactor", "tech-debt"],
      storyPoints: 5,
      completed: false,
    },
    {
      number: 112,
      title: "fix: handle GitHub API pagination correctly for large repos",
      authorIdx: 3,
      state: "open",
      draft: false,
      openedAt: new Date("2026-03-28T14:00:00Z"),
      closedAt: null,
      mergedAt: null,
      linesAdded: 95,
      linesRemoved: 42,
      reviewCount: 1,
      cycleTimeHrs: null,
      reviewTimeHrs: 3.0,
      labels: ["bug", "api"],
      storyPoints: 3,
      completed: false,
    },
    {
      number: 113,
      title: "docs: update API reference with new rate limiting headers",
      authorIdx: 0,
      state: "open",
      draft: false,
      openedAt: new Date("2026-03-29T09:00:00Z"),
      closedAt: null,
      mergedAt: null,
      linesAdded: 87,
      linesRemoved: 12,
      reviewCount: 0,
      cycleTimeHrs: null,
      reviewTimeHrs: null,
      labels: ["documentation"],
      storyPoints: 2,
      completed: false,
    },
    // --- Closed (not merged) PRs (2) ---
    {
      number: 114,
      title: "feat: experimental GraphQL endpoint for metrics",
      authorIdx: 1,
      state: "closed",
      draft: false,
      openedAt: new Date("2026-03-19T13:00:00Z"),
      closedAt: new Date("2026-03-23T09:00:00Z"),
      mergedAt: null,
      linesAdded: 520,
      linesRemoved: 15,
      reviewCount: 3,
      cycleTimeHrs: null,
      reviewTimeHrs: 10.0,
      labels: ["feature", "experimental"],
      storyPoints: null,
      completed: false,
    },
    {
      number: 115,
      title: "fix: attempt to resolve flaky e2e test suite",
      authorIdx: 3,
      state: "closed",
      draft: false,
      openedAt: new Date("2026-03-22T15:00:00Z"),
      closedAt: new Date("2026-03-24T08:00:00Z"),
      mergedAt: null,
      linesAdded: 34,
      linesRemoved: 89,
      reviewCount: 1,
      cycleTimeHrs: null,
      reviewTimeHrs: 3.5,
      labels: ["bug", "testing"],
      storyPoints: null,
      completed: false,
    },
  ];

  const pullRequests = [];
  for (const pr of prsData) {
    const author = users[pr.authorIdx];
    const firstReviewAt =
      pr.reviewCount > 0 && pr.openedAt
        ? new Date(pr.openedAt.getTime() + (pr.reviewTimeHrs ?? 4) * 3600000)
        : null;

    const created = await prisma.pullRequest.create({
      data: {
        githubId: BigInt(900000 + pr.number),
        repositoryId: repo.id,
        number: pr.number,
        title: pr.title,
        authorLogin: author.login,
        authorId: author.id,
        state: pr.state,
        draft: pr.draft,
        openedAt: pr.openedAt,
        closedAt: pr.closedAt,
        mergedAt: pr.mergedAt,
        firstReviewAt,
        linesAdded: pr.linesAdded,
        linesRemoved: pr.linesRemoved,
        reviewCount: pr.reviewCount,
        cycleTimeHrs: pr.cycleTimeHrs,
        reviewTimeHrs: pr.reviewTimeHrs,
        labels: pr.labels,
      },
    });
    pullRequests.push({ ...created, _seed: pr });
  }
  console.log(`Created ${pullRequests.length} pull requests`);

  // --- PR Reviews ---
  let reviewCount = 0;
  for (let i = 0; i < pullRequests.length; i++) {
    const pr = pullRequests[i];
    const prSeed = prsData[i];
    const authorIdx = prSeed.authorIdx;
    const numReviews = prSeed.reviewCount;

    for (let r = 0; r < numReviews; r++) {
      const reviewerIdx = (authorIdx + r + 1) % users.length;
      const submittedAt = pr.openedAt
        ? new Date(
            new Date(pr.openedAt).getTime() +
              ((prSeed.reviewTimeHrs ?? 4) + r * 8) * 3600000,
          )
        : null;

      await prisma.prReview.create({
        data: {
          pullRequestId: pr.id,
          reviewerLogin: users[reviewerIdx].login,
          reviewerId: users[reviewerIdx].id,
          state:
            prSeed.mergedAt || prSeed.state === "open"
              ? "APPROVED"
              : r === 0
                ? "CHANGES_REQUESTED"
                : "COMMENTED",
          submittedAt,
        },
      });
      reviewCount++;
    }
  }
  console.log(`Created ${reviewCount} PR reviews`);

  // --- Sprint Items (link PRs to sprint) ---
  let sprintItemCount = 0;
  for (let i = 0; i < pullRequests.length; i++) {
    const prSeed = prsData[i];
    if (prSeed.storyPoints == null) continue;

    await prisma.sprintItem.create({
      data: {
        sprintId: sprint.id,
        pullRequestId: pullRequests[i].id,
        storyPoints: prSeed.storyPoints,
        completed: prSeed.completed,
        completedAt: prSeed.completed ? prSeed.mergedAt : null,
      },
    });
    sprintItemCount++;
  }
  console.log(`Created ${sprintItemCount} sprint items`);

  // --- Daily Metrics (14 days of the sprint) ---
  const dailyData = [
    { date: "2026-03-16", prsOpened: 2, prsMerged: 0, avgCycleTime: null, avgReviewTime: null },
    { date: "2026-03-17", prsOpened: 2, prsMerged: 0, avgCycleTime: null, avgReviewTime: null },
    { date: "2026-03-18", prsOpened: 1, prsMerged: 2, avgCycleTime: 26.3, avgReviewTime: 3.2 },
    { date: "2026-03-19", prsOpened: 2, prsMerged: 0, avgCycleTime: null, avgReviewTime: null },
    { date: "2026-03-20", prsOpened: 1, prsMerged: 1, avgCycleTime: 56.0, avgReviewTime: 8.5 },
    { date: "2026-03-21", prsOpened: 1, prsMerged: 2, avgCycleTime: 13.3, avgReviewTime: 1.7 },
    { date: "2026-03-22", prsOpened: 2, prsMerged: 1, avgCycleTime: 73.0, avgReviewTime: 6.3 },
    { date: "2026-03-23", prsOpened: 0, prsMerged: 0, avgCycleTime: null, avgReviewTime: null },
    { date: "2026-03-24", prsOpened: 1, prsMerged: 1, avgCycleTime: 50.0, avgReviewTime: 5.0 },
    { date: "2026-03-25", prsOpened: 0, prsMerged: 1, avgCycleTime: 21.0, avgReviewTime: 2.0 },
    { date: "2026-03-26", prsOpened: 1, prsMerged: 0, avgCycleTime: null, avgReviewTime: null },
    { date: "2026-03-27", prsOpened: 1, prsMerged: 0, avgCycleTime: null, avgReviewTime: null },
    { date: "2026-03-28", prsOpened: 2, prsMerged: 0, avgCycleTime: null, avgReviewTime: null },
    { date: "2026-03-29", prsOpened: 1, prsMerged: 0, avgCycleTime: null, avgReviewTime: null },
  ];

  for (const d of dailyData) {
    await prisma.dailyMetric.create({
      data: {
        repositoryId: repo.id,
        date: new Date(d.date),
        prsOpened: d.prsOpened,
        prsMerged: d.prsMerged,
        avgCycleTime: d.avgCycleTime,
        avgReviewTime: d.avgReviewTime,
      },
    });
  }
  console.log(`Created ${dailyData.length} daily metrics`);

  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
