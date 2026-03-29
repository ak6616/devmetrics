import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/github/webhooks";
import { upsertPullRequest, upsertReview } from "@/lib/github/sync";
import { prisma } from "@/lib/db/client";
import { invalidateCache } from "@/lib/cache/kv";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  const body = JSON.parse(payload);

  if (event === "pull_request") {
    await handlePullRequestEvent(body);
  } else if (event === "pull_request_review") {
    await handlePullRequestReviewEvent(body);
  }

  return NextResponse.json({ ok: true });
}

async function handlePullRequestEvent(body: any) {
  const ghRepo = body.repository;
  const pr = body.pull_request;

  const repo = await prisma.repository.findUnique({
    where: { githubId: BigInt(ghRepo.id) },
  });
  if (!repo) return;

  await upsertPullRequest(repo.id, {
    github_id: pr.id,
    number: pr.number,
    title: pr.title,
    author_login: pr.user?.login ?? "unknown",
    state: pr.merged_at ? "merged" : pr.state,
    draft: pr.draft ?? false,
    opened_at: pr.created_at,
    closed_at: pr.closed_at,
    merged_at: pr.merged_at,
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
    labels: (pr.labels ?? []).map((l: any) => l.name),
  });

  await invalidateCache(`metrics:${repo.id}:*`);
}

async function handlePullRequestReviewEvent(body: any) {
  const ghRepo = body.repository;
  const review = body.review;
  const prNumber = body.pull_request.number;

  const repo = await prisma.repository.findUnique({
    where: { githubId: BigInt(ghRepo.id) },
  });
  if (!repo) return;

  const pr = await prisma.pullRequest.findUnique({
    where: { repositoryId_number: { repositoryId: repo.id, number: prNumber } },
  });
  if (!pr) return;

  await upsertReview(pr.id, {
    reviewer_login: review.user.login,
    state: review.state,
    submitted_at: review.submitted_at,
  });

  await invalidateCache(`metrics:${repo.id}:*`);
}
