import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAuthenticatedUser, unauthorized, forbidden } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; repoId: string; prId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const membership = user.memberships.find((m: any) => m.organizationId === params.orgId);
  if (!membership) return forbidden();

  const pr = await prisma.pullRequest.findUnique({
    where: { id: params.prId },
    include: {
      reviews: { orderBy: { submittedAt: "asc" } },
    },
  });

  if (!pr || pr.repositoryId !== params.repoId) {
    return NextResponse.json({ error: "Pull request not found" }, { status: 404 });
  }

  return NextResponse.json(pr);
}
