import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, forbidden } from "@/lib/auth/session";
import { getVelocity } from "@/lib/metrics/queries";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; repoId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const membership = user.memberships.find((m: any) => m.organizationId === params.orgId);
  if (!membership) return forbidden();

  const data = await getVelocity(params.repoId);

  return NextResponse.json(data);
}
