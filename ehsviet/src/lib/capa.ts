// Hành động khắc phục – phòng ngừa (CAPA) – bước A của PDCA (ISO 14001:2015 / ISO 45001:2018 điều 10.2):
// một danh sách dùng chung cho mọi nguồn (sự cố, kiểm tra định kỳ, thiết bị, QTMTLĐ, đánh giá, vi phạm, phản ánh),
// có đơn vị, người, hạn; sau khi hoàn thành phải kiểm tra xác nhận hiệu lực.
import type { Tone } from '../components/UI'
import { daysUntil } from './utils'

export interface CapaAction {
  id: string
  incident_id: string | null
  source: string
  source_ref: string | null
  source_label: string | null
  kind: string
  action: string
  department: string | null
  owner: string | null
  due_date: string | null
  status: 'open' | 'in_progress' | 'done'
  completed_date: string | null
  root_cause: string | null
  verified_date: string | null
  verified_by: string | null
  effective: boolean | null
  note: string | null
  created_at: string
}

export const CAPA_SOURCE_LABELS: Record<string, string> = {
  su_co: 'Sự cố',
  kiem_tra: 'Kiểm tra định kỳ',
  thiet_bi: 'Thiết bị – sửa chữa',
  qtmtld: 'Quan trắc MTLĐ',
  danh_gia: 'Đánh giá nội bộ / bên ngoài',
  vi_pham: 'Vi phạm nội quy',
  khieu_nai: 'Phản ánh, khiếu nại',
  khac: 'Khác',
}

export const CAPA_KIND_LABELS: Record<string, string> = {
  khac_phuc: 'Khắc phục',
  phong_ngua: 'Phòng ngừa',
  cai_tien: 'Cải tiến',
}

export type CapaState = 'moi' | 'dang_lam' | 'qua_han' | 'cho_xac_nhan' | 'hieu_luc' | 'chua_hieu_luc'

export const CAPA_STATE_LABELS: Record<CapaState, string> = {
  moi: 'Chưa thực hiện',
  dang_lam: 'Đang thực hiện',
  qua_han: 'Quá hạn',
  cho_xac_nhan: 'Chờ xác nhận hiệu lực',
  hieu_luc: 'Đã xác nhận hiệu lực',
  chua_hieu_luc: 'Chưa hiệu lực – làm lại',
}

export const CAPA_STATE_TONE: Record<CapaState, Tone> = {
  moi: 'gray',
  dang_lam: 'blue',
  qua_han: 'red',
  cho_xac_nhan: 'amber',
  hieu_luc: 'green',
  chua_hieu_luc: 'red',
}

export function capaState(a: Pick<CapaAction, 'status' | 'due_date' | 'verified_date' | 'effective'>): CapaState {
  if (a.status === 'done') {
    if (a.verified_date && a.effective === true) return 'hieu_luc'
    if (a.verified_date && a.effective === false) return 'chua_hieu_luc'
    return 'cho_xac_nhan'
  }
  if (a.due_date && daysUntil(a.due_date) < 0) return 'qua_han'
  return a.status === 'in_progress' ? 'dang_lam' : 'moi'
}

/** Hạn mặc định (ngày) khi tạo hành động từ mục không đạt */
export const DEFAULT_CAPA_DAYS = 7

/** Mô tả nguồn của hành động tạo từ một mục không đạt: "<chương trình – kỳ>: <hạng mục>" */
export const capaItemLabel = (prefix: string, itemLabel: string) => `${prefix}: ${itemLabel.slice(0, 120)}`

/** Hành động đã tạo cho mục không đạt `itemLabel` của lượt kiểm tra `runId` */
export const isCapaForItem = (a: Pick<CapaAction, 'source_ref' | 'source_label'>, runId: string, itemLabel: string) =>
  a.source_ref === runId && !!a.source_label && a.source_label.endsWith(': ' + itemLabel.slice(0, 120))
