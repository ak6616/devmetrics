import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAuthenticatedUser, unauthorized, forbidden } from "@/lib/auth/session";
import { createOctokit } from "@/lib/github/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; repoId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  if (!user.accessToken) {
    return NextResponse.json({ error: "No GitHub token" }, { status: 400 });
  }

  const membership = user.memberships.find(
    (m) => m.organizationId === params.orgId
  );
  if (!membership || membership.role !== "admin") return forbidden();

  const octokit = createOctokit(user.accessToken);
  const org = await prisma.organization.findUnique({ where: { id: params.orgId } });
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Fetch the repo from GitHub
  const { data: ghRepo } = await octokit.repos.get({
    owner: org.login,
    repo: params.repoId,
  });

  // Create webhook
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET!;
  const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/github`;

  const { data: hook } = await octokit.repos.createWebhook({
    owner: org.login,
    repo: ghRepo.name,
    config: {
      url: webhookUrl,
      content_type: "json",
      secret: webhookSecret,
    },
    events: ["pull_request", "pull_request_review"],
    active: true,
  });

  // Upsert repository record
  const repo = await prisma.repository.upsert({
    where: { githubId: BigInt(ghRepo.id) },
    create: {
      githubId: BigInt(ghRepo.id),
      organizationId: params.orgId,
      fullName: ghRepo.full_name,
      name: ghRepo.name,
      private: ghRepo.private,
      webhookId: BigInt(hook.id),
    },
    update: {
      webhookId: BigInt(hook.id),
      fullName: ghRepo.full_name,
      private: ghRepo.private,
    },
  });

  return NextResponse.json(repo, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string; repoId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  if (!user.accessToken) {
    return NextResponse.json({ error: "No GitHub token" }, { status: 400 });
  }

  const membership = user.memberships.find(
    (m) => m.organizationId === params.orgId
  );
  if (!membership || membership.role !== "admin") return forbidden();

  const repo = await prisma.repository.findFirst({
    where: { name: params.repoId, organizationId: params.orgId },
  });
  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  // Remove webhook from GitHub
  if (repo.webhookId) {
    const octokit = createOctokit(user.accessToken);
    const [owner, repoName] = repo.fullName.split("/");
    try {
      await octokit.repos.deleteWebhook({
        owner,
        repo: repoName,
        hook_id: Number(repo.webhookId),
      });
    } catch {
      // Webhook may already be deleted
    }
  }

  await prisma.repository.delete({ where: { id: repo.id } });

  return NextResponse.json({ success: true });
}
