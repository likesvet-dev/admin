import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { storeId: string } }) {
  try {
    const { storeId } = params;

    if (!storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    const customers = await prismadb.customer.findMany({
      where: {
        storeId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("[CUSTOMERS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}