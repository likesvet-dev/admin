import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prismadb from "@/lib/prismadb";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// funzione helper per generare un codice random
function generateGiftCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // senza 0 e O
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request, { params }: { params: { storeId: string } }) {
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
    const { amount, expiresAt } = body;

    if (!amount) {
      return new NextResponse("amount is required", { status: 400 });
    }

    // genera un codice unico
    let code: string;
    let exists = true;
    do {
      code = generateGiftCode();
      const existing = await prismadb.giftCode.findUnique({ where: { code } });
      exists = !!existing;
    } while (exists);

    // crea il gift code
    const giftCode = await prismadb.giftCode.create({
      data: {
        storeId: params.storeId,
        code,
        amount,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // registra l’acquisto
    const purchase = await prismadb.giftCodePurchase.create({
      data: {
        giftCodeId: giftCode.id,
        customerId: userId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Gift code purchased successfully",
      giftCode,
      purchase,
    });
  } catch (err) {
    console.error("[GIFT_CODE_PURCHASE_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
