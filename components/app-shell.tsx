"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { LoveParticles } from "@/components/love-particles";
import type { Member } from "@/lib/types";

type AppShellProps = {
  title: string;
  subtitle?: string;
  isReady: boolean;
  currentMember: Member | null;
  isBusy?: boolean;
  errorMessage?: string | null;
  headerAction?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, subtitle, isReady, currentMember, isBusy = false, errorMessage, headerAction, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const needsName = !currentMember;

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!needsName || pathname === "/who-are-you") {
      return;
    }

    router.replace(`/who-are-you?returnTo=${encodeURIComponent(pathname)}`);
  }, [isReady, needsName, pathname, router]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#ffc8df_0%,#ffedf6_36%,#fff8fc_100%)] text-rose-950">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffd7e8_1px,transparent_1px),linear-gradient(to_bottom,#ffd7e8_1px,transparent_1px)] bg-size-[44px_44px] opacity-35" />
      <LoveParticles />
      <AppHeader />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-16 pt-20 sm:pt-24">
        {isReady && needsName ? (
          <section className="rounded-2xl border border-pink-200 bg-white/90 p-6 text-rose-700 shadow-sm">
            Đang chuyển đến trang chọn thành viên...
          </section>
        ) : (
          <>
            <section className="mb-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-950">{title}</h1>
                  {isBusy ? (
                    <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-pink-700">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-pink-200 border-t-pink-600" />
                      Đang đồng bộ dữ liệu...
                    </p>
                  ) : null}
                </div>
                {headerAction}
              </div>
              {subtitle ? <p className="mt-2 max-w-2xl text-sm text-rose-700/80">{subtitle}</p> : null}
            </section>
            {errorMessage ? (
              <section className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {errorMessage}
              </section>
            ) : null}
            {children}
          </>
        )}
      </main>
    </div>
  );
}
