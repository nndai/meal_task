"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

const fullscreenBurstVectors = [
  { x: -560, y: -380, delay: 0 },
  { x: -430, y: -280, delay: 0.02 },
  { x: -280, y: -420, delay: 0.04 },
  { x: -480, y: -90, delay: 0.06 },
  { x: -320, y: 220, delay: 0.1 },
  { x: 210, y: -450, delay: 0.03 },
  { x: 330, y: -330, delay: 0.05 },
  { x: 520, y: -120, delay: 0.09 },
  { x: 420, y: 140, delay: 0.12 },
  { x: 260, y: 320, delay: 0.15 },
  { x: -120, y: 400, delay: 0.17 },
  { x: 620, y: 220, delay: 0.14 },
];

type RisingFloodIcon = {
  icon: "❤" | "✿" | "★" | "💗";
  left: number;
  bottom: number;
  driftX: number;
  driftY: number;
  delay: number;
  duration: number;
  size: number;
  rotatePeak: number;
  rotateEnd: number;
};

function createSeededRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildRisingFloodIcons(
  seed: number,
  rows: number,
  colsPerRow: number,
  sizeBase: number,
  sizeRange: number,
  isMobile: boolean,
  viewportWidth: number,
): RisingFloodIcon[] {
  const rand = createSeededRandom(seed || Date.now());
  const symbols: RisingFloodIcon["icon"][] = ["❤", "✿", "★", "💗"];
  const result: RisingFloodIcon[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < colsPerRow; col += 1) {
      const laneProgress = colsPerRow <= 1 ? 0.5 : col / (colsPerRow - 1);
      const driftX = (rand() - 0.5) * 280;
      const driftY = -1100 - rand() * 420;
      const duration = 1.9 + rand() * 0.85;
      const delay = row * 0.08 + col * 0.03 + rand() * 0.04;
      const size = sizeBase + rand() * sizeRange;
      const safePaddingPercent = viewportWidth > 0 ? clamp(((size * 0.56 + 6) / viewportWidth) * 100, 8, 28) : isMobile ? 18 : 2;
      const minLeft = isMobile ? safePaddingPercent : 2;
      const maxLeft = isMobile ? 100 - safePaddingPercent : 98;
      const laneLeft = minLeft + laneProgress * (maxLeft - minLeft);
      const randomSpread = isMobile ? 4.5 : 12;
      const left = clamp(laneLeft + (rand() - 0.5) * randomSpread, minLeft, maxLeft);
      const rotatePeak = driftX >= 0 ? 10 + rand() * 20 : -(10 + rand() * 20);
      const rotateEnd = rotatePeak * 0.65;

      result.push({
        icon: symbols[(row + col) % symbols.length],
        left,
        bottom: -130 - row * 70 - rand() * 22,
        driftX,
        driftY,
        delay,
        duration,
        size,
        rotatePeak,
        rotateEnd,
      });
    }
  }

  return result;
}

