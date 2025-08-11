import prismadb from "@/lib/prismadb";
import { BillboardForm } from "./components/billboard-form";
import { ObjectId } from "mongodb";

const BillboardPage = async ({params}: {params: {billboardId: string}}) => {
    const resolvedParams = await params;
  if (resolvedParams.billboardId === "new") {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <BillboardForm initialData={null} />
        </div>
      </div>
    );
  }

  if (!ObjectId.isValid(resolvedParams.billboardId)) {
    return <div>Невалидный ID-баннера</div>;
  }

  const billboard = await prismadb.billboard.findUnique({
    where: {
      id: resolvedParams.billboardId
    }
  });

  if (!billboard) {
    return <div>Billboard not found</div>;
  }
    return ( 
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <BillboardForm initialData={billboard}/>
            </div>
        </div>
     );
}
 
export default BillboardPage;