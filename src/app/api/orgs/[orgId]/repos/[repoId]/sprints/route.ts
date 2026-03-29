import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAuthenticatedUser, unauthorized, forbidden } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; repoId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const membership = user.memberships.find((m: any) => m.organizationId === params.orgId);
  if (!membership) return forbidden();

  const sprints = await prisma.sprint.findMany({
    where: { repositoryId: params.repoId },
    orderBy: { startDate: "desc" },
    include: {
      items: { include: { pullRequest: true } },
    },
  });

  return NextResponse.json(sprints);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; repoId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const membership = user.memberships.find((m: any) => m.organizationId === params.orgId);
  if (!membership || membership.role !== "admin") return forbidden();

  const { name, startDate, endDate } = await req.json();

  const sprint = await prisma.sprint.create({
    data: {
      repositoryId: params.repoId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  return NextResponse.json(sprint, { status: 201 });
}
