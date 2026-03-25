"use client";

import { useEffect, useMemo, useState } from "react";
import { avatarPalette, USER_MEMBER_ID_KEY } from "@/lib/mock-data";
import type { BoardState, Member, TaskForDate, TaskTemplate } from "@/lib/types";
import {
  createCompletionInSupabase,
  createMemberInSupabase,
  createTaskTemplateInSupabase,
  fetchBoardStateFromSupabase,
  isSupabaseConfigured,
  removeCompletionInSupabase,
  removeTaskTemplateInSupabase,
  taskHasCompletionsInSupabase,
  updateTaskTemplateInSupabase,
  updateMemberInSupabase,
} from "@/lib/supabase";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  return parts[parts.length - 1];
}

function getNextMemberId(members: Member[]): number {
  if (members.length === 0) {
    return 1;
  }
  return Math.max(...members.map((member) => member.id)) + 1;
}

function normalizeBoardState(raw: BoardState): BoardState {
  const legacyRaw = raw as BoardState & {
    tasks?: Array<{
      id: string;
      title: string;
      date: string;
      completedBy: number[];
    }>;
  };

  const idMap = new Map<string, number>();

  const members: Member[] = (raw.members ?? []).map((member, index) => {
    const numericId = typeof member.id === "number" ? member.id : index + 1;
    idMap.set(String(member.id), numericId);

    return {
      id: numericId,
      name: member.name,
      colorClass: member.colorClass || avatarPalette[index % avatarPalette.length],
    };
  });

  const taskTemplates = (raw.taskTemplates ?? []).map((task) => ({
    id: String(task.id),
    title: task.title,
  }));

  const completions = (raw.completions ?? [])
    .map((completion) => {
      const memberId = typeof completion.memberId === "number" ? completion.memberId : idMap.get(String(completion.memberId));
      if (!memberId) {
        return null;
      }

      return {
        taskId: String(completion.taskId),
        memberId,
        date: completion.date,
      };
    })
    .filter((completion): completion is NonNullable<typeof completion> => completion !== null);

  if (taskTemplates.length === 0 && (legacyRaw.tasks ?? []).length > 0) {
    const templateMap = new Map<string, TaskTemplate>();
    const migratedCompletions: BoardState["completions"] = [];

    for (const task of legacyRaw.tasks ?? []) {
      if (!templateMap.has(task.id)) {
        templateMap.set(task.id, {
          id: task.id,
          title: task.title,
        });
      }

      for (const memberId of task.completedBy ?? []) {
        migratedCompletions.push({
          taskId: task.id,
          memberId,
          date: task.date,
        });
      }
    }

    return {
      members,
      taskTemplates: Array.from(templateMap.values()),
      completions: migratedCompletions,
    };
  }

  return {
    members,
    taskTemplates,
    completions,
  };
}

