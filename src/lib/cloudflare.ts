import { getCloudflareContext } from '@cloudflare/next-on-pages';
import { CloudflareEnv } from '@/types/cloudflare';

export async function getEnv(): Promise<CloudflareEnv> {
  const ctx = await getCloudflareContext();
  return ctx.env as CloudflareEnv;
}
