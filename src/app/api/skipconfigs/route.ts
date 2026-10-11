import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { getServerStorage } from '@/lib/server-storage';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const id = searchParams.get('id');

    const storage = getServerStorage();
    if (source && id) {
      const config = await storage.getSkipConfig(user.username, source, id);
      return NextResponse.json(config || { source, id, skip_start: 0, skip_end: 0 }, { status: 200 });
    }

    const configs = await storage.getAllSkipConfigs(user.username);
    return NextResponse.json(configs, { status: 200 });
  } catch (err) {
    console.error('获取跳过配置失败', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      source,
      id,
      skip_start,
      skip_end,
    }: { source: string; id: string; skip_start: number; skip_end: number } = body;

    if (!source || !id) {
      return NextResponse.json({ error: 'Missing source or id' }, { status: 400 });
    }

    const storage = getServerStorage();
    await storage.saveSkipConfig(
      user.username,
      source,
      id,
      Number(skip_start) || 0,
      Number(skip_end) || 0
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('保存跳过配置失败', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const id = searchParams.get('id');

    if (!source || !id) {
      return NextResponse.json({ error: 'Missing source or id' }, { status: 400 });
    }

    const storage = getServerStorage();
    await storage.deleteSkipConfig(user.username, source, id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('删除跳过配置失败', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
