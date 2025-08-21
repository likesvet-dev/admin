import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const resolvedParams = await params;
  try {
    const { firstName, lastName, birthDate, email, password } = await req.json();

    if (!resolvedParams.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!firstName || !lastName || !birthDate || !email || !password) {
      return new NextResponse("All fields are required", { status: 400 });
    }

    // 🔎 check se esiste già
    const existingUser = await prismadb.customer.findFirst({
      where: {
        email,
        storeId: resolvedParams.storeId,
      },
    });

    if (existingUser) {
      return new NextResponse("User already exists for this store", { status: 400 });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prismadb.customer.create({
      data: {
        firstName,
        lastName,
        birthDate: new Date(birthDate),
        email,
        password: hashedPassword,
        storeId: resolvedParams.storeId,
      },
    });

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
      },
    });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
