// Dữ liệu dùng chung của phân hệ Thiết bị & bảo trì
import { useMemo } from 'react'
import { useList } from '../../hooks/useCrud'
import { isOpenWo, liveStatus, type Equipment, type EquipmentInspection, type WorkOrder } from '../../lib/equipment'
import { supabase } from '../../lib/supabase'

export function useEquipmentData(fid: string) {
  const on = !!fid
  const equipment = useList<Equipment>('equipment', { match: { facility_id: fid }, order: 'code', ascending: true, enabled: on })
  const orders = useList<WorkOrder>('equipment_work_orders', { match: { facility_id: fid }, order: 'report_date', ascending: false, enabled: on })
  const inspections = useList<EquipmentInspection>('equipment_inspections', {
    match: { facility_id: fid },
    order: 'inspection_date',
    ascending: false,
    enabled: on,
  })
  const list = equipment.data ?? []
  const wos = orders.data ?? []

  const byId = useMemo(() => new Map(list.map((e) => [e.id, e])), [list])
  const openBy = useMemo(() => {
    const m = new Map<string, WorkOrder[]>()
    for (const w of wos) {
      if (!isOpenWo(w)) continue
      const arr = m.get(w.equipment_id)
      if (arr) arr.push(w)
      else m.set(w.equipment_id, [w])
    }
    return m
  }, [wos])
  const status = useMemo(() => new Map(list.map((e) => [e.id, liveStatus(e, openBy.get(e.id) ?? [])])), [list, openBy])
  const departments = useMemo(
    () => [...new Set(list.map((e) => e.department).filter((d): d is string => !!d))].sort((a, b) => a.localeCompare(b, 'vi')),
    [list]
  )

  return {
    equipment: list,
    workOrders: wos,
    inspections: inspections.data ?? [],
    byId,
    openBy,
    status,
    departments,
    loading: equipment.isLoading || orders.isLoading || inspections.isLoading,
    error: equipment.error || orders.error || inspections.error,
  }
}

export type EquipmentData = ReturnType<typeof useEquipmentData>

/** Cập nhật trạng thái thiết bị theo các phiếu sửa chữa (thanh lý / đang hỏng / đang sửa / chờ nghiệm thu / vận hành) */
export async function syncEquipmentStatus(equipmentId: string) {
  const [{ data: eq, error: e1 }, { data: wos, error: e2 }] = await Promise.all([
    supabase.from('equipment').select('id, status').eq('id', equipmentId).maybeSingle(),
    supabase.from('equipment_work_orders').select('status').eq('equipment_id', equipmentId),
  ])
  if (e1) throw e1
  if (e2) throw e2
  if (!eq) return
  const list = (wos ?? []) as Pick<WorkOrder, 'status'>[]
  let next: string
  if (list.some((w) => w.status === 'thanh_ly')) next = 'thanh_ly'
  else if ((eq as any).status === 'ngung' || ((eq as any).status === 'thanh_ly' && list.length === 0)) next = (eq as any).status
  else if (list.some((w) => w.status === 'moi')) next = 'hu_hong'
  else if (list.some((w) => w.status === 'dang_sua')) next = 'sua_chua'
  else if (list.some((w) => w.status === 'cho_nghiem_thu')) next = 'cho_nghiem_thu'
  else next = 'van_hanh'
  if (next !== (eq as any).status) {
    const { error } = await supabase.from('equipment').update({ status: next }).eq('id', equipmentId)
    if (error) throw error
  }
}
