import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAuthenticatedUser, unauthorized, forbidden } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; repoId: string; sprintId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const membership = user.memberships.find((m: any) => m.organizationId === params.orgId);
  if (!membership) return forbidden();

  const { pullRequestId, storyPoints } = await req.json();

  const item = await prisma.sprintItem.create({
    data: {
      sprintId: params.sprintId,
      pullRequestId,
      storyPoints,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
