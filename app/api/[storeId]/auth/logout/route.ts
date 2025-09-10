import { NextResponse } from "next/server";

export async function POST() {
  try {
    const IS_PROD = process.env.NODE_ENV === "production";

    // Cookie domain: in dev undefined, in prod il dominio principale
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    const response = NextResponse.json({ message: "Logged out successfully" });

    // Rimuove il refresh token impostando un cookie scaduto
    response.cookies.set({
      name: "refreshToken",
      value: "",
      httpOnly: true,
      path: "/",
      sameSite: "none",      // coerente con login (cross-site)
      secure: IS_PROD,       // true solo in produzione
      domain: cookieDomain,  // dominio configurabile
      maxAge: 0,             // scade subito
    });

    return response;
  } catch (error) {
    console.error("[LOGOUT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}