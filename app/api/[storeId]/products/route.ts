import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { storeId: string } }) {
    const resolvedParams = await params
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { name, price, categoryId, sizeId, images, isFeatured, isArchived } = body;

        if (!userId) {
            return new NextResponse('Not authenticated', { status: 401 });
        }

        if (!name) {
            return new NextResponse('Name is required', { status: 400 });
        }

        if (!images || !images.length) {
            return new NextResponse('Images are required', { status: 400 });
        }

        if (!price) {
            return new NextResponse('Price is required', { status: 400 });
        }

        if (!categoryId) {
            return new NextResponse('Cateogory ID is required', { status: 400 });
        }

        if (!sizeId) {
            return new NextResponse('Size ID is required', { status: 400 });
        }

        if (!resolvedParams.storeId) {
            return new NextResponse('Store ID is required', { status: 400 });
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

        const product = await prismadb.product.create({
            data: {
                name,
                price,
                isFeatured,
                isArchived,
                categoryId,
                sizeId,
                storeId: resolvedParams.storeId,
                images: {
                    createMany: {
                        data: [
                            ...images.map((image: { url: string }) => image)
                        ]
                    }
                }
            },
        });
        return NextResponse.json(product);
    } catch (error) {
        console.log('[PRODUCTS_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
};

export async function GET(req: Request, { params }: { params: { storeId: string } }) {
    const resolvedParams = await params
    try {
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get('categoryId') || undefined;
        const sizeId = searchParams.get('sizeId') || undefined;
        const isFeatured = searchParams.get('isFeatured');
        const isArchived = searchParams.get('isArchived');


        if (!resolvedParams.storeId) {
            return new NextResponse('Store ID is required', { status: 400 });
        }

        const products = await prismadb.product.findMany({
            where: {
                storeId: resolvedParams.storeId,
                categoryId,
                sizeId,
                isArchived: false,
                isFeatured: isFeatured ? true : undefined,
            },
            include: {
                images: true,
                category: true,
                size: true,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });
        return NextResponse.json(products);
    } catch (error) {
        console.log('[PRODUCTS_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
};