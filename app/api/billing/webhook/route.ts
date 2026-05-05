import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    received: true,
    note: 'Stripe webhook handler placeholder. Add signature verification and event handling.',
  });
}
