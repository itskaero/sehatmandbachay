import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Disease from '@/models/Disease';
import { seedDiseases } from '@/lib/seed-data';

export async function POST(_request: NextRequest) {
  try {
    await connectDB();
    await Disease.deleteMany({});
    await Disease.insertMany(seedDiseases);
    return NextResponse.json({ message: `Seeded ${seedDiseases.length} diseases successfully` });
  } catch (err) {
    return NextResponse.json({ error: 'Seed failed', detail: String(err) }, { status: 500 });
  }
}
