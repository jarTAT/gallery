import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { getKV, getAllPhotos } from '@/lib/kv';
import { siteConfig } from '@/lib/site-config';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv();
    const kv = getKV(env);

    const photos = await getAllPhotos(kv);

    const urls: string[] = [
      `<url><loc>${siteConfig.url}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${siteConfig.url}/help</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
    ];

    for (const photo of photos) {
      const lastmod = photo.created_at ? photo.created_at.slice(0, 10) : '';
      const lastmodXml = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
      urls.push(
        `<url><loc>${siteConfig.url}/photo/${photo.id}</loc>${lastmodXml}<changefreq>monthly</changefreq><priority>0.8</priority></url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Generate sitemap error:', error);
    return new NextResponse('', { status: 500 });
  }
}