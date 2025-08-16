import prismadb from "@/lib/prismadb";

interface DashboardPageProps {
    params: {
        storeId: string;
    };
}

const DashboardPage: React.FC<DashboardPageProps> = async ({ params }) => {
    const resolvedParams = await params;
    const store = await prismadb.store.findFirst({
        where: {
            userId: resolvedParams.storeId
        }
    })
    return (
        <div>
            active store: {store?.name}
        </div>
    );
}

export default DashboardPage;