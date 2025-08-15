import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { categoryId: string } }) {
    const resolvedParams = await params;
    try {
        if (!resolvedParams.categoryId) {
            return new NextResponse('Category ID is required', { status: 400 });
        }

        const category = await prismadb.category.findUnique({
            where: {
                id: resolvedParams.categoryId,
            }
        })

        return NextResponse.json(category);
    } catch (error) {
        console.error('[CATEGORY_GET]', error);
        return new NextResponse('Не удалось получить категории', { status: 500 });
    }
};

export async function PATCH(req: Request, { params }: { params: { storeId: string, categoryId: string } }) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth();
        const body = await req.json();

        const { name, imageUrl } = body;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!name) {
            return new NextResponse('Name is required', { status: 400 });
        }

         if (!imageUrl) {
            return new NextResponse('Image is required', { status: 400 });
        }

        if (!resolvedParams.categoryId) {
            return new NextResponse('Category ID is required', { status: 400 });
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

        const category = await prismadb.category.updateMany({
            where: {
                id: resolvedParams.categoryId,
            },
            data: {
                name,
                imageUrl
            }
        })

        return NextResponse.json(category);
    } catch (error) {
        console.error('[CATEGORY_PATCH]', error);
        return new NextResponse('Не удалось обновить категорию', { status: 500 });
    }
};


export async function DELETE(req: Request, { params }: { params: { storeId: string, categoryId: string } }) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!resolvedParams.categoryId) {
            return new NextResponse('Category ID is required', { status: 400 });
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

        const category = await prismadb.category.deleteMany({
            where: {
                id: resolvedParams.categoryId,
            }
        })

        return NextResponse.json(category);
    } catch (error) {
        console.error('[CATEGORY_DELETE]', error);
        return new NextResponse('Не удалось удалить категорию', { status: 500 });
    }
};