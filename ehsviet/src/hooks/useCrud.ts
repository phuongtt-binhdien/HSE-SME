import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

type Match = Record<string, string | number | boolean>

interface ListOpts {
  select?: string
  match?: Match
  order?: string
  ascending?: boolean
  enabled?: boolean
}

/** Đọc danh sách bản ghi có lọc/sắp xếp; RLS tự giới hạn theo tổ chức. */
export function useList<T = any>(table: string, opts?: ListOpts) {
  return useQuery<T[]>({
    queryKey: [table, opts?.match ?? null, opts?.select ?? '*', opts?.order ?? null],
    enabled: opts?.enabled ?? true,
    queryFn: async () => {
      let q = supabase.from(table).select(opts?.select ?? '*')
      if (opts?.match) {
        for (const [k, v] of Object.entries(opts.match)) q = q.eq(k, v)
      }
      const { data, error } = await q.order(opts?.order ?? 'created_at', {
        ascending: opts?.ascending ?? false,
      })
      if (error) throw error
      return (data ?? []) as T[]
    },
  })
}

/** Tạo mới (không có id) hoặc cập nhật (có id) một bản ghi. */
export function useSave(table: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { id, ...rest } = values
      const query = id
        ? supabase.from(table).update(rest).eq('id', id).select()
        : supabase.from(table).insert(rest).select()
      const { data, error } = await query
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries(),
  })
}

/** Xóa bản ghi theo id. */
export function useRemove(table: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries(),
  })
}
