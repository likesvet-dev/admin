import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prismadb from "@/lib/prismadb";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: Request, { params }: { params: { storeId: string } }) {
  const resolvedParams = await params;
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (payload as any).id as string;

    if (!userId) return new NextResponse("Invalid token", { status: 401 });

    const customer = await prismadb.customer.findFirst({
      where: { id: userId, storeId: resolvedParams.storeId },
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
    console.error("[AUTH_ME_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { storeId: string } }) {
  const resolvedParams = await params;
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (payload as any).id as string;

    if (!userId) return new NextResponse("Invalid token", { status: 401 });

    const body = await req.json();

    // se l'utente vuole cambiare password -> hash prima di salvare
    let passwordUpdate = undefined;
    if (body.password) {
      passwordUpdate = await bcrypt.hash(body.password, 10);
    }

    const updated = await prismadb.customer.update({
      where: { id: userId, storeId: resolvedParams.storeId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        password: passwordUpdate,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        profileImage: body.profileImage,
        balance: body.balance,
      },
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

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[AUTH_ME_PATCH]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
