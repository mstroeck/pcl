import { createHash } from 'crypto';
import { readFile, writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  ttl: number; // seconds
  enabled: boolean;
}

const CACHE_DIR = join(homedir(), '.plan-council', 'cache');

// Ensure cache directory exists
async function ensureCacheDir(): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
  }
}

// Generate SHA-256 hash for cache key
export function generateCacheKey(...inputs: string[]): string {
  const combined = inputs.join('::');
  return createHash('sha256').update(combined).digest('hex');
}

// Get cache file path
function getCachePath(key: string): string {
  return join(CACHE_DIR, `${key}.json`);
}

// Read from cache
export async function getFromCache<T>(key: string, ttl: number): Promise<T | null> {
  try {
    const filePath = getCachePath(key);
    const data = await readFile(filePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(data);

    // Check if entry is expired
    const age = Date.now() - entry.timestamp;
    if (age > ttl * 1000) {
      // Entry expired, delete it
      await unlink(filePath).catch(() => {});
      return null;
    }

    return entry.value;
  } catch (error) {
    // Cache miss or read error
    return null;
  }
}

// Write to cache
export async function setInCache<T>(key: string, value: T, ttl: number): Promise<void> {
  await ensureCacheDir();

  const entry: CacheEntry<T> = {
    key,
    value,
    timestamp: Date.now(),
    ttl,
  };

  const filePath = getCachePath(key);
  await writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
}

// Clear all cache
export async function clearCache(): Promise<number> {
  try {
    await ensureCacheDir();
    const files = await readdir(CACHE_DIR);

    let cleared = 0;
    for (const file of files) {
      if (file.endsWith('.json')) {
        await unlink(join(CACHE_DIR, file));
        cleared++;
      }
    }

    return cleared;
  } catch (error) {
    return 0;
  }
}

// Get cache statistics
export async function getCacheStats(): Promise<{ files: number; size: number }> {
  try {
    await ensureCacheDir();
    const files = await readdir(CACHE_DIR);

    let totalSize = 0;
    let fileCount = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(CACHE_DIR, file);
        const stats = await stat(filePath);
        totalSize += stats.size;
        fileCount++;
      }
    }

    return { files: fileCount, size: totalSize };
  } catch (error) {
    return { files: 0, size: 0 };
  }
}

// Clean expired cache entries
export async function cleanExpiredCache(ttl: number): Promise<number> {
  try {
    await ensureCacheDir();
    const files = await readdir(CACHE_DIR);

    let cleaned = 0;
    const now = Date.now();

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(CACHE_DIR, file);
        try {
          const data = await readFile(filePath, 'utf-8');
          const entry: CacheEntry<unknown> = JSON.parse(data);

          const age = now - entry.timestamp;
          if (age > ttl * 1000) {
            await unlink(filePath);
            cleaned++;
          }
        } catch (error) {
          // Skip invalid cache entries
        }
      }
    }

    return cleaned;
  } catch (error) {
    return 0;
  }
}
