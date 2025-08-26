import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { GiftCodesClient } from "./components/client";
import { GiftCodeColumn } from "./components/columns";

const GiftCodesPage = async ({ params }: { params: { storeId: string } }) => {
    const resolvedParams = await params;
  const giftCodes = await prismadb.giftCode.findMany({
    where: { storeId: resolvedParams.storeId },
    include: {
      redemption: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedGiftCodes: GiftCodeColumn[] = giftCodes.map((item) => ({
    id: item.id,
    code: item.code,
    amount: `${(item.amount / 100).toFixed(2)} ₽`, // oppure €
    createdAt: format(item.createdAt, "dd/MM/yyyy"),
    expiresAt: item.expiresAt ? format(item.expiresAt, "dd/MM/yyyy") : "—",
    redeemed: item.redemption ? "Да" : "Нет",
    redeemedBy: item.redemption?.customer
      ? `${item.redemption.customer.firstName} ${item.redemption.customer.lastName}`
      : "—",
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <GiftCodesClient data={formattedGiftCodes} />
      </div>
    </div>
  );
};

export default GiftCodesPage;
