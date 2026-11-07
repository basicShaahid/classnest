"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { Lesson, LessonInput } from "@/lib/types";
import { durationMinutes, isValidLocalDate } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";

const STORAGE_KEY = "classnest:data:v1";
type PersistedData = { lessons: Lesson[]; defaultRate: number };
type Store = PersistedData & {
  ready: boolean;
  configured: boolean;
  userEmail: string | null;
  busy: boolean;
  localCount: number;
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
  importLocal: () => Promise<void>;
  addLesson: (input: LessonInput) => Promise<void>;
  editLesson: (id: string, input: LessonInput) => Promise<void>;
  removeLesson: (id: string) => Promise<void>;
  togglePaid: (id: string) => Promise<void>;
  setDefaultRate: (value: number) => Promise<void>;
  notify: (message: string) => void;
  toast: string | null;
};
const StoreContext = createContext<Store | null>(null);

function isValidLesson(item: unknown): item is Lesson {
  if (!item || typeof item !== "object") return false;
  const x = item as Partial<Lesson>;
  return typeof x.id === "string" && typeof x.topic === "string" &&
    typeof x.date === "string" && isValidLocalDate(x.date) &&
    typeof x.startTime === "string" && typeof x.endTime === "string" &&
    durationMinutes(x.startTime, x.endTime) > 0 &&
    typeof x.hourlyRate === "number" && Number.isFinite(x.hourlyRate) && x.hourlyRate >= 0 &&
    typeof x.paid === "boolean" && typeof x.createdAt === "string" && typeof x.updatedAt === "string";
}

function localBackup(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const obj = data as Partial<PersistedData>;
    return {
      lessons: Array.isArray(obj.lessons) ? obj.lessons.filter(isValidLesson) : [],
      defaultRate: typeof obj.defaultRate === "number" && Number.isFinite(obj.defaultRate) && obj.defaultRate >= 0 ? obj.defaultRate : 50,
    };
  } catch {
    return null;
  }
}

