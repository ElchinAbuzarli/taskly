import { NextResponse } from 'next/server';
import { getPublicPricing } from '@/lib/pricing';

export async function GET() {
  const plans = await getPublicPricing();
  return NextResponse.json({ plans });
}
