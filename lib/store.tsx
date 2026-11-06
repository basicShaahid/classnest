"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Lesson, LessonInput } from "@/lib/types";
import { durationMinutes, isValidLocalDate } from "@/lib/utils";

const STORAGE_KEY = "classnest:data:v1";
const EXAMPLE_LESSON: Lesson = {
  id: "welcome-example-2026-10-29",
  date: "2026-10-29",
  topic: "Week 1 tutorial, including exam style",
  startTime: "12:00",
  endTime: "14:00",
  hourlyRate: 50,
  paid: false,
  createdAt: "2026-10-29T00:00:00.000Z",
  updatedAt: "2026-10-29T00:00:00.000Z",
};

type PersistedData = { lessons: Lesson[]; defaultRate: number };

type Store = PersistedData & {
  ready: boolean;
  addLesson: (input: LessonInput) => void;
  editLesson: (id: string, input: LessonInput) => void;
  removeLesson: (id: string) => void;
  togglePaid: (id: string) => void;
  setDefaultRate: (value: number) => void;
  notify: (message: string) => void;
  toast: string | null;
};

const StoreContext = createContext<Store | null>(null);

function isValidLesson(item: unknown): item is Lesson {
  if (!item || typeof item !== "object") return false;
  const lesson = item as Partial<Lesson>;
  return typeof lesson.id === "string" && typeof lesson.topic === "string" &&
    typeof lesson.date === "string" && isValidLocalDate(lesson.date) &&
    typeof lesson.startTime === "string" && typeof lesson.endTime === "string" &&
    durationMinutes(lesson.startTime, lesson.endTime) > 0 &&
    typeof lesson.hourlyRate === "number" && Number.isFinite(lesson.hourlyRate) && lesson.hourlyRate >= 0 &&
    typeof lesson.paid === "boolean" &&
    typeof lesson.createdAt === "string" && typeof lesson.updatedAt === "string";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lessons, setLessons] = useState<Lesson[]>([EXAMPLE_LESSON]);
  const [defaultRate, setDefaultRateState] = useState(50);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // A missing key means the first visit. An explicitly saved empty array stays empty.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const stored: unknown = JSON.parse(raw);
        if (stored && typeof stored === "object") {
          const data = stored as Partial<PersistedData>;
          if (Array.isArray(data.lessons)) setLessons(data.lessons.filter(isValidLesson));
          if (typeof data.defaultRate === "number" && Number.isFinite(data.defaultRate) && data.defaultRate >= 0)
            setDefaultRateState(data.defaultRate);
        }
      }
    } catch (error) {
      console.warn("Could not read saved lessons:", error);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lessons, defaultRate }));
    } catch (error) {
      console.warn("Could not save lessons:", error);
    }
  }, [lessons, defaultRate, ready]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const data: PersistedData = JSON.parse(event.newValue);
        if (Array.isArray(data.lessons)) setLessons(data.lessons.filter(isValidLesson));
        if (typeof data.defaultRate === "number" && Number.isFinite(data.defaultRate)) setDefaultRateState(data.defaultRate);
      } catch { /* Ignore invalid writes from other tabs. */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const notify = useCallback((message: string) => setToast(message), []);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const addLesson = useCallback((input: LessonInput) => {
    const timestamp = new Date().toISOString();
    setLessons((prev) => [{ ...input, id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp }, ...prev]);
  }, []);
  const editLesson = useCallback((id: string, input: LessonInput) => {
    setLessons((prev) => prev.map((lesson) => lesson.id === id ? { ...lesson, ...input, updatedAt: new Date().toISOString() } : lesson));
  }, []);
  const removeLesson = useCallback((id: string) => {
    setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
  }, []);
  const togglePaid = useCallback((id: string) => {
    setLessons((prev) => prev.map((lesson) => lesson.id === id ? { ...lesson, paid: !lesson.paid, updatedAt: new Date().toISOString() } : lesson));
  }, []);
  const setDefaultRate = useCallback((value: number) => {
    if (Number.isFinite(value) && value >= 0) setDefaultRateState(value);
  }, []);

  const value = useMemo<Store>(() => ({
    lessons, defaultRate, ready, addLesson, editLesson, removeLesson,
    togglePaid, setDefaultRate, notify, toast,
  }), [lessons, defaultRate, ready, addLesson, editLesson, removeLesson, togglePaid, setDefaultRate, notify, toast]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
