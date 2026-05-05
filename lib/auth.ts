import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function assertAdmin(req: NextRequest) {
  const sessionToken = req.cookies.get('taskly_session')?.value;
  if (!sessionToken) return false;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session) return false;
  if (session.expiresAt.getTime() < Date.now()) return false;

  return Boolean(session.user.isAdmin);
}
