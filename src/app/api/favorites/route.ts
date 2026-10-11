import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { getServerStorage, Favorite } from '@/lib/server-storage';

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
      const fav = await storage.getFavorite(user.username, key);
      return NextResponse.json(fav, { status: 200 });
    }

    const favorites = await storage.getAllFavorites(user.username);
    return NextResponse.json(favorites, { status: 200 });
  } catch (err) {
    console.error('获取收藏失败', err);
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
    const { key, favorite }: { key: string; favorite: Favorite } = body;

    if (!key || !favorite) {
      return NextResponse.json({ error: 'Missing key or favorite' }, { status: 400 });
    }

    const finalFav: Favorite = {
      ...favorite,
      save_time: favorite.save_time || Date.now(),
    };

    const storage = getServerStorage();
    await storage.saveFavorite(user.username, key, finalFav);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('保存收藏失败', err);
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
    await storage.deleteFavorite(user.username, key);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('删除收藏失败', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
