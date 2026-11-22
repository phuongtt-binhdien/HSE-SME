// Cấu hình backend. Khóa "publishable" (anon) của Supabase được thiết kế để công khai trong trình duyệt;
// an toàn dữ liệu do chính sách RLS và các hàm hse_* trong supabase/migrations quyết định.
export const BACKEND = {
  url: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) || "https://nqknpkjiyztzarctbvqs.supabase.co",
  key: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_KEY) || "sb_publishable_SKnFhmqcOeGu70BFhZ5qLw_GWq2w-QX",
};
/** ?backend=local → chạy bản thử lưu trên trình duyệt (không cần máy chủ), dùng để demo/kiểm thử giao diện. */
/** ?demo=1 hoặc mở trực tiếp tệp .html (file://) → bản DEMO: vào thẳng không cần đăng nhập, có sẵn 500 credit, dữ liệu chỉ lưu trên trình duyệt. */
export const isDemo = () => { try { return typeof location !== "undefined" && (new URLSearchParams(location.search).get("demo") === "1" || location.protocol === "file:"); } catch { return false; } };
export const useLocalBackend = () => { try { return isDemo() || (typeof location !== "undefined" && new URLSearchParams(location.search).get("backend") === "local"); } catch { return false; } };
export const fastInduction = () => { try { return new URLSearchParams(location.search).get("fast") === "1"; } catch { return false; } };
