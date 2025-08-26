import prismadb from "@/lib/prismadb";
import { GiftCodeForm } from "./components/gift-code-form";

const GiftCodePage = async ({ params }: { params: { giftCodeId: string } }) => {
  const { giftCodeId } = await params;

  let giftCode = null;
  if (giftCodeId !== "new") {
    giftCode = await prismadb.giftCode.findUnique({
      where: {
        id: giftCodeId,
      },
    });
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <GiftCodeForm initialData={giftCode} />
      </div>
    </div>
  );
};

export default GiftCodePage;