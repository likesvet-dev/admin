import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { colorId: string } }) {
    const resolvedParams = await params;
    try {
        if (!resolvedParams.colorId) {
            return new NextResponse('Color ID is required', { status: 400 });
        }

        const color = await prismadb.color.findUnique({
            where: {
                id: resolvedParams.colorId,
            }
        })

        return NextResponse.json(color);
    } catch (error) {
        console.error('[COLOR_GET]', error);
        return new NextResponse('Не удалось получить цвет', { status: 500 });
    }
};

export async function PATCH(req: Request, { params }: { params: { storeId: string, colorId: string } }) {
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

        if (!resolvedParams.colorId) {
            return new NextResponse('Color ID is required', { status: 400 });
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

        const color = await prismadb.color.updateMany({
            where: {
                id: resolvedParams.colorId,
            },
            data: {
                name,
                value
            }
        })

        return NextResponse.json(color);
    } catch (error) {
        console.error('[COLOR_PATCH]', error);
        return new NextResponse('Не удалось обновить цвет', { status: 500 });
    }
};


export async function DELETE(req: Request, { params }: { params: { storeId: string, colorId: string } }) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!resolvedParams.colorId) {
            return new NextResponse('Color ID is required', { status: 400 });
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

        const color = await prismadb.color.deleteMany({
            where: {
                id: resolvedParams.colorId,
            }
        })

        return NextResponse.json(color);
    } catch (error) {
        console.error('[COLOR_DELETE]', error);
        return new NextResponse('Не удалось удалить цвет', { status: 500 });
    }
};