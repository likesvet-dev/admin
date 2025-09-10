import { JwtPayload, verify } from "jsonwebtoken";
import { cookies as nextCookies } from "next/headers"; // solo server components
import { jwtDecode } from "jwt-decode";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET not defined in env variables");

export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Auth universale:
 * - Server Components / Middleware → legge cookie HttpOnly
 * - API routes → legge cookie dai header se passati come `req`
 * - Client → legge da localStorage
 */
export async function auth(req?: Request): Promise<AuthUser> {
  // -------------------------------
  // SERVER SIDE
  // -------------------------------
  if (typeof window === "undefined") {
    try {
      let token: string | undefined;

      // API route con Request
      if (req) {
        token = req.headers.get("authorization") || "";

        // fallback cookie
        if (!token && req.headers.get("cookie")) {
          const match = req.headers.get("cookie")?.match(/cms_jwt_token=([^;]+)/);
          if (match) token = `Bearer ${match[1]}`;
        }

        if (token?.startsWith("Bearer ")) {
          token = token.split(" ")[1];
        }
      } else {
        // Server Components → usa next/headers cookies()
        token = (await nextCookies()).get("cms_jwt_token")?.value;
      }

      if (!token) throw new Error("Not authenticated");

      const decoded = verify(token, JWT_SECRET) as JwtPayload & { adminId: string; email: string };
      if (!decoded.adminId || !decoded.email) throw new Error("Invalid token");

      // Mappa adminId → userId
      return { userId: decoded.adminId, email: decoded.email };
    } catch (err) {
      console.error("[jwtAuth server]", err);
      throw new Error("Cannot authenticate");
    }
  }

  // -------------------------------
  // CLIENT SIDE
  // -------------------------------
  const token = localStorage.getItem("cms_jwt_token");
  if (!token) throw new Error("Not authenticated");

  try {
    const decoded: { adminId: string; email: string; exp?: number } = jwtDecode(token);
    if (!decoded.adminId || !decoded.email) throw new Error("Invalid token");

    return { userId: decoded.adminId, email: decoded.email };
  } catch (err) {
    console.error("[jwtAuth client decode]", err);
    throw new Error("Invalid token");
  }
}