export default function HomePage() {
  const board = useHouseholdBoard();
  const today = useMemo(() => toDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [poppedTaskId, setPoppedTaskId] = useState<string | null>(null);
  const [burstTaskId, setBurstTaskId] = useState<string | null>(null);
  const [burstOrigin, setBurstOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [burstSeed, setBurstSeed] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(390);
  const [thanksMessage, setThanksMessage] = useState<{ id: number; text: string } | null>(null);
  const selectedDateKey = toDateKey(selectedDate);

  const isPast = selectedDateKey < today;
  const isToday = selectedDateKey === today;
  const burstVectors = useMemo(() => (isMobile ? fullscreenBurstVectors.slice(0, 4) : fullscreenBurstVectors), [isMobile]);
  const floodBurstIcons = useMemo(
    () => buildRisingFloodIcons(burstSeed, isMobile ? 2 : 3, isMobile ? 2 : 5, isMobile ? 84 : 72, isMobile ? 34 : 46, isMobile, viewportWidth),
    [burstSeed, isMobile, viewportWidth],
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const updateViewport = () => {
      setIsMobile(media.matches);
      setViewportWidth(window.innerWidth);
    };

    updateViewport();
    media.addEventListener("change", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      media.removeEventListener("change", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  const tasksForDate = useMemo(() => {
    return board.tasksForDate(selectedDateKey);
  }, [board, selectedDateKey]);

  const dynamicTitle = isToday ? "Nhiệm vụ hôm nay" : `Nhiệm vụ ngày ${formatDateLabel(selectedDateKey)}`;
  const participantCount = board.countParticipantsOnDate(selectedDateKey);

  function triggerTaskCelebration(taskId: string, originX: number, originY: number) {
    setPoppedTaskId(taskId);
    setBurstTaskId(taskId);
    setBurstOrigin({ x: originX, y: originY });
    setBurstSeed(Date.now());

    window.setTimeout(() => {
      setPoppedTaskId((current) => (current === taskId ? null : current));
    }, 520);

    window.setTimeout(() => {
      setBurstTaskId((current) => (current === taskId ? null : current));
    }, 1700);
  }

  function showThanksMessage(taskTitle: string) {
    const id = Date.now();
    const memberName = board.currentMember?.name ?? "bạn";
    setThanksMessage({
      id,
      text: `Cảm ơn bạn ${memberName} đã chọn vào ${taskTitle} nhé`,
    });

    window.setTimeout(() => {
      setThanksMessage((current) => (current?.id === id ? null : current));
    }, 1800);
  }

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
                <div className="rounded-xl border border-pink-200 bg-white p-2 shadow-xl">
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
        <div className="mb-4 rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm font-medium text-pink-800">
          Ngày trong quá khứ, không thay đổi dữ liệu!
        </div>
      )}
      <div className="mb-4 rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm font-medium text-rose-700">
        Số lượng: <span className="font-bold">{participantCount}</span> người
      </div>
      <div className="grid gap-5">
        {tasksForDate.map((task) => {
          const members = board.memberNames(task.id, selectedDateKey);
          const checkedByMe = Boolean(board.currentMember && task.completedBy.includes(board.currentMember.id));
          const canToggle = Boolean(board.currentMember) && !isPast;

          return (
            <motion.button
              key={task.id}
              type="button"
              onClick={(event) => {
                if (!canToggle) {
                  return;
                }

                const willCheck = !checkedByMe;

                const rect = event.currentTarget.getBoundingClientRect();
                const originX = rect.left + rect.width * 0.5;
                const originY = rect.top + Math.min(56, rect.height * 0.5);
                if (willCheck) {
                  triggerTaskCelebration(task.id, originX, originY);
                  showThanksMessage(task.title);
                }

                void board.toggleTask(task.id, selectedDateKey);
              }}
              disabled={!canToggle}
              whileTap={{ scale: canToggle ? 0.985 : 1 }}
              className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left shadow-sm transition md:p-6 ${
                checkedByMe ? "border-pink-400 bg-pink-50" : "border-pink-200 bg-white"
              } ${poppedTaskId === task.id ? "ring-2 ring-pink-300/70" : ""}`}
              animate={poppedTaskId === task.id ? { scale: [1, 1.025, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="flex w-full flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      checkedByMe ? "border-pink-600 bg-pink-600 text-white" : "border-pink-300 bg-white text-transparent group-hover:border-pink-500"
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <h3 className="font-headline sm:text-xl text-lg font-bold text-rose-950">{task.title}</h3>
                  </div>
                </div>

                <div className={`flex items-center ${members.length >= 3 ? "gap-0" : "gap-2"}`}>
                  {members.length === 0 && (
                    <span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-rose-600">Chưa có ai tick</span>
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
            </motion.button>
          );
        })}

        {tasksForDate.length === 0 && (
          <article className="rounded-2xl border border-pink-200 bg-white p-6 text-sm text-rose-700 shadow-sm">
            Không có nhiệm vụ nào cho ngày {formatDateLabel(selectedDateKey)}.
          </article>
        )}
      </div>

      <AnimatePresence>
        {thanksMessage ? (
          <motion.div
            key={thanksMessage.id}
            className="pointer-events-none fixed inset-x-0 top-24 z-60 flex justify-center px-4"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: -4, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="max-w-2xl rounded-full border border-pink-200 bg-white/95 px-6 py-3 text-center text-sm font-semibold text-pink-700 shadow-lg shadow-pink-300/35 backdrop-blur-sm sm:text-base">
              {thanksMessage.text}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {burstTaskId ? (
          <motion.div key={`screen-burst-${burstSeed}`} className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {floodBurstIcons.map((item, index) => (
              <motion.span
                key={`rise-${index}-${item.left}-${item.delay}`}
                className="absolute text-pink-500/80 drop-shadow-[0_8px_14px_rgba(236,72,153,0.35)]"
                style={{ left: `${item.left}%`, marginLeft: `${item.size * -0.5}px`, bottom: item.bottom, fontSize: item.size }}
                initial={{ opacity: 0, y: 0, x: 0, rotate: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 0.95, 0],
                  y: item.driftY,
                  x: item.driftX,
                  rotate: [0, item.rotatePeak, item.rotateEnd],
                  scale: [0.5, 1.2, 1],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: item.duration, ease: "easeOut", delay: item.delay }}
              >
                {item.icon}
              </motion.span>
            ))}

            {burstVectors.map((vector, index) => (
              <motion.span
                key={`${vector.x}-${vector.y}-${index}`}
                className="absolute text-pink-500"
                style={{ left: burstOrigin.x, top: burstOrigin.y }}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.35, rotate: -12 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: vector.x,
                  y: vector.y,
                  scale: [0.35, 1.65, 1],
                  rotate: [0, 18, -14],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: vector.delay }}
              >
                {index % 3 === 0 ? "❤" : index % 3 === 1 ? "✿" : "❀"}
              </motion.span>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AppShell>
  );
}
