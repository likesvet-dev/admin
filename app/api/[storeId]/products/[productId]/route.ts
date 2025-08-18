import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ========== GET PRODUCT BY ID ==========
export async function GET(req: Request, { params }: { params: { productId: string } }) {
  const resolvedParams = await params;
  try {
    if (!resolvedParams.productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const product = await prismadb.product.findUnique({
      where: { id: resolvedParams.productId },
      include: {
        images: true,
        category: true,
        productSizes: { include: { size: true } },
        productColors: { include: { color: true } },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return new NextResponse("Не удалось получить товар", { status: 500 });
  }
}

// ========== UPDATE PRODUCT ==========
export async function PATCH(req: Request, { params }: { params: { storeId: string; productId: string } }) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name, price, categoryId, sizeIds, colorIds, images, isFeatured, isArchived } = body;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!images || !images.length) return new NextResponse("Images are required", { status: 400 });
    if (!price) return new NextResponse("Price is required", { status: 400 });
    if (!categoryId) return new NextResponse("Category ID is required", { status: 400 });
    if (!sizeIds?.length) return new NextResponse("At least one size is required", { status: 400 });
    if (!colorIds?.length) return new NextResponse("At least one color is required", { status: 400 });
    if (!resolvedParams.productId) return new NextResponse("Product ID is required", { status: 400 });

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: resolvedParams.storeId, userId },
    });
    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    await prismadb.product.update({
      where: { id: resolvedParams.productId },
      data: {
        name,
        price,
        categoryId,
        isFeatured,
        isArchived,
        images: {
          deleteMany: {},
          createMany: {
            data: images.map((image: { url: string }) => ({ url: image.url })),
          },
        },
      },
    });

    // reset taglie
    await prismadb.productSize.deleteMany({ where: { productId: resolvedParams.productId } });
    await prismadb.productSize.createMany({
      data: sizeIds.map((sizeId: string) => ({
        productId: resolvedParams.productId,
        sizeId,
      })),
    });

    // reset colori
    await prismadb.productColor.deleteMany({ where: { productId: resolvedParams.productId } });
    await prismadb.productColor.createMany({
      data: colorIds.map((colorId: string) => ({
        productId: resolvedParams.productId,
        colorId,
      })),
    });

    const updated = await prismadb.product.findUnique({
      where: { id: resolvedParams.productId },
      include: {
        images: true,
        category: true,
        productSizes: { include: { size: true } },
        productColors: { include: { color: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PRODUCT_PATCH]", error);
    return new NextResponse("Не удалось обновить товар", { status: 500 });
  }
}

// ========== DELETE PRODUCT ==========
export async function DELETE(req: Request, { params }: { params: { storeId: string; productId: string } }) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!resolvedParams.productId) return new NextResponse("Product ID is required", { status: 400 });

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: resolvedParams.storeId, userId },
    });
    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    await prismadb.productSize.deleteMany({ where: { productId: resolvedParams.productId } });
    await prismadb.productColor.deleteMany({ where: { productId: resolvedParams.productId } });

    const product = await prismadb.product.delete({
      where: { id: resolvedParams.productId },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error);
    return new NextResponse("Не удалось удалить товар", { status: 500 });
  }
}
