import { kv } from "@vercel/kv";

const DEFAULT_TTL_SEC = 300; // 5 minutes
const METADATA_TTL_SEC = 3600; // 1 hour

export async function getCached<T>(key: string): Promise<T | null> {
  return kv.get<T>(key);
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSec: number = DEFAULT_TTL_SEC
): Promise<void> {
  await kv.set(key, value, { ex: ttlSec });
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await kv.keys(pattern);
  if (keys.length > 0) {
    await kv.del(...keys);
  }
}

export function repoMetricsCacheKey(repoId: string, metric: string): string {
  return `metrics:${repoId}:${metric}`;
}

export function repoMetadataCacheKey(repoId: string): string {
  return `repo:${repoId}:metadata`;
}

export { METADATA_TTL_SEC, DEFAULT_TTL_SEC };
