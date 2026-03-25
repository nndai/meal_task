"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { useHouseholdBoard } from "@/hooks/useHouseholdBoard";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  return parts[parts.length - 1];
}

function resolveReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) {
    return "/";
  }
  if (raw === "/who-are-you") {
    return "/";
  }
  return raw;
}

export default function WhoAreYouPage() {
  const board = useHouseholdBoard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nameDraft, setNameDraft] = useState("");
  const [didReselect, setDidReselect] = useState(false);

  const returnTo = useMemo(() => resolveReturnPath(searchParams.get("returnTo")), [searchParams]);
  const isReselectMode = searchParams.get("reselect") === "1";

  useEffect(() => {
    if (!board.hydrated || !board.currentMember) {
      return;
    }
    if (isReselectMode && !didReselect) {
      return;
    }
    router.replace(returnTo);
  }, [board.currentMember, board.hydrated, didReselect, isReselectMode, returnTo, router]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#ffe7cf_0%,#fff8f2_40%,#f7fafc_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f2e8dd_1px,transparent_1px),linear-gradient(to_bottom,#f2e8dd_1px,transparent_1px)] bg-size-[44px_44px] opacity-40" />
      <AppHeader />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 py-10">
        <section className="mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-2xl">
          <div className="bg-[linear-gradient(120deg,#f59e0b_0%,#f97316_100%)] px-7 py-6 text-white">
            <h1 className="mt-1 font-headline text-3xl font-extrabold">Bạn là ai?</h1>
            <p className="mt-1 text-sm text-amber-100">Chọn thành viên đã lưu hoặc tạo thành viên mới.</p>
            {board.isNetworking ? (
              <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-amber-100">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-100/50 border-t-white" />
                Đang đồng bộ dữ liệu...
              </p>
            ) : null}
          </div>

          <div className="space-y-5 p-7">
            {board.syncError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{board.syncError}</p>
            ) : null}
            {!board.hydrated ? (
              <p className="text-sm text-slate-600">Đang tải dữ liệu thành viên...</p>
            ) : (
              <>
                {board.board.members.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Thành viên đã lưu</p>
                    <div className="space-y-2">
                      {board.board.members.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            setDidReselect(true);
                            board.selectMember(member.id);
                          }}
                          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-amber-300 hover:bg-amber-50"
                        >
                          <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${member.colorClass}`}>
                            {getInitials(member.name)}
                          </span>
                          <span className="flex-1">
                            <span className="block text-sm font-semibold text-slate-800">{member.name}</span>
                            <span className="block text-xs text-slate-500">ID #{member.id}</span>
                          </span>
                          <span className="text-xs font-semibold text-amber-700">Chọn</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-800">Tạo thành viên mới</p>
                  <div className="flex gap-2">
                    <input
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      placeholder="Ví dụ: Chị Lan"
                      className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!nameDraft.trim()) {
                          return;
                        }
                        setDidReselect(true);
                        void board.createAndSelectMember(nameDraft);
                        setNameDraft("");
                      }}
                      className="rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white transition hover:bg-amber-700"
                    >
                      Tạo
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
