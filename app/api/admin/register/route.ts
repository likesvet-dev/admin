import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import prismadb from "@/lib/prismadb";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email и пароль обязательные" }, { status: 400 });
    }

    const existing = await prismadb.admin.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Админ уже существует" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prismadb.admin.create({
      data: { email, password: hashedPassword },
    });

    // --- Genera token ---
    const accessToken = await new SignJWT({ userId: admin.id, email: admin.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(JWT_SECRET);

    const refreshToken = await new SignJWT({ userId: admin.id, tokenVersion: admin.tokenVersion })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_REFRESH_SECRET);

    const res = NextResponse.json({ accessToken, storeId: null }); // nuovo admin non ha store

    res.cookies.set({
      name: "cms_jwt_token",
      value: accessToken,
      httpOnly: true,
      path: "/",
      domain: COOKIE_DOMAIN,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60,
    });

    res.cookies.set({
      name: "cms_refresh_token",
      value: refreshToken,
      httpOnly: true,
      path: "/",
      domain: COOKIE_DOMAIN,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    console.error("REGISTER ERROR", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}