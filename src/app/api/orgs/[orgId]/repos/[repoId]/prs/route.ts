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

  const sp = req.nextUrl.searchParams;
  const author = sp.get("author");
  const state = sp.get("state");
  const startDate = sp.get("start");
  const endDate = sp.get("end");
  const page = parseInt(sp.get("page") ?? "1");
  const perPage = Math.min(parseInt(sp.get("perPage") ?? "50"), 100);

  const where: any = { repositoryId: params.repoId };
  if (author) where.authorLogin = author;
  if (state) where.state = state;
  if (startDate || endDate) {
    where.openedAt = {};
    if (startDate) where.openedAt.gte = new Date(startDate);
    if (endDate) where.openedAt.lte = new Date(endDate);
  }

  const [prs, total] = await Promise.all([
    prisma.pullRequest.findMany({
      where,
      orderBy: { openedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { reviews: true },
    }),
    prisma.pullRequest.count({ where }),
  ]);

  return NextResponse.json({
    data: prs,
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}
