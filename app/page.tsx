"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useHouseholdBoard } from "@/hooks/useHouseholdBoard";
import { toLocalDateKey } from "@/lib/date";

function toDateKey(date: Date): string {
  return toLocalDateKey(date);
}

function formatDateLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function HomePage() {
  const board = useHouseholdBoard();
  const today = useMemo(() => toDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const selectedDateKey = toDateKey(selectedDate);

  const isPast = selectedDateKey < today;
  const isToday = selectedDateKey === today;

  const tasksForDate = useMemo(() => {
    return board.tasksForDate(selectedDateKey);
  }, [board, selectedDateKey]);

  const dynamicTitle = isToday ? "Nhiệm vụ hôm nay" : `Nhiệm vụ ngày ${formatDateLabel(selectedDateKey)}`;
  const participantCount = board.countParticipantsOnDate(selectedDateKey);

  return (
    <AppShell
      title={dynamicTitle}
      isReady={board.hydrated}
      currentMember={board.currentMember}
      isBusy={board.isNetworking}
      errorMessage={board.syncError}
      headerAction={
        <div className="relative">
          <Button variant="outline" onClick={() => setShowCalendar((prev) => !prev)}>
            Chọn ngày: {formatDateLabel(selectedDateKey)}
          </Button>
          {showCalendar && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowCalendar(false)} />
              <div className="fixed inset-45 z-30 flex items-start justify-center md:absolute md:inset-auto md:right-0 md:top-12 md:block">
                <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (!date) {
                        return;
                      }
                      setSelectedDate(date);
                      setShowCalendar(false);
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      }
    >
      {isPast && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Ngày trong quá khứ, không thay đổi dữ liệu!
        </div>
      )}
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        Số lượng: <span className="font-bold">{participantCount}</span>
      </div>
      <div className="grid gap-5">
        {tasksForDate.map((task) => {
          const members = board.memberNames(task.id, selectedDateKey);
          const checkedByMe = Boolean(board.currentMember && task.completedBy.includes(board.currentMember.id));
          const canToggle = Boolean(board.currentMember) && !isPast;

          return (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                if (!canToggle) {
                  return;
                }
                void board.toggleTask(task.id, selectedDateKey);
              }}
              disabled={!canToggle}
              className={`group w-full rounded-2xl border p-5 text-left shadow-sm transition md:p-6 ${
                checkedByMe ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex w-full flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      checkedByMe
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-300 bg-white text-transparent group-hover:border-emerald-500"
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <h3 className="font-headline sm:text-xl text-lg font-bold text-slate-900">{task.title}</h3>
                  </div>
                </div>

                <div className={`flex items-center ${members.length >= 3 ? "gap-0" : "gap-2"}`}>
                  {members.length === 0 && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Chưa có ai tick</span>
                  )}
                  {members.map((member, index) => (
                    <span
                      key={member.id}
                      className={`flex h-8 items-center justify-center rounded-full px-4 text-[14px] font-bold text-white ring-2 ring-white ${member.colorClass} ${index > 0 && members.length >= 3 ? "-ml-3" : ""}`}
                      title={member.name}
                    >
                      {board.initials(member.name)}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}

        {tasksForDate.length === 0 && (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Không có nhiệm vụ nào cho ngày {formatDateLabel(selectedDateKey)}.
          </article>
        )}
      </div>
    </AppShell>
  );
}
