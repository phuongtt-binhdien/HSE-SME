/** Tính hạn soát xét tài liệu nội bộ. */
export type Due = "overdue" | "soon" | "ok" | "none";
export function daysUntil(iso: string | undefined, today: Date = new Date()): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const t0 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - t0) / 86400000);
}
export function reviewState(iso: string | undefined, today: Date = new Date(), soonDays = 60): Due {
  const n = daysUntil(iso, today);
  return n == null ? "none" : n < 0 ? "overdue" : n <= soonDays ? "soon" : "ok";
}
export function matches(text: string, q: string): boolean {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d");
  return !q.trim() || q.split(/\s+/).every(w => norm(text).includes(norm(w)));
}
