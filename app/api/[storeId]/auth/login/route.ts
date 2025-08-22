import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const resolvedParams = await params;
  try {
    const { identifier, password } = await req.json(); // 👈 identifier può essere email o phone
    const { storeId } = resolvedParams;

    if (!storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!identifier || !password) {
      return new NextResponse("Email/Phone and password are required", { status: 400 });
    }

    // 🔎 Trova utente per email o phone
    const user = await prismadb.customer.findFirst({
      where: {
        storeId,
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
    });

    if (!user) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }

    // 🔐 Confronta password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return new NextResponse("Wrong password", { status: 401 });
    }

    // 🔑 Genera token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        storeId,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        profileImage: user.profileImage,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}