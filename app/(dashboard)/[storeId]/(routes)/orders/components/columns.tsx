"use client"

import { ColumnDef } from "@tanstack/react-table"

export type OrderColumn = {
  id: string
  client: string
  contacts: string
  fullAddress: string
  totalPrice: string
  products: string
  createdAt: string
  isPaid: boolean
}

export const columns: ColumnDef<OrderColumn>[] = [
  { accessorKey: "client", header: "Клиент" },
  { accessorKey: "contacts", header: "Контакты" },
  { accessorKey: "fullAddress", header: "Адрес" },
  { accessorKey: "products", header: "Товары" },
  { accessorKey: "totalPrice", header: "Итого" },
  { accessorKey: "isPaid", header: "Оплачено" },
  { accessorKey: "createdAt", header: "Дата" },
]