import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ModalProvider } from "@/providers/modal-provider";
import { ToastProvider } from "@/providers/toast-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "LikeSvet - Admin",
  description: "Панель управление магазина",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider >
      <html lang="ru">
        <body className={inter.className} >
          <ToastProvider />
          <ModalProvider>
            {children}
          </ModalProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
