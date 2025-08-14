"use client"

import { ColumnDef } from "@tanstack/react-table"

export type OrderColumn = {
  id: string
  phone: string
  address: string
  totalPrice: string
  products: string

  createdAt: string
}

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "products",
    header: "Товары",
  },
  {
    accessorKey: "phone",
    header: "Телефон",
  },
  {
    accessorKey: "address",
    header: "Адрес",
  },
  {
    accessorKey: "totalPrice",
    header: "Итого",
  },
  {
    accessorKey: "isPaid",
    header: "Оплачено",
  },
  {
    accessorKey: "createdAt",
    header: "Дата",
  },
]