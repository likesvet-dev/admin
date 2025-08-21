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
    const { email, password } = await req.json();

    if (!resolvedParams.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!email || !password) {
      return new NextResponse("Email and password are required", { status: 400 });
    }

    const user = await prismadb.customer.findFirst({
      where: {
        email,
        storeId: resolvedParams.storeId,
      },
    });

    if (!user) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }

    // 🔐 Confronto password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return new NextResponse("Wrong password", { status: 401 });
    }

    // 🔑 Genera token JWT (usa variabile d'ambiente)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        storeId: resolvedParams.storeId,
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