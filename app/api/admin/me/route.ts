import { NextResponse, NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("[AUTH CHECK ERROR]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}