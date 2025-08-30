'use client';

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const routes = [
    { href: `/${params.storeId}`, label: 'Панель управления' },
    { href: `/${params.storeId}/billboards`, label: 'Баннеры' },
    { href: `/${params.storeId}/categories`, label: 'Категории' },
    { href: `/${params.storeId}/sizes`, label: 'Размеры' },
    { href: `/${params.storeId}/colors`, label: 'Цвета' },
    { href: `/${params.storeId}/products`, label: 'Товары' },
    { href: `/${params.storeId}/reviews`, label: 'Отзывы' },
    { href: `/${params.storeId}/orders`, label: 'Заказы' },
    { href: `/${params.storeId}/customers`, label: 'Пользователи' },
    { href: `/${params.storeId}/gift-codes`, label: 'Сертификаты' },
    { href: `/${params.storeId}/settings`, label: 'Настройки' },
  ];

  const activeRoute = routes.find((route) => pathname === route.href);

  // Desktop nav
  const desktopNav = (
    <div className="hidden max-[500px]:hidden gap-6 min-[1080px]:flex items-center space-x-4 lg:space-x-6 max-[1080px]:grid max-[1080px]:grid-cols-6  max-[960px]:grid-cols-5 max-[800px]:grid-cols-4 max-[620px]:grid-cols-3 max-[1080px]:gap-3">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors mr-0 hover:text-primary cursor-pointer',
            pathname === route.href
              ? 'text-black dark:text-white'
              : 'text-muted-foreground'
          )}
        >
          {route.label}
        </Link>
      ))}
    </div>
  );

  // Mobile dropdown
  const mobileNav = (
    <div className="hidden max-[500px]:flex w-full">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger className="w-full p-2 border rounded-md flex justify-between items-center dark:bg-gray-800 dark:text-white">
          {activeRoute ? activeRoute.label : "Меню"}
          <ChevronDown className="ml-2 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
          {routes.map((route) => (
            <DropdownMenuItem
              key={route.href}
              className={cn(pathname === route.href ? 'font-bold' : '')}
              onClick={() => {
                setOpen(false); // 🔑 chiude il dropdown subito
                router.push(route.href);
              }}
            >
              {route.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <nav className={cn('relative', className)}>
      {desktopNav}
      {mobileNav}
    </nav>
  );
}
