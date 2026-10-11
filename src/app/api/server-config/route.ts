import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const result = {
    SiteName: process.env.SITE_NAME || 'X-TV',
    StorageType: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'sqlite',
    Version: '1.0.0',
  };
  return NextResponse.json(result);
}
