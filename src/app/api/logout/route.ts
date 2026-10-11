import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const res = NextResponse.json({ message: '登出成功', success: true });
  res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  res.cookies.set('auth', '', { maxAge: 0, path: '/' });
  res.cookies.set('username', '', { maxAge: 0, path: '/' });
  return res;
}
