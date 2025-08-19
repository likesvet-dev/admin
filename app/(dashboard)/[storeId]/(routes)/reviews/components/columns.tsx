"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action"

export type ReviewColumn = {
  id: string
  label: string
  createdAt: string
}

export const columns: ColumnDef<ReviewColumn>[] = [
  {
    accessorKey: "label",
    header: "Название",
  },
  {
    accessorKey: "createdAt",
    header: "Дата",
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => <CellAction data={row.original} />,
  }
]