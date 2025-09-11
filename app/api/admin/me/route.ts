// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/tokens';
import prismadb from '@/lib/prismadb';
import { authConfig } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(authConfig.accessTokenCookieName)?.value;

    if (!accessToken) {
      return NextResponse.json({ success: false, userId: null });
    }

    const payload = verifyToken(accessToken);

    if (!payload) {
      return NextResponse.json({ success: false, userId: null });
    }

    const user = await prismadb.admin.findUnique({
      where: { id: payload.userId },
      select: { id: true, tokenVersion: true },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json({ success: false, userId: null });
    }

    return NextResponse.json({ success: true, userId: user.id });
    
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ success: false, userId: null });
  }
}