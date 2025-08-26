import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

// GET single gift code
export async function GET(
  req: Request,
  { params }: { params: { storeId: string; giftCodeId: string } }
) {
  const resolvedParams = await params;
  try {
    const giftCode = await prismadb.giftCode.findFirst({
      where: {
        id: resolvedParams.giftCodeId,
        storeId: resolvedParams.storeId,
      },
    });

    if (!giftCode) {
      return new NextResponse("Gift code not found", { status: 404 });
    }

    return NextResponse.json(giftCode);
  } catch (error) {
    console.error("[GIFT_CODE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// UPDATE gift code
export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; giftCodeId: string } }
) {
  const resolvedParams = await params;
  try {
    const body = await req.json();
    const { code, amount, isActive, expiresAt } = body;

    const giftCode = await prismadb.giftCode.updateMany({
      where: {
        id: resolvedParams.giftCodeId,
        storeId: resolvedParams.storeId,
      },
      data: {
        code,
        amount,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    if (giftCode.count === 0) {
      return new NextResponse("Gift code not found", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GIFT_CODE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE gift code
export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string; giftCodeId: string } }
) {
  const resolvedParams = await params;
  try {
    const deleted = await prismadb.giftCode.deleteMany({
      where: {
        id: resolvedParams.giftCodeId,
        storeId: resolvedParams.storeId,
      },
    });

    if (deleted.count === 0) {
      return new NextResponse("Gift code not found", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GIFT_CODE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
