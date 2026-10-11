import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { getServerStorage, PlayRecord } from '@/lib/server-storage';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storage = getServerStorage();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const record = await storage.getPlayRecord(user.username, key);
      return NextResponse.json(record, { status: 200 });
    }

    const records = await storage.getAllPlayRecords(user.username);
    return NextResponse.json(records, { status: 200 });
  } catch (err) {
    console.error('获取播放记录失败', err);
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
    const { key, record }: { key: string; record: PlayRecord } = body;

    if (!key || !record) {
      return NextResponse.json({ error: 'Missing key or record' }, { status: 400 });
    }

    const finalRecord: PlayRecord = {
      ...record,
      save_time: record.save_time || Date.now(),
    };

    const storage = getServerStorage();
    await storage.savePlayRecord(user.username, key, finalRecord);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('保存播放记录失败', err);
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
    const key = searchParams.get('key') || undefined;

    const storage = getServerStorage();
    await storage.deletePlayRecord(user.username, key);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('删除播放记录失败', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
