'use client';

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export const BillboardClient = () => {
    const router = useRouter();
    const params = useParams();


    return (
        <>
            <div className="flex items-center justify-between max-[500px]:flex-col max-[500px]:gap-y-8">
                <Heading title="Баннеры (0)" description="Управление баннерами для вашего магазина" />
                <Button className="max-[500px]:w-full cursor-pointer" onClick={() => router.push(`/${params.storeId}/billboards/new`)}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Добавить баннер
                </Button>
            </div>
            <Separator />
        </>
    )
}