import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true khi đã cấu hình .env — dùng để hiển thị hướng dẫn cài đặt */
export const isConfigured = Boolean(url && key)

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'public-anon-key'
)
