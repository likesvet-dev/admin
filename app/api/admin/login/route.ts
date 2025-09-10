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

    // --- Genera access token e refresh token ---
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

    // --- Determina dominio per cookie ---
    const isDev = process.env.NODE_ENV !== "production";
    const domain = isDev ? "localhost" : "admin.likesvet.com";

    // --- Cookie HttpOnly isolati ---
    res.cookies.set({
      name: "cms_jwt_token",
      value: accessToken,
      httpOnly: true,
      path: "/",
      sameSite: "strict",  // blocca accesso da altri domini
      secure: !isDev,      // HTTPS in produzione
      domain,
      maxAge: 15 * 60,     // 15 minuti
    });

    res.cookies.set({
      name: "cms_refresh_token",
      value: refreshToken,
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: !isDev,
      domain,
      maxAge: 7 * 24 * 60 * 60, // 7 giorni
    });

    return res;
  } catch (err) {
    console.error("LOGIN ERROR", err);
    return NextResponse.json({
      errors: { email: "Ошибка сервера", password: "Ошибка сервера" }
    }, { status: 500 });
  }
}