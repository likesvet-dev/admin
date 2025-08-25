import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ================= GET PRODUCT BY ID =================
export async function GET_PRODUCT(req: Request, { params }: { params: { productId: string } }) {
  const resolvedParams = params;
  try {
    if (!resolvedParams.productId) return new NextResponse("Product ID is required", { status: 400 });

    const product = await prismadb.product.findUnique({
      where: { id: resolvedParams.productId },
      include: {
        images: true,
        category: true,
        productSizes: { include: { size: true } },
        productColors: { include: { color: true } },
        giftPrices: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return new NextResponse("Failed to get product", { status: 500 });
  }
}

// ================= UPDATE PRODUCT =================
export async function PATCH(req: Request, { params }: { params: { storeId: string; productId: string } }) {
  const { storeId, productId } = params;

  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { name, price, categoryId, sizeIds, colorIds, images, isFeatured, isArchived, isGiftCard, giftPrices } = body;

    if (!productId) return new NextResponse("Product ID is required", { status: 400 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!images?.length) return new NextResponse("Images are required", { status: 400 });
    if (!categoryId) return new NextResponse("Category ID is required", { status: 400 });
    if (!sizeIds?.length) return new NextResponse("At least one size is required", { status: 400 });
    if (!colorIds?.length) return new NextResponse("At least one color is required", { status: 400 });
    if (isGiftCard && (!giftPrices?.length)) return new NextResponse("Gift prices are required", { status: 400 });
    if (!isGiftCard && (price === undefined || price === null)) return new NextResponse("Price is required", { status: 400 });

    const storeByUser = await prismadb.store.findFirst({ where: { id: storeId, userId } });
    if (!storeByUser) return new NextResponse("Unauthorized", { status: 403 });

    // ✅ aggiorna solo i campi principali
    await prismadb.product.update({
      where: { id: productId },
      data: {
        name,
        price: isGiftCard ? null : price,
        categoryId,
        isFeatured,
        isArchived,
        isGiftCard: !!isGiftCard,
      },
    });

    // ✅ immagini
    await prismadb.image.deleteMany({ where: { productId } });
    await prismadb.image.createMany({ data: images.map((img: { url: string }) => ({ productId, url: img.url })) });

    // ✅ multiprezzi gift card
    await prismadb.giftCardPrice.deleteMany({ where: { productId } });
    if (isGiftCard && giftPrices?.length) {
      await prismadb.giftCardPrice.createMany({ data: giftPrices.map((gp: { value: number }) => ({ productId, value: gp.value })) });
    }

    // ✅ taglie
    await prismadb.productSize.deleteMany({ where: { productId } });
    await prismadb.productSize.createMany({ data: sizeIds.map((sizeId: string) => ({ productId, sizeId })) });

    // ✅ colori
    await prismadb.productColor.deleteMany({ where: { productId } });
    await prismadb.productColor.createMany({ data: colorIds.map((colorId: string) => ({ productId, colorId })) });

    // ✅ prodotto aggiornato completo
    const updated = await prismadb.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        category: true,
        productSizes: { include: { size: true } },
        productColors: { include: { color: true } },
        giftPrices: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PRODUCT_PATCH]", error);
    return new NextResponse("Failed to update product", { status: 500 });
  }
}

// ================= DELETE PRODUCT =================
export async function DELETE(req: Request, { params }: { params: { storeId: string; productId: string } }) {
  const resolvedParams = params;
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!resolvedParams.productId) return new NextResponse("Product ID is required", { status: 400 });

    const storeByUserId = await prismadb.store.findFirst({ where: { id: resolvedParams.storeId, userId } });
    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    await prismadb.productSize.deleteMany({ where: { productId: resolvedParams.productId } });
    await prismadb.productColor.deleteMany({ where: { productId: resolvedParams.productId } });
    await prismadb.product.delete({ where: { id: resolvedParams.productId } });

    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error);
    return new NextResponse("Failed to delete product", { status: 500 });
  }
}