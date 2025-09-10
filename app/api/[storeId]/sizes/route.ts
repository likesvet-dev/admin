import prismadb from "@/lib/prismadb";
import { auth } from "@/lib/jwtAuth";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
    const resolvedParams = await params
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { name, value } = body;

        if (!userId) {
            return new NextResponse('Not authenticated', { status: 401 });
        }

        if (!name) {
            return new NextResponse('Name is required', { status: 400 });
        }

        if (!value) {
            return new NextResponse('Value is required', { status: 400 });
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

        const size = await prismadb.size.create({
            data: {
                name,
                value,
                storeId: resolvedParams.storeId
            },
        });
        return NextResponse.json(size);
    } catch (error) {
        console.log('[SIZES_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
    const resolvedParams = await params
    try {
        if (!resolvedParams.storeId) {
            return new NextResponse('Store ID is required', { status: 400 });
        }

        const sizes = await prismadb.size.findMany({
            where: {
                storeId: resolvedParams.storeId
            }
        });
        return NextResponse.json(sizes);
    } catch (error) {
        console.log('[SIZES_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
};