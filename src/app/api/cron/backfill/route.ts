import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { backfillRepository } from "@/lib/github/sync";

// Vercel Cron handler — runs on schedule to backfill PR history
export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find repositories that need backfill (no lastSyncedAt or synced > 1 day ago)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const repos = await prisma.repository.findMany({
    where: {
      OR: [
        { lastSyncedAt: null },
        { lastSyncedAt: { lt: oneDayAgo } },
      ],
    },
    take: 5, // Process max 5 repos per cron invocation
  });

  const results = [];

  for (const repo of repos) {
    // Find an admin user with a token for this org
    const membership = await prisma.orgMembership.findFirst({
      where: { organizationId: repo.organizationId, role: "admin" },
      include: { user: true },
    });

    if (!membership?.user?.accessToken) continue;

    try {
      const result = await backfillRepository(repo.id, membership.user.accessToken);
      results.push({ repoId: repo.id, fullName: repo.fullName, ...result });
    } catch (err: any) {
      results.push({ repoId: repo.id, fullName: repo.fullName, error: err.message });
    }
  }

  return NextResponse.json({ synced: results });
}
