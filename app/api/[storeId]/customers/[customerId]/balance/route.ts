import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { customerId: string } }
) {
    try {
        const { customerId } = params;
        const body = await req.json();
        const { amount } = body;

        if (!customerId) {
            return new NextResponse("Customer ID is required", { status: 400 });
        }

        const customer = await prismadb.customer.update({
            where: { id: customerId },
            data: {
                balance: {
                    increment: amount,
                },
            },
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error("[CUSTOMER_BALANCE_PATCH]", error);
        return new NextResponse("Не удалось обновить баланс", { status: 500 });
    }
}