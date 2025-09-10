import prismadb from "@/lib/prismadb";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        if (!resolvedParams.reviewId) {
            return new NextResponse('Review ID is required', { status: 400 });
        }

        const review = await prismadb.review.findUnique({
            where: {
                id: resolvedParams.reviewId,
            }
        })

        return NextResponse.json(review);
    } catch (error) {
        console.error('[REVIEW_GET]', error);
        return new NextResponse('Не удалось получить отзывы', { status: 500 });
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        const { userId } = await auth(req);
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

        if (!resolvedParams.reviewId) {
            return new NextResponse('Review ID is required', { status: 400 });
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

        const review = await prismadb.review.updateMany({
            where: {
                id: resolvedParams.reviewId,
            },
            data: {
                label,
                imageUrl
            }
        })

        return NextResponse.json(review);
    } catch (error) {
        console.error('[REVIEW_PATCH]', error);
        return new NextResponse('Не удалось обновить отзыв', { status: 500 });
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

        if (!resolvedParams.reviewId) {
            return new NextResponse('Review ID is required', { status: 400 });
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

        const review = await prismadb.review.deleteMany({
            where: {
                id: resolvedParams.reviewId,
            }
        })

        return NextResponse.json(review);
    } catch (error) {
        console.error('[REVIEW_DELETE]', error);
        return new NextResponse('Не удалось удалить отзыв', { status: 500 });
    }
};