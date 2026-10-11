import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) {
    return NextResponse.json({ suggestions: [] });
  }

  // 基础搜索联想
  return NextResponse.json({
    suggestions: [
      { text: q, type: 'exact', score: 1 },
    ],
  });
}
