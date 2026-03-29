import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAuthenticatedUser, unauthorized, forbidden } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const membership = user.memberships.find(
    (m) => m.organizationId === params.orgId
  );
  if (!membership) return forbidden();

  const repos = await prisma.repository.findMany({
    where: { organizationId: params.orgId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { pullRequests: true } },
    },
  });

  return NextResponse.json(repos);
}
