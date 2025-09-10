// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prismadb from "@/lib/prismadb";
import { signToken, signRefreshToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const errors: { email?: string; password?: string } = {};
    if (!email) errors.email = "Введите email";
    if (!password) errors.password = "Введите пароль";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // --- Trova admin ---
    const admin = await prismadb.admin.findUnique({ where: { email } });
    if (!admin) {
      return NextResponse.json({
        errors: { email: "Неверный логин", password: "Неверный пароль" }
      }, { status: 401 });
    }

    // --- Controllo password ---
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({
        errors: { email: "Неверный логин", password: "Неверный пароль" }
      }, { status: 401 });
    }

    // --- Genera access token e refresh token con jose ---
    const accessToken = await signToken({ userId: admin.id, email: admin.email });
    const refreshToken = await signRefreshToken({ userId: admin.id, tokenVersion: admin.tokenVersion });

    // --- Trova i store dell'utente ---
    const stores = await prismadb.store.findMany({
      where: { userId: admin.id },
      orderBy: { createdAt: 'asc' }
    });
    const storeId = stores.length > 0 ? stores[0].id : null;

    // --- Response JSON ---
    const res = NextResponse.json({ accessToken, storeId });

    // --- Determina dominio cookie ---
    const isDev = process.env.NODE_ENV !== "production";
    const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

    // --- Imposta cookie HttpOnly ---
    res.cookies.set({
      name: "cms_jwt_token",
      value: accessToken,
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: !isDev,
      domain: COOKIE_DOMAIN,
      maxAge: 15 * 60,
    });

    res.cookies.set({
      name: "cms_refresh_token",
      value: refreshToken,
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: !isDev,
      domain: COOKIE_DOMAIN,
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    console.error("LOGIN ERROR", err);
    return NextResponse.json({
      errors: { email: "Ошибка сервера", password: "Ошибка сервера" }
    }, { status: 500 });
  }
}