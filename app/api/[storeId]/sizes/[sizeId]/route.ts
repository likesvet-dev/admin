import prismadb from "@/lib/prismadb";
import { auth } from "@/lib/jwtAuth";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        if (!resolvedParams.sizeId) {
            return new NextResponse('Size ID is required', { status: 400 });
        }

        const size = await prismadb.size.findUnique({
            where: {
                id: resolvedParams.sizeId,
            }
        })

        return NextResponse.json(size);
    } catch (error) {
        console.error('[SIZE_GET]', error);
        return new NextResponse('Не удалось получить размеры', { status: 500 });
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth();
        const body = await req.json();

        const { name, value } = body;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!name) {
            return new NextResponse('Name is required', { status: 400 });
        }

        if (!value) {
            return new NextResponse('Value is required', { status: 400 });
        }

        if (!resolvedParams.sizeId) {
            return new NextResponse('Size ID is required', { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: resolvedParams.storeId,
                userId
            }
        })

        if (!storeByUserId) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const size = await prismadb.size.updateMany({
            where: {
                id: resolvedParams.sizeId,
            },
            data: {
                name,
                value
            }
        })

        return NextResponse.json(size);
    } catch (error) {
        console.error('[SIZE_PATCH]', error);
        return new NextResponse('Не удалось обновить размер', { status: 500 });
    }
};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!resolvedParams.sizeId) {
            return new NextResponse('Size ID is required', { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: resolvedParams.storeId,
                userId
            }
        })

        if (!storeByUserId) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const size = await prismadb.size.deleteMany({
            where: {
                id: resolvedParams.sizeId,
            }
        })

        return NextResponse.json(size);
    } catch (error) {
        console.error('[SIZE_DELETE]', error);
        return new NextResponse('Не удалось удалить размер', { status: 500 });
    }
};