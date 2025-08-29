import prismadb from "@/lib/prismadb";

interface GraphData {
  name: string;
  total: number;
}

export const getGraphRevenue = async (storeId: string) => {
  const paidOrders = await prismadb.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
    select: {
      totalPrice: true,
      createdAt: true,
    },
  });

  const monthlyRevenue: { [key: number]: number } = {};

  for (const order of paidOrders) {
    const month = order.createdAt.getMonth(); // 0 = Gennaio
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + order.totalPrice;
  }

  const graphData: GraphData[] = [
    { name: "Янв", total: 0 },
    { name: "Фев", total: 0 },
    { name: "Мар", total: 0 },
    { name: "Апр", total: 0 },
    { name: "Май", total: 0 },
    { name: "Июн", total: 0 },
    { name: "Июл", total: 0 },
    { name: "Авг", total: 0 },
    { name: "Сен", total: 0 },
    { name: "Окт", total: 0 },
    { name: "Ноя", total: 0 },
    { name: "Дек", total: 0 },
  ];

  for (const month in monthlyRevenue) {
    graphData[parseInt(month)].total = monthlyRevenue[parseInt(month)];
  }

  return graphData;
};
