import prismadb from "@/lib/prismadb";

export const getTotalRevenue = async (storeId: string) => {
    const paidOrders = await prismadb.order.findMany({
        where: {
            storeId,
            isPaid: true,
        },
        select: {
            totalPrice: true,
        },
    });

    const totalRevenue = paidOrders.reduce((total, order) => {
        return total + order.totalPrice;
    }, 0);

    return totalRevenue;
};