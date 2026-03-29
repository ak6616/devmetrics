import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAuthenticatedUser, unauthorized, forbidden } from "@/lib/auth/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; repoId: string; sprintId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const membership = user.memberships.find((m: any) => m.organizationId === params.orgId);
  if (!membership || membership.role !== "admin") return forbidden();

  const body = await req.json();
  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
  if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
  if (body.status !== undefined) updateData.status = body.status;

  const sprint = await prisma.sprint.update({
    where: { id: params.sprintId },
    data: updateData,
  });

  return NextResponse.json(sprint);
}