type DbLesson = {
  user_id: string; id: string; date: string; topic: string;
  start_time: string; end_time: string; hourly_rate: number; paid: boolean;
  created_at: string; updated_at: string;
};
const fromDb = (d: DbLesson): Lesson => ({
  id: d.id, date: d.date, topic: d.topic, startTime: d.start_time,
  endTime: d.end_time, hourlyRate: Number(d.hourly_rate), paid: d.paid,
  createdAt: d.created_at, updatedAt: d.updated_at,
});
const toDb = (l: Lesson, uid: string): DbLesson => ({
  user_id: uid, id: l.id, date: l.date, topic: l.topic,
  start_time: l.startTime, end_time: l.endTime, hourly_rate: l.hourlyRate,
  paid: l.paid, created_at: l.createdAt, updated_at: l.updatedAt,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabase(), []);
  const [user, setUser] = useState<User | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [defaultRate, setDefaultRateState] = useState(50);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const notify = useCallback((message: string) => setToast(message), []);

  const loadCloud = useCallback(async (uid: string) => {
    if (!supabase) return;
    const [records, settings] = await Promise.all([
      supabase.from("lessons").select("*").eq("user_id", uid),
      supabase.from("preferences").select("default_rate").eq("user_id", uid).maybeSingle(),
    ]);
    if (records.error) throw records.error;
    if (settings.error) throw settings.error;
    setLessons(((records.data ?? []) as DbLesson[]).map(fromDb));
    setDefaultRateState(settings.data ? Number(settings.data.default_rate) : 50);
  }, [supabase]);

  useEffect(() => {
    setLocalCount(localBackup()?.lessons.length ?? 0);
  }, []);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
    });
    void supabase.auth.getUser().then(({ data, error }) => {
      if (active && !error) setUser(data.user);
      if (active && error) notify(error.message);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [supabase, notify]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    if (!user) {
      setLessons([]);
      setDefaultRateState(50);
      setReady(true);
      return;
    }
    setReady(false);
    void loadCloud(user.id).catch((error: unknown) => {
      notify("Could not load cloud data: " + String(error instanceof Error ? error.message : error));
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [user?.id, supabase, loadCloud, notify]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || !supabase) return;
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void loadCloud(user.id).catch(() => notify("Cloud refresh failed."));
      }
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [user?.id, supabase, loadCloud, notify]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function signIn(email: string, password: string) {
    if (!supabase) throw Error("Supabase is not configured.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return "Signed in.";
  }
  async function signUp(email: string, password: string) {
    if (!supabase) throw Error("Supabase is not configured.");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.session ? "Account created and signed in." : "Check your email to confirm your account, then sign in.";
  }
  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setLessons([]);
  }

  async function mutate<T>(operation: () => Promise<{ error: { message: string } | null }>, change: () => T, rollback: (snapshot: T) => void) {
    if (!user || !supabase) throw Error("Sign in to save your records.");
    setBusy(true);
    const snapshot = change();
    try {
      const result = await operation();
      if (result.error) throw Error(result.error.message);
    } catch (error) {
      rollback(snapshot);
      notify("Cloud save failed. Please retry.");
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function addLesson(input: LessonInput) {
    if (!user || !supabase) throw Error("Sign in first.");
    const now = new Date().toISOString();
    const lesson: Lesson = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    await mutate(
      async () => supabase.from("lessons").insert(toDb(lesson, user.id)),
      () => { setLessons(v => [lesson, ...v]); return lesson.id; },
      () => setLessons(v => v.filter(x => x.id !== lesson.id))
    );
  }
  async function editLesson(id: string, input: LessonInput) {
    if (!user || !supabase) throw Error("Sign in first.");
    const old = lessons.find(l => l.id === id);
    if (!old) throw Error("Class not found.");
    const updated = { ...old, ...input, updatedAt: new Date().toISOString() };
    await mutate(
      async () => supabase.from("lessons").update(toDb(updated, user.id)).eq("user_id", user.id).eq("id", id),
      () => { setLessons(v => v.map(x => x.id === id ? updated : x)); return old; },
      snapshot => setLessons(v => v.map(x => x.id === id ? snapshot : x))
    );
  }
  async function removeLesson(id: string) {
    if (!user || !supabase) throw Error("Sign in first.");
    const previous = lessons;
    await mutate(
      async () => supabase.from("lessons").delete().eq("user_id", user.id).eq("id", id),
      () => { setLessons(v => v.filter(x => x.id !== id)); return previous; },
      snapshot => setLessons(snapshot)
    );
  }
  async function togglePaid(id: string) {
    const old = lessons.find(x => x.id === id);
    if (!old) throw Error("Class not found.");
    await editLesson(id, { date: old.date, topic: old.topic, startTime: old.startTime, endTime: old.endTime, hourlyRate: old.hourlyRate, paid: !old.paid });
  }
  async function setDefaultRate(value: number) {
    if (!user || !supabase) throw Error("Sign in first.");
    if (!Number.isFinite(value) || value < 0) throw Error("Invalid hourly rate.");
    const old = defaultRate;
    await mutate(
      async () => supabase.from("preferences").upsert({ user_id: user.id, default_rate: value }, { onConflict: "user_id" }),
      () => { setDefaultRateState(value); return old; },
      setDefaultRateState
    );
  }
  async function importLocal() {
    if (!user || !supabase) throw Error("Sign in first.");
    const backup = localBackup();
    if (!backup || !backup.lessons.length) { notify("No browser records to import."); return; }
    setBusy(true);
    try {
      // Import only missing IDs; do not overwrite newer cloud edits or existing payment states.
      const { data: current, error: readError } = await supabase.from("lessons").select("id").eq("user_id", user.id);
      if (readError) throw readError;
      const existingIds = new Set((current ?? []).map(x => x.id));
      const missing = backup.lessons.filter(x => !existingIds.has(x.id));
      if (missing.length) {
        const { error } = await supabase.from("lessons").insert(missing.map(x => toDb(x, user.id)));
        if (error) throw error;
      }
      const { data: pref } = await supabase.from("preferences").select("user_id").eq("user_id", user.id).maybeSingle();
      if (!pref) {
        const { error } = await supabase.from("preferences").upsert({ user_id: user.id, default_rate: backup.defaultRate });
        if (error) throw error;
      }
      await loadCloud(user.id);
      notify(missing.length + " browser classes imported. Local backup kept.");
    } finally { setBusy(false); }
  }

  const value: Store = {
    lessons, defaultRate, ready, configured: !!supabase, userEmail: user?.email ?? null,
    busy, localCount, signIn, signUp, signOut, importLocal,
    addLesson, editLesson, removeLesson, togglePaid, setDefaultRate, notify, toast,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
