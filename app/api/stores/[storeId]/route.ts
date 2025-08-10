import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { storeId: string } }) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const resolvedParams = await params;

        const { name } = body;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!name) {
            return new NextResponse('Name is required', { status: 400 });
        }

        if (!resolvedParams.storeId) {
            return new NextResponse('Store ID is required', { status: 400 });
        }

        const store = await prismadb.store.updateMany({
            where: {
                id: resolvedParams.storeId,
                userId
            },
            data: {
                name
            }
        })

        return NextResponse.json(store);
    } catch (error) {
        console.error('[STORE_PATCH]', error);
        return new NextResponse('Не удалось обновить магазин', { status: 500 });
    }
};


export async function DELETE(req: Request, { params }: { params: { storeId: string } }) {
    try {
        const { userId } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!resolvedParams.storeId) {
            return new NextResponse('Store ID is required', { status: 400 });
        }

        const store = await prismadb.store.deleteMany({
            where: {
                id: resolvedParams.storeId,
                userId
            }
        })

        return NextResponse.json(store);
    } catch (error) {
        console.error('[STORE_DELETE]', error);
        return new NextResponse('Не удалось удалить магазин', { status: 500 });
    }
};