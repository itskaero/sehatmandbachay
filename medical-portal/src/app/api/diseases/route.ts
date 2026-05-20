import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Disease from '@/models/Disease';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const specialty = searchParams.get('specialty');
    const trending = searchParams.get('trending');

    const query: Record<string, unknown> = { isPublished: true };
    if (specialty) query.specialtyTags = specialty;
    if (trending === 'true') query.isTrending = true;

    const skip = (page - 1) * limit;
    const [diseases, total] = await Promise.all([
      Disease.find(query)
        .select('name slug alternativeNames abbreviations specialtyTags icdCodes lastUpdated viewCount isTrending')
        .skip(skip)
        .limit(limit)
        .sort({ viewCount: -1 }),
      Disease.countDocuments(query),
    ]);

    return NextResponse.json({ diseases, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch diseases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();
    const disease = await Disease.create(data);
    return NextResponse.json(disease, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create disease' }, { status: 500 });
  }
}
