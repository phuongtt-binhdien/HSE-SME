// Cấu hình backend. Khóa "publishable" (anon) của Supabase được thiết kế để công khai trong trình duyệt;
// an toàn dữ liệu do chính sách RLS và các hàm hse_* trong supabase/migrations quyết định.
export const BACKEND = {
  url: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) || "https://nqknpkjiyztzarctbvqs.supabase.co",
  key: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_KEY) || "sb_publishable_SKnFhmqcOeGu70BFhZ5qLw_GWq2w-QX",
};
/** ?backend=local → chạy bản thử lưu trên trình duyệt (không cần máy chủ), dùng để demo/kiểm thử giao diện. */
export const useLocalBackend = () => { try { return typeof location !== "undefined" && new URLSearchParams(location.search).get("backend") === "local"; } catch { return false; } };
export const fastInduction = () => { try { return new URLSearchParams(location.search).get("fast") === "1"; } catch { return false; } };
