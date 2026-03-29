import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "./options";
import { prisma } from "@/lib/db/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getAuthenticatedUser() {
  const session = await getSession();
  if (!session?.user) return null;

  const githubId = (session as any).githubId;
  if (!githubId) return null;

  return prisma.user.findUnique({
    where: { githubId: BigInt(githubId) },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  });
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
