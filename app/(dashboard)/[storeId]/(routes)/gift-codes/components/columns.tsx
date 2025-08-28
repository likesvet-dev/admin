"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

export type GiftCodeColumn = {
  id: string;
  code: string;
  amount: string;
  createdAt: string;
  expiresAt: string;
  redeemed: string;
  redeemedBy: string;
  purchasedBy: string; // 👈 nuovo
};

export const columns: ColumnDef<GiftCodeColumn>[] = [
  {
    accessorKey: "code",
    header: "Код",
  },
  {
    accessorKey: "amount",
    header: "Сумма",
  },
  {
    accessorKey: "createdAt",
    header: "Дата создания",
  },
  {
    accessorKey: "expiresAt",
    header: "Дата окончания",
  },
  {
    accessorKey: "purchasedBy",
    header: "Кем куплен", // 👈 nuova colonna
  },
  {
    accessorKey: "redeemed",
    header: "Использован",
  },
  {
    accessorKey: "redeemedBy",
    header: "Кем активирован",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

