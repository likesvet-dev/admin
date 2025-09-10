import prismadb from "@/lib/prismadb";
import { auth } from "@/lib/jwtAuth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    const { storeId, customerId } = resolvedParams;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!customerId) return new NextResponse("Customer ID is required", { status: 400 });

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    // Usa una transazione per sicurezza
    await prismadb.$transaction(async (prisma) => {
      // Rimuovi il riferimento al cliente dagli ordini
      await prisma.order.updateMany({
        where: { customerId },
        data: { customerId: null },
      });

      // Elimina tutte le altre relazioni del customer
      await prisma.favorite.deleteMany({ where: { customerId } });
      await prisma.giftCodeRedemption.deleteMany({ where: { customerId } });
      await prisma.giftCodePurchase.deleteMany({ where: { customerId } });

      // Elimina il cliente
      await prisma.customer.delete({
        where: { id: customerId },
      });
    });

    return NextResponse.json({ 
      message: "Customer deleted successfully. Orders kept in database.",
      success: true 
    });
  } catch (error) {
    console.error("[CUSTOMER_DELETE]", error);
    return new NextResponse("Не удалось удалить клиента", { status: 500 });
  }
}