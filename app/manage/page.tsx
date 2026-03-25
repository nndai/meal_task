"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useHouseholdBoard } from "@/hooks/useHouseholdBoard";

export default function ManagePage() {
  const board = useHouseholdBoard();
  const [taskDraft, setTaskDraft] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitleDraft, setEditingTaskTitleDraft] = useState("");
  const [memberDraft, setMemberDraft] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingNameDraft, setEditingNameDraft] = useState("");

  const sortedMembers = useMemo(() => {
    return [...board.board.members].sort((a, b) => a.name.localeCompare(b.name));
  }, [board.board.members]);

  function onAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void board.addTask(taskDraft);
    setTaskDraft("");
  }

  function onAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void board.addMember(memberDraft);
    setMemberDraft("");
  }

  function startEditTask(taskId: string, currentTitle: string) {
    setEditingTaskId(taskId);
    setEditingTaskTitleDraft(currentTitle);
  }

  function saveEditTask() {
    if (!editingTaskId) {
      return;
    }
    void board.updateTask(editingTaskId, editingTaskTitleDraft);
    setEditingTaskId(null);
    setEditingTaskTitleDraft("");
  }

  function startEditMember(memberId: number, currentName: string) {
    setEditingMemberId(memberId);
    setEditingNameDraft(currentName);
  }

  function saveEditMember() {
    if (!editingMemberId) {
      return;
    }
    void board.updateMember(editingMemberId, editingNameDraft);
    setEditingMemberId(null);
    setEditingNameDraft("");
  }

  return (
    <AppShell
      title="Cài đặt"
      subtitle="Trang này tập trung vào quản lý nhiệm vụ và thành viên."
      isReady={board.hydrated}
      currentMember={board.currentMember}
      isBusy={board.isNetworking}
      errorMessage={board.syncError}
    >
      <div className="grid gap-6 md:grid-cols-12">
        <section className="space-y-4 overflow-hidden md:col-span-7">
          <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-sm">
            <h3 className="font-headline text-xl font-bold text-slate-900">Thêm nhiệm vụ mới</h3>
            <form className="mt-4 flex gap-3" onSubmit={onAddTask}>
              <input
                value={taskDraft}
                onChange={(event) => setTaskDraft(event.target.value)}
                placeholder="Ví dụ: Rửa bếp sau bữa tối"
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-500"
              />
              <button type="submit" className="h-11 rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white transition hover:bg-amber-700">
                Thêm
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-sm">
            <h3 className="font-headline text-xl font-bold text-slate-900">Danh sách nhiệm vụ</h3>
            <ul className="mt-4 space-y-3">
              {board.board.taskTemplates.map((task) => (
                <li key={task.id} className="flex min-w-0 items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                  {editingTaskId === task.id ? (
                    <div className="flex w-full min-w-0 items-center gap-2">
                      <input
                        value={editingTaskTitleDraft}
                        onChange={(event) => setEditingTaskTitleDraft(event.target.value)}
                        className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={saveEditTask}
                        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTaskId(null);
                          setEditingTaskTitleDraft("");
                        }}
                        className="shrink-0 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold text-slate-900">{task.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                          onClick={() => startEditTask(task.id, task.title)}
                        >
                          Sửa tên
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          onClick={() => {
                            const accepted = window.confirm(`Bạn có chắc muốn xóa nhiệm vụ \"${task.title}\" không?`);
                            if (!accepted) {
                              return;
                            }

                            void (async () => {
                              const result = await board.removeTask(task.id);
                              if (!result.ok) {
                                window.alert(result.message ?? "Không thể xóa nhiệm vụ này.");
                              }
                            })();
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-4 overflow-hidden md:col-span-5">
          <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-sm">
            <h3 className="font-headline text-xl font-bold text-slate-900">Bạn là ai</h3>
            <p className="mt-1 text-sm text-slate-500">Hiển thị người dùng hiện tại và cho phép chọn lại.</p>

            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Đang chọn</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-800">{board.currentMember ? board.currentMember.name : "Chưa chọn"}</p>
                <Link
                  href="/who-are-you?returnTo=%2Fmanage&reselect=1"
                  className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
                >
                  Chọn lại
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-sm">
            <h3 className="font-headline text-xl font-bold text-slate-900">Thành viên hiện tại</h3>
            <p className="mt-1 text-sm text-slate-500">Bạn có thể thêm thành viên mới và sửa tên trực tiếp trong danh sách.</p>

            <form className="mt-4 flex gap-2" onSubmit={onAddMember}>
              <input
                value={memberDraft}
                onChange={(event) => setMemberDraft(event.target.value)}
                placeholder="Ví dụ: Lan"
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-amber-500"
              />
              <button type="submit" className="rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700">
                Thêm
              </button>
            </form>

            <ul className="mt-4 space-y-3">
              {sortedMembers.map((member) => (
                <li key={member.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <div className={`flex h-8 shrink-0 px-2 items-center justify-center rounded-full text-xs font-bold text-white ${member.colorClass}`}>
                    {board.initials(member.name)}
                  </div>

                  {editingMemberId === member.id ? (
                    <div className="flex flex-1 min-w-0 items-center gap-2">
                      <input
                        value={editingNameDraft}
                        onChange={(event) => setEditingNameDraft(event.target.value)}
                        className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={saveEditMember}
                        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMemberId(null);
                          setEditingNameDraft("");
                        }}
                        className="shrink-0 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <p className="font-medium text-slate-800">
                        #{member.id} - {member.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => startEditMember(member.id, member.name)}
                        className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                      >
                        Sửa user
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
