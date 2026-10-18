import { NextRequest } from 'next/server';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

// In-memory sliding window store keyed by bucket name and client identifier
const rateLimitBuckets = new Map<string, Map<string, number[]>>();

/**
 * Lightweight, zero-dependency sliding-window rate limiter for Next.js Route Handlers.
 */
export function checkRateLimit(
  identifier: string,
  bucketName: string,
  options: RateLimitOptions
): { allowed: boolean; waitSeconds?: number } {
  let bucket = rateLimitBuckets.get(bucketName);
  if (!bucket) {
    bucket = new Map<string, number[]>();
    rateLimitBuckets.set(bucketName, bucket);
  }

  const now = Date.now();
  const timestamps = (bucket.get(identifier) || []).filter((ts) => now - ts < options.windowMs);

  if (timestamps.length >= options.maxRequests) {
    const oldest = timestamps[0];
    const waitSeconds = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
    return { allowed: false, waitSeconds };
  }

  timestamps.push(now);
  bucket.set(identifier, timestamps);
  return { allowed: true };
}

/**
 * Extracts client IP safely from common proxy / edge headers (Cloudflare, Vercel, Nginx).
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
