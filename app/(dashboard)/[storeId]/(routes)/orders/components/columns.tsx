import { ColumnDef } from "@tanstack/react-table";

export type ProductInfo = {
  name: string;
  size?: string;
  color?: string;
};

export type OrderColumn = {
  id: string;
  client: string;
  contacts: string;
  region: string;
  address: string;
  apartment?: string;
  floor?: string;
  entrance?: string;
  extraInfo?: string;
  products: ProductInfo[];
  totalPrice: string;
  shippingMethod: string;
  createdAt: string;
  isPaid: boolean;
};

export const columns: ColumnDef<OrderColumn>[] = [
  { accessorKey: "client", header: "Клиент" },

  {
    accessorKey: "contacts",
    header: "Контакты",
    cell: ({ row }) => {
      const [phone, email] = row.original.contacts.split(" ");
      return (
        <div className="flex flex-col">
          <span>{phone}</span>
          <span>{email}</span>
        </div>
      );
    },
  },

  { accessorKey: "shippingMethod", header: "Способ доставки" },

  {
    header: "Адрес",
    accessorKey: "region",
    cell: ({ row }) => {
      const { region, address, apartment, floor, entrance, extraInfo } = row.original;
      return (
        <div className="flex flex-col">
          <span>{region}</span>
          <span>{address}</span>
          {(apartment || floor || entrance) && (
            <span>
              {apartment && `Кв. ${apartment}`} {floor && `Этаж ${floor}`} {entrance && `Подъезд ${entrance}`}
            </span>
          )}
          {extraInfo && <span>Примечание: {extraInfo}</span>}
        </div>
      );
    },
  },

  {
    accessorKey: "products",
    header: "Товары",
    cell: ({ row }) => (
      <div className="flex flex-col">
        {row.original.products.map((p, idx) => (
          <span key={idx}>
            {p.name}
            {p.size ? `, ${p.size}` : ""}
            {p.color ? `, ${p.color}` : ""}
          </span>
        ))}
      </div>
    ),
  },

  { accessorKey: "totalPrice", header: "Итого" },
  { accessorKey: "isPaid", header: "Оплачено", cell: ({ row }) => (row.original.isPaid ? "✅" : "❌")},
  { accessorKey: "createdAt", header: "Дата" },
];
