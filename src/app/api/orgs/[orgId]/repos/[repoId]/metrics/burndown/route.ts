import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, forbidden } from "@/lib/auth/session";
import { getBurndown } from "@/lib/metrics/queries";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; repoId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const membership = user.memberships.find((m: any) => m.organizationId === params.orgId);
  if (!membership) return forbidden();

  const sprintId = req.nextUrl.searchParams.get("sprintId");
  if (!sprintId) {
    return NextResponse.json({ error: "sprintId required" }, { status: 400 });
  }

  const data = await getBurndown(params.repoId, sprintId);
  if (!data) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
