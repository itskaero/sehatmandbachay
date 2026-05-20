import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Disease from '@/models/Disease';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    const disease = await Disease.findOneAndUpdate(
      { slug, isPublished: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!disease) return NextResponse.json({ error: 'Disease not found' }, { status: 404 });
    return NextResponse.json(disease);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch disease' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    const data = await request.json();
    const disease = await Disease.findOneAndUpdate({ slug }, data, { new: true });
    if (!disease) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(disease);
  } catch {
    return NextResponse.json({ error: 'Failed to update disease' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    await Disease.findOneAndDelete({ slug });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete disease' }, { status: 500 });
  }
}
