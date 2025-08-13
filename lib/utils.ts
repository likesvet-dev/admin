import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatter = (priceInKopecks: number) => {
  const rubles = priceInKopecks / 100;
  
  return new Intl.NumberFormat("ru-RU", {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rubles);
};
