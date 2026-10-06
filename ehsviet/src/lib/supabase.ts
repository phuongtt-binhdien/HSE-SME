import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createDemoClient } from './demo/client'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true khi đã cấu hình .env — dùng để hiển thị hướng dẫn cài đặt */
export const isConfigured = Boolean(url && key)

/** Chưa cấu hình Supabase → chạy bản dùng thử, dữ liệu lưu trong trình duyệt */
export const isDemo = !isConfigured

export const supabase: SupabaseClient = isConfigured
  ? createClient(url!, key!)
  : (createDemoClient() as unknown as SupabaseClient)
