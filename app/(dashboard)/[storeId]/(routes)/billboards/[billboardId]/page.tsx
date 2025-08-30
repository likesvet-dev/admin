import prismadb from "@/lib/prismadb";
import { BillboardForm } from "./components/billboard-form";
import { ObjectId } from "mongodb";

// Modifica l'interfaccia dei parametri
interface BillboardPageProps {
  params: Promise<{ billboardId: string }>;
}

const BillboardPage = async (props: BillboardPageProps) => {
  // Risolvi i parametri dalla Promise
  const params = await props.params;
  
  if (params.billboardId === "new") {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <BillboardForm initialData={null} />
        </div>
      </div>
    );
  }

  if (!ObjectId.isValid(params.billboardId)) {
    return <div>Невалидный ID-баннера</div>;
  }

  const billboard = await prismadb.billboard.findUnique({
    where: {
      id: params.billboardId
    }
  });

  if (!billboard) {
    return <div>Нет баннеров</div>;
  }
  
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillboardForm initialData={billboard} />
      </div>
    </div>
  );
}

export default BillboardPage;