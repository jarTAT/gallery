import { NextRequest, NextResponse } from 'next/server';
import { getKV, setPhoto } from '@/lib/kv';
import { getCurrentUser } from '@/lib/auth';
import { getEnv } from '@/lib/cloudflare';
import { parseCSV } from '@/lib/csv';
import { Photo } from '@/types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv();
    const user = await getCurrentUser(request, env.JWT_SECRET);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const csvText = body.csv as string;
    if (!csvText) {
      return NextResponse.json({ success: false, error: 'No CSV content provided' }, { status: 400 });
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return NextResponse.json({ success: false, error: 'CSV must contain a header row' }, { status: 400 });
    }

    const header = rows[0].map(h => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name.toLowerCase());

    const iName = idx('name');
    const iPrice = idx('price');
    const iTags = idx('tags');
    const iCity = idx('city');
    const iDistrict = idx('district');
    const iContact = idx('contact');
    const iLink = idx('link');
    const iAlbumId = idx('album_id');
    const iPinned = idx('is_pinned');

    const kv = getKV(env);
    let imported = 0;
    const errors: string[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = iName >= 0 ? (row[iName] || '').trim() : '';
      if (!name) {
        errors.push(`第 ${r + 1} 行缺少名称，已跳过`);
        continue;
      }

      const photo: Photo = {
        id: crypto.randomUUID(),
        name,
        price: iPrice >= 0 ? parseFloat(row[iPrice]) || 0 : 0,
        tags: iTags >= 0 && row[iTags]
          ? row[iTags].split(/[,;|]/).map(t => t.trim()).filter(Boolean)
          : [],
        city: iCity >= 0 ? (row[iCity] || '').trim() : '',
        district: iDistrict >= 0 ? (row[iDistrict] || '').trim() : '',
        contact: iContact >= 0 ? (row[iContact] || '').trim() : '',
        link: iLink >= 0 ? (row[iLink] || '').trim() : '',
        album_id: iAlbumId >= 0 ? (row[iAlbumId] || '').trim() : '',
        images: [],
        cover_index: 0,
        is_pinned: iPinned >= 0 ? String(row[iPinned]).trim().toLowerCase() === 'true' : false,
        created_at: new Date().toISOString(),
      };

      await setPhoto(kv, photo);
      imported++;
    }

    return NextResponse.json({
      success: true,
      data: { imported, errors },
    });
  } catch (error) {
    console.error('Import photos error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}