export function useHouseholdBoard() {
  const emptyBoardState: BoardState = {
    members: [],
    taskTemplates: [],
    completions: [],
  };

  const supabaseEnabled = isSupabaseConfigured();
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [board, setBoard] = useState<BoardState>(emptyBoardState);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [networkPendingCount, setNetworkPendingCount] = useState(0);

  const isNetworking = networkPendingCount > 0;

  async function runWithNetworkSpinner<T>(action: () => Promise<T>): Promise<T> {
    setNetworkPendingCount((prev) => prev + 1);
    try {
      const result = await action();
      setSyncError(null);
      return result;
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Không thể kết nối internet để đồng bộ dữ liệu.");
      throw error;
    } finally {
      setNetworkPendingCount((prev) => Math.max(0, prev - 1));
    }
  }

  useEffect(() => {
    async function hydrateBoard() {
      if (!supabaseEnabled) {
        setBoard(emptyBoardState);
        setSyncError("Chưa cấu hình Supabase. Không thể tải dữ liệu.");
        setHydrated(true);
        return;
      }

      if (!window.navigator.onLine) {
        setBoard(emptyBoardState);
        setSyncError("Không có internet. Không thể tải dữ liệu.");
        setHydrated(true);
        return;
      }

      try {
        const savedMemberId = window.localStorage.getItem(USER_MEMBER_ID_KEY);
        const remoteBoard = await runWithNetworkSpinner(() => fetchBoardStateFromSupabase());
        const normalizedBoard = normalizeBoardState(remoteBoard);
        setBoard(normalizedBoard);

        if (savedMemberId) {
          const memberId = Number(savedMemberId);
          if (!Number.isNaN(memberId) && normalizedBoard.members.some((member) => member.id === memberId)) {
            setCurrentMemberId(memberId);
          }
        }
      } catch (error) {
        setBoard(emptyBoardState);
        setSyncError(error instanceof Error ? error.message : "Không thể đồng bộ dữ liệu với Supabase.");
      } finally {
        setHydrated(true);
      }
    }

    hydrateBoard();
  }, [supabaseEnabled]);

  const currentMember = useMemo(() => {
    if (currentMemberId === null) {
      return null;
    }
    return board.members.find((member) => member.id === currentMemberId) ?? null;
  }, [board.members, currentMemberId]);

  async function ensureMember(name: string): Promise<Member> {
    const existing = board.members.find((member) => member.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return existing;
    }

    const colorClass = avatarPalette[board.members.length % avatarPalette.length];
    const nextMember = supabaseEnabled
      ? await runWithNetworkSpinner(() => createMemberInSupabase(name, colorClass))
      : {
          id: getNextMemberId(board.members),
          name,
          colorClass,
        };

    setBoard((prev) => ({
      ...prev,
      members: [...prev.members, nextMember],
    }));

    return nextMember;
  }

  function selectMember(memberId: number) {
    window.localStorage.setItem(USER_MEMBER_ID_KEY, String(memberId));
    setCurrentMemberId(memberId);
  }

  async function createAndSelectMember(name: string) {
    const cleanName = name.trim();
    if (!cleanName) {
      return;
    }

    try {
      const member = await ensureMember(cleanName);
      selectMember(member.id);
    } catch {
      return;
    }
  }

  async function addMember(name: string) {
    const cleanName = name.trim();
    if (!cleanName) {
      return;
    }
    try {
      await ensureMember(cleanName);
    } catch {
      return;
    }
  }

  async function updateMember(memberId: number, nextName: string) {
    const targetMemberId = memberId;
    const cleanName = nextName.trim();
    if (!cleanName) {
      return;
    }

    if (supabaseEnabled) {
      try {
        await runWithNetworkSpinner(() => updateMemberInSupabase(targetMemberId, cleanName));
      } catch {
        return;
      }
    }

    setBoard((prev) => ({
      ...prev,
      members: prev.members.map((member) => {
        if (member.id !== targetMemberId) {
          return member;
        }

        return {
          ...member,
          name: cleanName,
        };
      }),
    }));
  }

  async function addTask(title: string) {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return;
    }

    const nextTemplate: TaskTemplate | null = supabaseEnabled
      ? await runWithNetworkSpinner(() => createTaskTemplateInSupabase(cleanTitle)).catch(() => null)
      : {
          id: `task-${Date.now()}`,
          title: cleanTitle,
        };

    if (!nextTemplate) {
      return;
    }

    setBoard((prev) => ({
      ...prev,
      taskTemplates: [nextTemplate, ...prev.taskTemplates],
    }));
  }

  async function removeTask(taskId: string): Promise<{ ok: boolean; message?: string }> {
    const hasCompletionInState = board.completions.some((completion) => completion.taskId === taskId);
    if (hasCompletionInState) {
      return {
        ok: false,
        message: "Không thể xóa vì nhiệm vụ này đã có dữ liệu hoàn thành trong lịch sử.",
      };
    }

    if (supabaseEnabled) {
      let hasCompletionInDb = false;
      try {
        hasCompletionInDb = await runWithNetworkSpinner(() => taskHasCompletionsInSupabase(taskId));
      } catch {
        return {
          ok: false,
          message: "Không thể kiểm tra dữ liệu trên internet.",
        };
      }
      if (hasCompletionInDb) {
        return {
          ok: false,
          message: "Không thể xóa vì nhiệm vụ này đã có dữ liệu trong bảng task completion.",
        };
      }
      try {
        await runWithNetworkSpinner(() => removeTaskTemplateInSupabase(taskId));
      } catch {
        return {
          ok: false,
          message: "Không thể xóa vì lỗi kết nối internet.",
        };
      }
    }

    setBoard((prev) => ({
      ...prev,
      taskTemplates: prev.taskTemplates.filter((task) => task.id !== taskId),
      completions: prev.completions.filter((completion) => completion.taskId !== taskId),
    }));

    return { ok: true };
  }

  async function updateTask(taskId: string, nextTitle: string): Promise<void> {
    const cleanTitle = nextTitle.trim();
    if (!cleanTitle) {
      return;
    }

    if (supabaseEnabled) {
      try {
        await runWithNetworkSpinner(() => updateTaskTemplateInSupabase(taskId, cleanTitle));
      } catch {
        return;
      }
    }

    setBoard((prev) => ({
      ...prev,
      taskTemplates: prev.taskTemplates.map((task) => (task.id === taskId ? { ...task, title: cleanTitle } : task)),
    }));
  }

  async function toggleTask(taskId: string, date: string) {
    const member = currentMember;
    if (!member) {
      return;
    }

    const hasChecked = board.completions.some(
      (completion) => completion.taskId === taskId && completion.memberId === member.id && completion.date === date,
    );

    if (supabaseEnabled) {
      if (hasChecked) {
        try {
          await runWithNetworkSpinner(() => removeCompletionInSupabase(taskId, member.id, date));
        } catch {
          return;
        }
      } else {
        try {
          await runWithNetworkSpinner(() => createCompletionInSupabase(taskId, member.id, date));
        } catch {
          return;
        }
      }
    }

    setBoard((prev) => ({
      ...prev,
      completions: hasChecked
        ? prev.completions.filter((completion) => !(completion.taskId === taskId && completion.memberId === member.id && completion.date === date))
        : [...prev.completions, { taskId, memberId: member.id, date }],
    }));
  }

  function tasksForDate(date: string): TaskForDate[] {
    return board.taskTemplates.map((taskTemplate) => {
      const completedBy = board.completions
        .filter((completion) => completion.taskId === taskTemplate.id && completion.date === date)
        .map((completion) => completion.memberId);

      return {
        id: taskTemplate.id,
        title: taskTemplate.title,
        date,
        completedBy,
      };
    });
  }

  function memberNames(taskId: string, date: string): Member[] {
    const checkedMembers = board.completions
      .filter((completion) => completion.taskId === taskId && completion.date === date)
      .map((completion) => completion.memberId);
    return board.members.filter((member) => checkedMembers.includes(member.id));
  }

  function countCompletedOnDate(date: string): number {
    return tasksForDate(date).filter((task) => task.completedBy.length > 0).length;
  }

  return {
    hydrated,
    board,
    currentMemberId,
    currentMember,
    syncError,
    isNetworking,
    initials: getInitials,
    selectMember,
    createAndSelectMember,
    addMember,
    updateMember,
    addTask,
    updateTask,
    removeTask,
    toggleTask,
    tasksForDate,
    countCompletedOnDate,
    memberNames,
  };
}
