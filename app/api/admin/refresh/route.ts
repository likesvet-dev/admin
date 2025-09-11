import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/lib/auth/tokens';
import { authConfig } from '@/lib/auth/config';
import prismadb from '@/lib/prismadb';

export async function POST(request: NextRequest) {
  try {
    // MODIFICA: Leggi il refresh token direttamente dai cookie della request
    const refreshToken = request.cookies.get(authConfig.refreshTokenCookieName)?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Token refresh not provided' },
        { status: 401 }
      );
    }
    
    const payload = verifyToken(refreshToken);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token refresh not valid' },
        { status: 401 }
      );
    }
    
    // Verifica che l'utente esista e che la versione del token corrisponda
    const user = await prismadb.admin.findUnique({
      where: { id: payload.userId },
    });
    
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json(
        { success: false, error: 'Token revoked' },
        { status: 401 }
      );
    }
    
    // Genera nuovi token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });
    
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });
    
    // Prepara la response
    const response = NextResponse.json({
      success: true,
      userId: user.id,
    });
    
    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set(authConfig.accessTokenCookieName, newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: authConfig.accessTokenExpiry / 1000,
      path: '/',
    });

    response.cookies.set(authConfig.refreshTokenCookieName, newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: authConfig.refreshTokenExpiry / 1000,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Error during token refresh:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}