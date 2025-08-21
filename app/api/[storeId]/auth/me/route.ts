import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prismadb from "@/lib/prismadb";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: Request, { params }: { params: { storeId: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const { payload } = await jwtVerify(token, JWT_SECRET);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (payload as any).id as string; // id salvato nel token

    if (!userId) return new NextResponse("Invalid token", { status: 401 });

    const customer = await prismadb.customer.findFirst({
      where: { id: userId, storeId: params.storeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        birthDate: true,
        profileImage: true,
        balance: true,
      },
    });

    if (!customer) return new NextResponse("User not found", { status: 404 });

    return NextResponse.json(customer);
  } catch (err) {
    console.error("[AUTH_ME]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}