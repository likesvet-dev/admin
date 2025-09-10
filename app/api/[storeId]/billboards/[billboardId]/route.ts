import prismadb from "@/lib/prismadb";
import { auth } from "@/lib/jwtAuth";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        if (!resolvedParams.billboardId) {
            return new NextResponse('Billboard ID is required', { status: 400 });
        }

        const billboard = await prismadb.billboard.findUnique({
            where: {
                id: resolvedParams.billboardId,
            }
        })

        return NextResponse.json(billboard);
    } catch (error) {
        console.error('[BILLBOARD_GET]', error);
        return new NextResponse('Не удалось получить баннеры', { status: 500 });
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth();
        const body = await req.json();

        const { label, imageUrl } = body;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!label) {
            return new NextResponse('Text is required', { status: 400 });
        }

        if (!imageUrl) {
            return new NextResponse('Image is required', { status: 400 });
        }

        if (!resolvedParams.billboardId) {
            return new NextResponse('Billboard ID is required', { status: 400 });
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

        const billboard = await prismadb.billboard.updateMany({
            where: {
                id: resolvedParams.billboardId,
            },
            data: {
                label,
                imageUrl
            }
        })

        return NextResponse.json(billboard);
    } catch (error) {
        console.error('[BILLBOARD_PATCH]', error);
        return new NextResponse('Не удалось обновить баннер', { status: 500 });
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

        if (!resolvedParams.billboardId) {
            return new NextResponse('Billboard ID is required', { status: 400 });
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

        const billboard = await prismadb.billboard.deleteMany({
            where: {
                id: resolvedParams.billboardId,
            }
        })

        return NextResponse.json(billboard);
    } catch (error) {
        console.error('[BILLBOARD_DELETE]', error);
        return new NextResponse('Не удалось удалить баннер', { status: 500 });
    }
};