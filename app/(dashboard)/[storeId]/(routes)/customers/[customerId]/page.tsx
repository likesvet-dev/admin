import prismadb from "@/lib/prismadb";
import { CustomerForm } from "./components/customer-form";
import { ObjectId } from "mongodb";

const CustomerPage = async ({ params }: { params: { customerId: string } }) => {
  if (params.customerId === "new") {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <CustomerForm initialData={null} />
        </div>
      </div>
    );
  }

  if (!ObjectId.isValid(params.customerId)) {
    return <div>Невалидный ID клиента</div>;
  }

  const customer = await prismadb.customer.findUnique({
    where: {
      id: params.customerId,
    },
  });

  if (!customer) {
    return <div>Клиент не найден</div>;
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CustomerForm initialData={customer} />
      </div>
    </div>
  );
};

export default CustomerPage;