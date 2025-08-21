"use client";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { columns, CustomerColumn } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";

interface CustomerClientProps {
  data: CustomerColumn[];
}

export const CustomerClient: React.FC<CustomerClientProps> = ({ data }) => {
  return (
    <>
      <div className="flex items-center justify-between max-[500px]:flex-col max-[500px]:gap-y-8">
        <Heading
          title={`Клиенты (${data.length})`}
          description="Управление клиентами вашего магазина"
        />
      </div>
      <Separator />
      <DataTable columns={columns} data={data} searchKey="email" />
      <Heading title="API" description="API вызовы для клиентов" />
      <Separator />
      <ApiList entityName="customers" entityIdName="customerId" />
    </>
  );
};