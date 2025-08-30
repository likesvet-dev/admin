import { getGraphRevenue } from "@/actions/get-graph-revenue";
import { getSalesCount } from "@/actions/get-sales-count";
import { getStockCount } from "@/actions/get-stock-count";
import { getTotalRevenue } from "@/actions/get-total-revenue";
import { Overview } from "@/components/overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { formatter } from "@/lib/utils";
import { CreditCard, Package } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DashboardPage = async ({ params } : any) => {
    const resolvedParams = await params;

    const totalRevenue = await getTotalRevenue(resolvedParams.storeId);
    const salesCount = await getSalesCount(resolvedParams.storeId);
    const stockCount = await getStockCount(resolvedParams.storeId);
    const graphRevenue = await getGraphRevenue(resolvedParams.storeId);

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <Heading title="Панель управления" description="Обзор вашего магазина" />
                <Separator />
                <div className="grid gap-4 grid-cols-3 max-[750px]:grid-cols-1 ">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
                            ₽
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatter(totalRevenue)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Продажи</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                +{salesCount}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Товары в наличии</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stockCount}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card className="col-span-4 px-5">
                    <CardHeader>
                        <CardTitle>Обзор</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Overview data={graphRevenue} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default DashboardPage;