import { prisma } from "@/lib/db/client";
import { createOctokit } from "./client";
import { invalidateCache } from "@/lib/cache/kv";

export async function upsertPullRequest(
  repositoryId: string,
  prData: {
    github_id: number;
    number: number;
    title: string;
    author_login: string;
    state: string;
    draft: boolean;
    opened_at: string | null;
    closed_at: string | null;
    merged_at: string | null;
    additions: number;
    deletions: number;
    labels: string[];
  }
) {
  const openedAt = prData.opened_at ? new Date(prData.opened_at) : null;
  const closedAt = prData.closed_at ? new Date(prData.closed_at) : null;
  const mergedAt = prData.merged_at ? new Date(prData.merged_at) : null;

  let cycleTimeHrs: number | null = null;
  if (openedAt && mergedAt) {
    cycleTimeHrs = (mergedAt.getTime() - openedAt.getTime()) / (1000 * 60 * 60);
  }

  const pr = await prisma.pullRequest.upsert({
    where: {
      repositoryId_number: { repositoryId, number: prData.number },
    },
    create: {
      githubId: BigInt(prData.github_id),
      repositoryId,
      number: prData.number,
      title: prData.title,
      authorLogin: prData.author_login,
      state: prData.state,
      draft: prData.draft,
      openedAt,
      closedAt,
      mergedAt,
      linesAdded: prData.additions,
      linesRemoved: prData.deletions,
      cycleTimeHrs,
      labels: prData.labels,
    },
    update: {
      title: prData.title,
      state: prData.state,
      draft: prData.draft,
      closedAt,
      mergedAt,
      linesAdded: prData.additions,
      linesRemoved: prData.deletions,
      cycleTimeHrs,
      labels: prData.labels,
    },
  });

  return pr;
}

export async function upsertReview(
  pullRequestId: string,
  reviewData: {
    reviewer_login: string;
    state: string;
    submitted_at: string;
  }
) {
  const submittedAt = new Date(reviewData.submitted_at);

  await prisma.prReview.create({
    data: {
      pullRequestId,
      reviewerLogin: reviewData.reviewer_login,
      state: reviewData.state,
      submittedAt,
    },
  });

  // Update first_review_at and review_count on the PR
  const reviewCount = await prisma.prReview.count({ where: { pullRequestId } });
  const firstReview = await prisma.prReview.findFirst({
    where: { pullRequestId },
    orderBy: { submittedAt: "asc" },
  });

  const pr = await prisma.pullRequest.findUnique({ where: { id: pullRequestId } });

  let reviewTimeHrs: number | null = null;
  if (pr?.openedAt && firstReview?.submittedAt) {
    reviewTimeHrs =
      (firstReview.submittedAt.getTime() - pr.openedAt.getTime()) / (1000 * 60 * 60);
  }

  await prisma.pullRequest.update({
    where: { id: pullRequestId },
    data: {
      reviewCount,
      firstReviewAt: firstReview?.submittedAt,
      reviewTimeHrs,
    },
  });
}

export async function backfillRepository(
  repoId: string,
  encryptedToken: string,
  page: number = 1,
  daysBack: number = 90
) {
  const repo = await prisma.repository.findUnique({ where: { id: repoId } });
  if (!repo) throw new Error(`Repository ${repoId} not found`);

  const octokit = createOctokit(encryptedToken);
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
  const [owner, repoName] = repo.fullName.split("/");

  const { data: prs } = await octokit.pulls.list({
    owner,
    repo: repoName,
    state: "all",
    sort: "updated",
    direction: "desc",
    per_page: 100,
    page,
  });

  let processedCount = 0;

  for (const pr of prs) {
    if (new Date(pr.updated_at) < new Date(since)) break;

    await upsertPullRequest(repoId, {
      github_id: pr.id,
      number: pr.number,
      title: pr.title,
      author_login: pr.user?.login ?? "unknown",
      state: pr.merged_at ? "merged" : pr.state,
      draft: pr.draft ?? false,
      opened_at: pr.created_at,
      closed_at: pr.closed_at,
      merged_at: pr.merged_at ?? null,
      additions: 0, // Not available in list endpoint
      deletions: 0,
      labels: pr.labels.map((l) => l.name ?? ""),
    });
    processedCount++;
  }

  // Update last synced
  await prisma.repository.update({
    where: { id: repoId },
    data: { lastSyncedAt: new Date() },
  });

  await invalidateCache(`metrics:${repoId}:*`);

  return {
    processedCount,
    hasMore: prs.length === 100,
    nextPage: page + 1,
  };
}
