import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { OrderClient } from "./components/client";
import { OrderColumn } from "./components/columns";
import { formatter } from "@/lib/utils";

const OrdersPage = async ({ params }: { params: { storeId: string } }) => {
    const resolvedParams = await params;
    const orders = await prismadb.order.findMany({
        where: { storeId: resolvedParams.storeId },
        include: {
            orderItems: { include: { product: true } },
            customer: true,
        },
        orderBy: { createdAt: "desc" },
    });

 const formattedOrders: OrderColumn[] = orders.map((item) => {
    const addressParts = [
        item.region,
        item.address,
        item.apartment ? `Кв. ${item.apartment}` : null,
        item.floor ? `Этаж ${item.floor}` : null,
        item.entrance ? `Подъезд ${item.entrance}` : null,
        item.extraInfo ? `Примечание: ${item.extraInfo}` : null,
    ].filter(Boolean);

    return {
        id: item.id,
        client: `${item.customer?.firstName || ""} ${item.customer?.lastName || ""}`,
        contacts: `${item.customer?.phone || ""} ${item.customer?.email || ""}`,
        fullAddress: addressParts.join(", "),
        products: item.orderItems.map(oi => oi.product.name).join(", "),
        totalPrice: formatter(item.totalPrice),
        isPaid: true,
        createdAt: format(item.createdAt, "dd/MM/yyyy"),
    };
});

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <OrderClient data={formattedOrders} />
            </div>
        </div>
    );
}

export default OrdersPage;