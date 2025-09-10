import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import prismadb from "@/lib/prismadb";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

// Helper per determinare dominio cookie
const getCookieDomain = () => {
  if (process.env.NODE_ENV === "production") return "admin.likesvet.com";
  return "localhost"; // dev environment
};

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email и пароль обязательные" }, { status: 400 });
    }

    // --- Controllo se admin già esiste ---
    const existing = await prismadb.admin.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Админ уже существует" }, { status: 400 });
    }

    // --- Hash della password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Crea nuovo admin ---
    const admin = await prismadb.admin.create({
      data: { email, password: hashedPassword },
    });

    // --- Genera access token breve durata ---
    const accessToken = await new SignJWT({
      adminId: admin.id,
      email: admin.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(JWT_SECRET);

    // --- Genera refresh token con tokenVersion ---
    const refreshToken = await new SignJWT({
      adminId: admin.id,
      tokenVersion: admin.tokenVersion,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_REFRESH_SECRET);

    const res = NextResponse.json({ accessToken });

    const cookieDomain = getCookieDomain();

    // --- Scrivi cookie HttpOnly isolati per CMS ---
    res.cookies.set({
      name: "cms_jwt_token",
      value: accessToken,
      httpOnly: true,
      path: "/",
      domain: cookieDomain,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60, // 15 minuti
    });

    res.cookies.set({
      name: "cms_refresh_token",
      value: refreshToken,
      httpOnly: true,
      path: "/",
      domain: cookieDomain,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 giorni
    });

    return res;
  } catch (err) {
    console.error("REGISTER ERROR", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}