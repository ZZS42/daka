// DaKa — 工时记录数据层（localStorage）

export interface Employee {
  id: string;
  name: string;
  hourlyRate: number;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:mm
  clockOut: string | null; // HH:mm or null (still working)
}

const EMP_KEY = "daka-employees";
const ENTRY_KEY = "daka-entries";

// ── Safe localStorage ────────────────────────────

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Safari private mode or storage full — silently fail
  }
}

// ── Employees ────────────────────────────────────

export function getEmployees(): Employee[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGet(EMP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEmployees(list: Employee[]) {
  safeSet(EMP_KEY, JSON.stringify(list));
}

export function addEmployee(name: string, hourlyRate: number): Employee {
  const list = getEmployees();
  const emp: Employee = { id: `emp-${Date.now()}`, name, hourlyRate };
  list.push(emp);
  saveEmployees(list);
  return emp;
}

export function updateEmployee(
  id: string,
  updates: Partial<Pick<Employee, "name" | "hourlyRate">>,
) {
  const list = getEmployees().map((e) =>
    e.id === id ? { ...e, ...updates } : e,
  );
  saveEmployees(list);
}

export function deleteEmployee(id: string) {
  saveEmployees(getEmployees().filter((e) => e.id !== id));
  // cascade delete entries
  saveEntries(getEntries().filter((e) => e.employeeId !== id));
}

// ── Time Entries ─────────────────────────────────

export function getEntries(): TimeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeGet(ENTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(list: TimeEntry[]) {
  safeSet(ENTRY_KEY, JSON.stringify(list));
}

export function clockIn(employeeId: string): TimeEntry | null {
  const list = getEntries();
  // Guard: prevent duplicate open entries
  const hasOpen = list.some(
    (e) => e.employeeId === employeeId && e.clockOut === null,
  );
  if (hasOpen) return null;

  const now = new Date();
  const entry: TimeEntry = {
    id: `t-${Date.now()}`,
    employeeId,
    date: fmtDate(now),
    clockIn: fmtTime(now),
    clockOut: null,
  };
  list.push(entry);
  saveEntries(list);
  return entry;
}

export function clockOut(entryId: string) {
  const list = getEntries().map((e) =>
    e.id === entryId ? { ...e, clockOut: fmtTime(new Date()) } : e,
  );
  saveEntries(list);
}

export function updateEntry(
  entryId: string,
  updates: { clockIn?: string; clockOut?: string | null },
) {
  const list = getEntries().map((e) =>
    e.id === entryId ? { ...e, ...updates } : e,
  );
  saveEntries(list);
}

// ── Queries ──────────────────────────────────────

export function todayEntries(employeeId: string): TimeEntry[] {
  const today = fmtDate(new Date());
  return getEntries().filter(
    (e) => e.employeeId === employeeId && e.date === today,
  );
}

export function entriesInRange(start: string, end: string): TimeEntry[] {
  return getEntries().filter((e) => e.date >= start && e.date <= end);
}

// ── Calculation ──────────────────────────────────

export function calcHours(entry: TimeEntry): number {
  const [inH, inM] = entry.clockIn.split(":").map(Number);
  const startMin = inH * 60 + inM;

  if (!entry.clockOut) {
    // Live calculation — handle cross-day
    const now = new Date();
    const today = fmtDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (entry.date === today) {
      return Math.max(0, (nowMin - startMin) / 60);
    }
    // Cross-day: clockIn→midnight + full days + midnight→now
    const entryDate = new Date(entry.date + "T00:00:00");
    const todayDate = new Date(today + "T00:00:00");
    const fullDays = Math.max(
      0,
      Math.floor((todayDate.getTime() - entryDate.getTime()) / 86_400_000) - 1,
    );
    return (24 * 60 - startMin + fullDays * 24 * 60 + nowMin) / 60;
  }

  // Completed entry — handle cross-midnight shift (e.g. 23:00→02:00)
  const [outH, outM] = entry.clockOut.split(":").map(Number);
  let diff = outH * 60 + outM - startMin;
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

export function totalHoursForEmployee(
  employeeId: string,
  start: string,
  end: string,
): number {
  return entriesInRange(start, end)
    .filter((e) => e.employeeId === employeeId && e.clockOut !== null)
    .reduce((sum, e) => sum + calcHours(e), 0);
}

// ── Display ──────────────────────────────────────

export function fmtHours(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h${mins}m`;
}

// ── Date Helpers ─────────────────────────────────

export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function weekRange(): [string, string] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return [fmtDate(mon), fmtDate(sun)];
}

export function monthRange(): [string, string] {
  const now = new Date();
  return [
    fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  ];
}

export function lastMonthRange(): [string, string] {
  const now = new Date();
  return [
    fmtDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    fmtDate(new Date(now.getFullYear(), now.getMonth(), 0)),
  ];
}
