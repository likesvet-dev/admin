"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

export type CustomerColumn = {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
};

export const columns: ColumnDef<CustomerColumn>[] = [
  {
    accessorKey: "name",
    header: "Имя",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "balance",
    header: "Баланс",
  },
  {
    accessorKey: "createdAt",
    header: "Дата регистрации",
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];