// lib/auth.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!; // non-null assertion
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!; // non-null assertion

if (!JWT_SECRET) throw new Error("JWT_SECRET not defined in env variables");
if (!JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET not defined in env variables");

// helper: HMAC key per jose (TextEncoder -> Uint8Array)
function getSecretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

// -------------------------
// Tipizzazione universale
// -------------------------
export type AuthUser = {
  userId: string; // map adminId -> userId
  email: string;
};

// -------------------------
// Decodifica access token dalla request (EDGE-SAFE)
// accetta NextRequest o Request
// -------------------------
export async function getUserFromRequest(req: NextRequest | Request): Promise<AuthUser | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headers = (req as any).headers;
    let token = headers?.get?.("authorization") || headers?.get?.("Authorization") || "";

    if (!token) {
      const cookieHeader = headers?.get?.("cookie") || "";
      const match = cookieHeader.match(/cms_jwt_token=([^;]+)/);
      if (match) token = `Bearer ${match[1]}`;
    }

    if (!token || !token.startsWith("Bearer ")) return null;
    const jwtToken = token.split(" ")[1];

    // ora TypeScript sa che JWT_SECRET è stringa
    const { payload } = await jwtVerify(jwtToken, getSecretKey(JWT_SECRET));

    const adminId = payload["adminId"] as string | undefined;
    const email = payload["email"] as string | undefined;
    if (!adminId || !email) return null;

    return { userId: adminId, email };
  } catch (err) {
    console.error("[getUserFromRequest]", err);
    return null;
  }
}

// -------------------------
// Decodifica refresh token lato server (EDGE-SAFE)
// -------------------------
export async function getUserFromRefreshToken(refreshToken: string | undefined): Promise<{ userId: string } | null> {
  if (!refreshToken) return null;
  try {
    const { payload } = await jwtVerify(refreshToken, getSecretKey(JWT_REFRESH_SECRET));
    const adminId = payload["adminId"] as string | undefined;
    if (!adminId) return null;
    return { userId: adminId };
  } catch (err) {
    console.error("[getUserFromRefreshToken]", err);
    return null;
  }
}

// -------------------------
// Protegge le route lato server con access token
// -------------------------
export async function protectRoute(req: NextRequest | Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return user;
}

// -------------------------
// Protegge le route lato server con refresh token (helper universale)
// -------------------------
export async function requireAuth(refreshToken: string | undefined) {
  const user = await getUserFromRefreshToken(refreshToken);
  if (!user) return null;
  return user;
}

// -------------------------
// Genera access token lato server (usato nelle API Node)
// -------------------------
export async function signToken(payload: AuthUser, options?: { expiresIn?: string | number }) {
  const alg = "HS256";
  const tokenBuilder = new SignJWT({ adminId: payload.userId, email: payload.email });
  const now = Math.floor(Date.now() / 1000);

  tokenBuilder.setProtectedHeader({ alg });
  tokenBuilder.setIssuedAt(now);

  if (options?.expiresIn !== undefined) {
    if (typeof options.expiresIn === "number") {
      tokenBuilder.setExpirationTime(now + options.expiresIn);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tokenBuilder.setExpirationTime(options.expiresIn as any);
    }
  } else {
    tokenBuilder.setExpirationTime(now + 15 * 60); // default 15 min
  }

  return await tokenBuilder.sign(getSecretKey(JWT_SECRET));
}

// -------------------------
// Genera refresh token lato server
// -------------------------
export async function signRefreshToken(payload: { userId: string; tokenVersion?: number }) {
  const alg = "HS256";
  const tokenBuilder = new SignJWT({ adminId: payload.userId, tokenVersion: payload.tokenVersion ?? 0 });
  const now = Math.floor(Date.now() / 1000);

  tokenBuilder.setProtectedHeader({ alg });
  tokenBuilder.setIssuedAt(now);
  tokenBuilder.setExpirationTime(now + 7 * 24 * 60 * 60); // 7 giorni

  return await tokenBuilder.sign(getSecretKey(JWT_REFRESH_SECRET));
}

// -------------------------
// Logout lato server: cancella cookie HttpOnly (sia cms_jwt_token che refreshToken)
// -------------------------
export function logoutResponse() {
  const res = NextResponse.json({ message: "Logged out" });

  res.cookies.set({
    name: "cms_jwt_token",
    value: "",
    path: "/",
    domain: process.env.NODE_ENV === "production" ? "admin.likesvet.com" : "localhost",
    maxAge: 0,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.cookies.set({
    name: "cms_refresh_token",
    value: "",
    path: "/",
    domain: process.env.NODE_ENV === "production" ? "admin.likesvet.com" : "localhost",
    maxAge: 0,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}