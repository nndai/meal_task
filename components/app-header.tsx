"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Nhiệm vụ" },
  { href: "/manage", label: "Quản lý" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-pink-200/80 bg-white/75 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 sm:py-4 py-3">
        <div>
          <a href="/" className="font-headline sm:text-3xl text-2xl font-extrabold tracking-tight text-pink-700 whitespace-nowrap">
            Meal Task
          </a>
        </div>
        <nav className="flex items-center sm:gap-2 rounded-full bg-pink-50 p-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full sm:px-4 px-2 py-2 sm:text-sm text-xs font-semibold transition whitespace-nowrap  ${
                  active ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20" : "text-rose-700 hover:text-rose-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
