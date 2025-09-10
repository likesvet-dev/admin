import prismadb from "@/lib/prismadb";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth(req);
        const body = await req.json();

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


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth(req);

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