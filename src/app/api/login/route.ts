import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  checkPassword,
  clearRateLimit,
  checkRateLimit,
  isPasswordConfigured,
  signSession,
  getUsername,
  getAuthUserFromRequest,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!isPasswordConfigured()) {
    return NextResponse.json(
      { error: '服务器未设置 PASSWORD 环境变量，请联系管理员配置' },
      { status: 503 }
    );
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: '尝试次数过多，请 10 分钟后再试' },
      { status: 429 }
    );
  }

  let username = '';
  let password = '';

  try {
    const body = await req.json();
    username = String(body.username ?? '').trim();
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  // 校验密码
  if (!checkPassword(password)) {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  }

  // 如果配置了 USERNAME，则校验用户名
  const expectedUsername = getUsername();
  if (process.env.USERNAME && username && username !== expectedUsername) {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  }

  const finalUsername = username || expectedUsername;
  clearRateLimit(ip);

  const { token, expiresAt } = signSession();
  const res = NextResponse.json({
    message: '登录成功',
    token,
    user: {
      username: finalUsername,
      role: 'owner',
    },
  });

  const secure =
    process.env.COOKIE_SECURE === 'true'
      ? true
      : process.env.COOKIE_SECURE === 'false'
        ? false
        : (req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? 'http') === 'https';

  const maxAge = Math.floor((expiresAt - Date.now()) / 1000);

  // 1. 设置 LibreTV 原生会话 cookie
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge,
    path: '/',
  });

  // 2. 设置 LunaTV 客户端兼容 auth cookie
  const authPayload = JSON.stringify({
    username: finalUsername,
    role: 'owner',
    timestamp: Date.now(),
  });

  res.cookies.set('auth', encodeURIComponent(authPayload), {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    maxAge,
    path: '/',
  });

  res.cookies.set('username', finalUsername, {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    maxAge,
    path: '/',
  });

  return res;
}

export async function GET(req: Request) {
  const user = getAuthUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  return NextResponse.json({
    message: '已登录',
    user,
  });
}
