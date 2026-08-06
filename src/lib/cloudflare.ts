import { getRequestContext } from '@cloudflare/next-on-pages';
import { CloudflareEnv } from '@/types/cloudflare';

export async function getEnv(): Promise<CloudflareEnv> {
  const ctx = getRequestContext<Record<string, unknown>, unknown>();
  return ctx.env as CloudflareEnv;
}
