// lib/jwtAuth.ts
import { cookies as nextCookies } from "next/headers";
import { jwtVerify, JWTVerifyResult, JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET not defined in env variables");

// Helper HMAC key
function getSecretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export interface AuthUser {
  userId: string | null;
  email: string | null;
}

export async function auth(req?: Request): Promise<AuthUser> {
  // -------------------------------
  // SERVER SIDE
  // -------------------------------
  if (typeof window === "undefined") {
    try {
      let token: string | undefined;

      if (req) {
        token = req.headers.get("authorization") || "";
        if (!token && req.headers.get("cookie")) {
          const match = req.headers.get("cookie")?.match(/cms_jwt_token=([^;]+)/);
          if (match) token = `Bearer ${match[1]}`;
        }
        if (token?.startsWith("Bearer ")) {
          token = token.split(" ")[1];
        }
      } else {
        token = (await nextCookies()).get("cms_jwt_token")?.value;
      }

      if (!token) return { userId: null, email: null };

      const { payload } = await jwtVerify(token, getSecretKey(JWT_SECRET)) as JWTVerifyResult & { payload: JWTPayload & { adminId: string; email: string } };

      return {
        userId: payload.adminId ?? null,
        email: payload.email ?? null,
      };
    } catch (err) {
      console.error("[jwtAuth-server]", err);
      return { userId: null, email: null };
    }
  }

  // -------------------------------
  // CLIENT SIDE
  // -------------------------------
  const token = localStorage.getItem("cms_jwt_token");
  if (!token) return { userId: null, email: null };

  try {
    // Decodifica semplice lato client (non verifica signature)
    const base64Payload = token.split(".")[1];
    const payload = JSON.parse(atob(base64Payload)) as { adminId: string; email: string; exp?: number };

    return {
      userId: payload.adminId ?? null,
      email: payload.email ?? null,
    };
  } catch (err) {
    console.error("[jwtAuth-client]", err);
    return { userId: null, email: null };
  }
}