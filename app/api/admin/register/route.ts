// app/api/auth/sign-up/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/tokens';
import { authConfig } from '@/lib/auth/config';
import prismadb from '@/lib/prismadb';

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword } = await request.json();

    // Validazione dei campi obbligatori
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Все поля обязательные' },
        { status: 400 }
      );
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    // Validazione password
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Пароль должно быть минимум 6 харахтеров ' },
        { status: 400 }
      );
    }

    // Conferma password
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Пароли не совпадают' },
        { status: 400 }
      );
    }

    // Verifica se l'utente esiste già
    const existingUser = await prismadb.admin.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с этим email уже существует' },
        { status: 409 }
      );
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crea l'utente nel database
    const user = await prismadb.admin.create({
      data: {
        email,
        password: hashedPassword,
        tokenVersion: 0, // Versione iniziale del token
      },
    });

    // Genera i token
    const accessToken = generateAccessToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    // Prepara la response
    const response = NextResponse.json({
      success: true,
      userId: user.id,
      message: 'Регистрация успешна',
    });

    // Imposta i cookie
    response.cookies.set(authConfig.accessTokenCookieName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: authConfig.accessTokenExpiry / 1000,
      path: '/',
    });

    response.cookies.set(authConfig.refreshTokenCookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: authConfig.refreshTokenExpiry / 1000,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}