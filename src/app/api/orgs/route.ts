import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth/session";
import { createOctokit } from "@/lib/github/client";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const orgs = await prisma.organization.findMany({
    where: {
      memberships: { some: { userId: user.id } },
    },
    include: {
      _count: { select: { repositories: true } },
    },
  });

  return NextResponse.json(orgs);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  if (!user.accessToken) {
    return NextResponse.json({ error: "No GitHub token found" }, { status: 400 });
  }

  const { githubOrgLogin } = await req.json();
  const octokit = createOctokit(user.accessToken);

  const { data: ghOrg } = await octokit.orgs.get({ org: githubOrgLogin });

  const org = await prisma.organization.upsert({
    where: { githubId: BigInt(ghOrg.id) },
    create: {
      githubId: BigInt(ghOrg.id),
      login: ghOrg.login,
      name: ghOrg.name ?? null,
      avatarUrl: ghOrg.avatar_url,
    },
    update: {
      name: ghOrg.name ?? undefined,
      avatarUrl: ghOrg.avatar_url,
    },
  });

  // Create membership
  await prisma.orgMembership.upsert({
    where: {
      userId_organizationId: { userId: user.id, organizationId: org.id },
    },
    create: { userId: user.id, organizationId: org.id, role: "admin" },
    update: {},
  });

  return NextResponse.json(org, { status: 201 });
}
