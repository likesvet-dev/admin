import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { productId: string } }) {
    const resolvedParams = await params;
    try {
        if (!resolvedParams.productId) {
            return new NextResponse('Product ID is required', { status: 400 });
        }

        const product = await prismadb.product.findUnique({
            where: {
                id: resolvedParams.productId,
            },
            include: {
                images: true,
                category: true,
                size: true
            }
        })

        return NextResponse.json(product);
    } catch (error) {
        console.error('[PRODUCT_GET]', error);
        return new NextResponse('Не удалось получить товары', { status: 500 });
    }
};

export async function PATCH(req: Request, { params }: { params: { storeId: string, productId: string } }) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth();
        const body = await req.json();

        const { name, price, categoryId, sizeId, images, isFeatured, isArchived } = body;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
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

        if (!resolvedParams.productId) {
            return new NextResponse('Product ID is required', { status: 400 });
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

        await prismadb.product.update({
            where: {
                id: resolvedParams.productId,
            },
            data: {
                name,
                price,
                categoryId,
                sizeId,
                images: {
                    deleteMany: {

                    }
                },
                isFeatured,
                isArchived
            }
        });

        const product = await prismadb.product.update({
            where: {
                id: resolvedParams.productId
            },
            data: {
                images: {
                    createMany: {
                        data: [
                            ...images.map((image: { url: string }) => image)
                        ]
                    }
                }
            }
        })

        return NextResponse.json(product);
    } catch (error) {
        console.error('[PRODUCT_PATCH]', error);
        return new NextResponse('Не удалось обновить товар', { status: 500 });
    }
};


export async function DELETE(req: Request, { params }: { params: { storeId: string, productId: string } }) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!resolvedParams.productId) {
            return new NextResponse('Product ID is required', { status: 400 });
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

        const product = await prismadb.product.deleteMany({
            where: {
                id: resolvedParams.productId,
            }
        })

        return NextResponse.json(product);
    } catch (error) {
        console.error('[PRODUCT_DELETE]', error);
        return new NextResponse('Не удалось удалить товар', { status: 500 });
    }
};