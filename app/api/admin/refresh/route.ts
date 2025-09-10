import { NextResponse, NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import prismadb from "@/lib/prismadb";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

// Helper per determinare dominio cookie
const getCookieDomain = () => {
  if (process.env.NODE_ENV === "production") return "admin.likesvet.com";
  return "localhost"; // dev environment
};

export async function POST(req: NextRequest) {
  try {
    // --- Leggi refresh token dal cookie ---
    const refreshToken = req.cookies.get("cms_refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    let payload: { adminId: string; tokenVersion: number; exp?: number };
    try {
      const { payload: decoded } = await jwtVerify(refreshToken, JWT_REFRESH_SECRET);
      if (!decoded.adminId) throw new Error("Invalid token");
      payload = decoded as typeof payload;
    } catch {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const admin = await prismadb.admin.findUnique({ where: { id: payload.adminId } });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 401 });

    if (payload.tokenVersion !== admin.tokenVersion) {
      return NextResponse.json({ error: "Invalid token version" }, { status: 401 });
    }

    // --- Nuovo access token ---
    const accessToken = await new SignJWT({
      adminId: admin.id,
      email: admin.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(JWT_SECRET);

    // --- Rotazione refresh token ---
    const newRefreshToken = await new SignJWT({
      adminId: admin.id,
      tokenVersion: admin.tokenVersion,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_REFRESH_SECRET);

    const res = NextResponse.json({ accessToken });

    const cookieDomain = getCookieDomain();

    res.cookies.set({
      name: "cms_jwt_token",
      value: accessToken,
      httpOnly: true,
      path: "/",
      domain: cookieDomain,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60,
    });

    res.cookies.set({
      name: "cms_refresh_token",
      value: newRefreshToken,
      httpOnly: true,
      path: "/",
      domain: cookieDomain,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    console.error("REFRESH ERROR", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}