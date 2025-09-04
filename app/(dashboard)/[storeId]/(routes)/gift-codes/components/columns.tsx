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
    header: "Дата",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);

      return (
        <span>
          {date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Moscow",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "expiresAt",
    header: "Дата окончания",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);

      return (
        <span>
          {date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Moscow",
          })}
        </span>
      );
    },
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

