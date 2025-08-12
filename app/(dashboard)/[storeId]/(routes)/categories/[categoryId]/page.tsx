import prismadb from "@/lib/prismadb";
import { CategoryForm } from "./components/category-form";
import { ObjectId } from "mongodb";

const CategoryPage = async ({ params }: { params: { categoryId: string, storeId: string } }) => {
  const resolvedParams = await params;
  const billboards = await prismadb.billboard.findMany({
    where: {
      storeId: resolvedParams.storeId
    }
  })
  
  if (resolvedParams.categoryId === "new") {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <CategoryForm initialData={null} billboards={billboards} />
        </div>
      </div>
    );
  }

  if (!ObjectId.isValid(resolvedParams.categoryId)) {
    return <div>Невалидный ID</div>;
  }

  const category = await prismadb.category.findUnique({
    where: {
      id: resolvedParams.categoryId
    }
  });

  if (!category) {
    return <div>Нет баннеров</div>;
  }
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryForm initialData={category} billboards={billboards}/>
      </div>
    </div>
  );
}

export default CategoryPage;