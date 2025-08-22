import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { customerId: string } }
) {
  const resolvedParams = await params;
  try {
    const { customerId } = resolvedParams;

    if (!customerId) {
      return new NextResponse("Customer ID is required", { status: 400 });
    }

    const customer = await prismadb.customer.findUnique({
      where: { id: customerId },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("[CUSTOMER_GET]", error);
    return new NextResponse("Не удалось получить клиента", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; customerId: string } }
) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    const { storeId, customerId } = resolvedParams;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!storeId || !customerId)
      return new NextResponse("Store ID and Customer ID required", { status: 400 });

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    const body = await req.json();
    const { firstName, lastName, profileImage, birthDate, balance, email, phone, password } = body;

    // Hash della password solo se viene fornita
    const passwordData = password ? { password: await bcrypt.hash(password, 10) } : {};

    const updatedCustomer = await prismadb.customer.update({
      where: { id: customerId },
      data: {
        firstName,
        lastName,
        profileImage,
        birthDate,
        balance,
        email,
        phone,
        ...passwordData,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("[CUSTOMER_PATCH]", error);
    return new NextResponse("Не удалось обновить клиента", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string; customerId: string } }
) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    const { storeId, customerId } = resolvedParams;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!customerId) {
      return new NextResponse("Customer ID is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const deletedCustomer = await prismadb.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json(deletedCustomer);
  } catch (error) {
    console.error("[CUSTOMER_DELETE]", error);
    return new NextResponse("Не удалось удалить клиента", { status: 500 });
  }
}