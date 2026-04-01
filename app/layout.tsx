import type { Metadata } from "next";
import "./globals.css";
import { NotificationPrompt } from "@/components/notification-prompt";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Meal Task - Nhiệm vụ bữa ăn gia đình",
  description: "Ứng dụng quản lý nhiệm vụ bữa ăn hàng ngày cho gia đình.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={cn("h-full antialiased", "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col">
        {children}
        <NotificationPrompt />
      </body>
    </html>
  );
}
