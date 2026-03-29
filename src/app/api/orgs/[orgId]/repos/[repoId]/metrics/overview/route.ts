import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, forbidden } from "@/lib/auth/session";
import { getOverviewMetrics, parseDateRange, InvalidDateRangeError } from "@/lib/metrics/queries";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; repoId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const membership = user.memberships.find((m: any) => m.organizationId === params.orgId);
  if (!membership) return forbidden();

  let range;
  try {
    range = parseDateRange(req.nextUrl.searchParams);
  } catch (e) {
    if (e instanceof InvalidDateRangeError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
  const metrics = await getOverviewMetrics(params.repoId, range);

  return NextResponse.json(metrics);
}
