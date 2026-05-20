import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Disease from '@/models/Disease';
import Fuse from 'fuse.js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    if (!query || query.length < 1) return NextResponse.json({ results: [] });

    await connectDB();

    const diseases = await Disease.find({ isPublished: true })
      .select('name slug alternativeNames abbreviations specialtyTags icdCodes')
      .lean();

    const fuse = new Fuse(diseases, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'abbreviations', weight: 0.3 },
        { name: 'alternativeNames', weight: 0.15 },
        { name: 'specialtyTags', weight: 0.05 },
      ],
      threshold: 0.4,
      includeScore: true,
    });

    const results = fuse.search(query, { limit: 10 }).map((r) => r.item);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
