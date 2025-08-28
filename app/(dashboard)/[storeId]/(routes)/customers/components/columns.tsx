"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

export type CustomerColumn = {
  id: string;
  name: string;
  contacts: string; // unisce email e telefono
  balance: number;
  createdAt: string;
};

export const columns: ColumnDef<CustomerColumn>[] = [
  {
    accessorKey: "name",
    header: "Имя",
  },
  {
    accessorKey: "contacts",
    header: "Контакты",
    cell: ({ row }) => {
      const [phone, email] = row.original.contacts.split("||"); // separatore interno
      return (
        <div className="flex flex-col">
          <span>{phone}</span>
          <span>{email}</span>
        </div>
      );
    },
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
