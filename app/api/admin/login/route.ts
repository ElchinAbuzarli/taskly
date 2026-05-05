import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Separate admin login removed. Please login from /app with an admin account.',
    },
    { status: 410 },
  );
}
