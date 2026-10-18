// Biểu mẫu khai báo hóa chất và ghi nhập – xuất – điều chỉnh – thải bỏ
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, ErrorNote, Field, Input, Modal, Note, Select, Textarea } from '../../components/UI'
import {
  CONTROLLED_GROUPS,
  HAZARD_CLASS_LABELS,
  LEGAL_GROUP_LABELS,
  TXN_KIND_LABELS,
  USE_AREA_LABELS,
  type Chemical,
  type StockInfo,
} from '../../lib/chemicals'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtNum, todayISO } from '../../lib/utils'

/** Hóa chất ghi trong nhật ký vận hành HTXLNT (Vận hành & Quan trắc) */
export const LOG_KEYS = ['PAC', 'Polymer', 'Chlorine']

const num = (v: any) => (v === '' || v == null ? null : Number(v))

export function ChemicalModal({ form, setForm, base, onClose }: { form: any; setForm: (f: any) => void; base: Record<string, string>; onClose: () => void }) {
  const qc = useQueryClient()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!form) return null
  const hz: string[] = form.hazard_classes ?? []

  const submit = async () => {
    setErr('')
    if (!form.name?.trim()) return setErr('Nhập tên hóa chất.')
    if (form.min_stock !== '' && form.max_stock !== '' && form.min_stock != null && form.max_stock != null && Number(form.min_stock) > Number(form.max_stock))
      return setErr('Tồn tối thiểu lớn hơn lượng tồn trữ tối đa.')
    setBusy(true)
    try {
      const payload = {
        code: form.code?.trim() || null,
        name: form.name.trim(),
        cas_no: form.cas_no?.trim() || null,
        formula: form.formula?.trim() || null,
        supplier: form.supplier?.trim() || null,
        storage_location: form.storage_location?.trim() || null,
        quantity: num(form.quantity),
        unit: form.unit?.trim() || 'kg',
        hazard_classes: hz,
        legal_group: form.legal_group || 'thong_thuong',
        use_area: form.use_area || 'san_xuat',
        min_stock: num(form.min_stock),
        max_stock: num(form.max_stock),
        pathh_available: !!form.pathh_available,
        pathh_url: form.pathh_url?.trim() || null,
        sds_date: form.sds_date || null,
        expiry_date: form.expiry_date || null,
        log_key: form.log_key || null,
        active: form.active !== false,
        note: form.note?.trim() || null,
      }
      const { error } = form.id ? await supabase.from('chemicals').update(payload).eq('id', form.id) : await supabase.from('chemicals').insert({ ...base, ...payload })
      if (error) throw error
      await qc.invalidateQueries()
      onClose()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={!!form}
      onClose={onClose}
      title={form.id ? 'Sửa hóa chất' : 'Khai báo hóa chất'}
      wide
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={busy}>
            Lưu
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Mã">
            <Input value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="HC-PTN-01" />
          </Field>
          <Field label="Tên hóa chất" required className="sm:col-span-3">
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Số CAS">
            <Input value={form.cas_no ?? ''} onChange={(e) => setForm({ ...form, cas_no: e.target.value })} placeholder="7664-93-9" />
          </Field>
          <Field label="Công thức / thành phần">
            <Input value={form.formula ?? ''} onChange={(e) => setForm({ ...form, formula: e.target.value })} />
          </Field>
          <Field label="Nhà cung cấp">
            <Input value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Nhóm theo Luật Hóa chất">
            <Select value={form.legal_group ?? 'thong_thuong'} onChange={(e) => setForm({ ...form, legal_group: e.target.value })}>
              {Object.entries(LEGAL_GROUP_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Khu vực sử dụng">
            <Select value={form.use_area ?? 'san_xuat'} onChange={(e) => setForm({ ...form, use_area: e.target.value })}>
              {Object.entries(USE_AREA_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nơi bảo quản">
            <Input value={form.storage_location ?? ''} onChange={(e) => setForm({ ...form, storage_location: e.target.value })} />
          </Field>
        </div>
        <Field label="Phân loại nguy hại (GHS)">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg border border-pine-800/15 p-2.5">
            {Object.entries(HAZARD_CLASS_LABELS).map(([k, v]) => (
              <label key={k} className="flex items-center gap-1.5 text-sm text-pine-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-viridian-600"
                  checked={hz.includes(k)}
                  onChange={(e) => setForm({ ...form, hazard_classes: e.target.checked ? [...hz, k] : hz.filter((x) => x !== k) })}
                />
                {v}
              </label>
            ))}
          </div>
        </Field>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label={form.id ? 'Tồn đầu (khi khai báo)' : 'Tồn hiện có'}>
            <Input type="number" step="any" value={form.quantity ?? ''} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </Field>
          <Field label="Đơn vị">
            <Input value={form.unit ?? 'kg'} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg, L, chai" />
          </Field>
          <Field label="Tồn tối thiểu (đặt mua)">
            <Input type="number" min={0} step="any" value={form.min_stock ?? ''} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
          </Field>
          <Field label="Tồn trữ tối đa tại khu vực">
            <Input type="number" min={0} step="any" value={form.max_stock ?? ''} onChange={(e) => setForm({ ...form, max_stock: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Hạn sử dụng">
            <Input type="date" value={form.expiry_date ?? ''} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </Field>
          <Field label="Tự trừ tồn theo nhật ký HTXLNT">
            <Select value={form.log_key ?? ''} onChange={(e) => setForm({ ...form, log_key: e.target.value })}>
              <option value="">Không</option>
              {LOG_KEYS.map((k) => (
                <option key={k} value={k}>
                  Cột "{k}" trong nhật ký vận hành
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 pt-6 text-sm text-pine-800">
            <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Đang sử dụng
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 pt-6 text-sm text-pine-800">
            <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={!!form.pathh_available} onChange={(e) => setForm({ ...form, pathh_available: e.target.checked })} />
            Có Phiếu an toàn hóa chất (PATHH) tiếng Việt
          </label>
          <Field label="Ngày ban hành / cập nhật PATHH">
            <Input type="date" value={form.sds_date ?? ''} onChange={(e) => setForm({ ...form, sds_date: e.target.value })} />
          </Field>
          <Field label="Liên kết PATHH (file lưu trữ)">
            <Input value={form.pathh_url ?? ''} onChange={(e) => setForm({ ...form, pathh_url: e.target.value })} placeholder="https://…" />
          </Field>
        </div>
        <Field label="Ghi chú">
          <Textarea rows={2} value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>
        {form.log_key && (
          <Note>Lượng dùng ghi ở nhật ký vận hành HTXLNT (cột "{form.log_key}", kg) từ ngày khai báo được trừ vào tồn – không ghi phiếu xuất trùng.</Note>
        )}
        {err && <ErrorNote message={err} />}
      </div>
    </Modal>
  )
}

export function TxnModal({
  form,
  setForm,
  base,
  chemicals,
  stock,
  onClose,
}: {
  form: any
  setForm: (f: any) => void
  base: Record<string, string>
  chemicals: Chemical[]
  stock: (id: string) => StockInfo | undefined
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!form) return null
  const c = chemicals.find((x) => x.id === form.chemical_id)
  const s = c ? stock(c.id) : undefined
  const controlled = !!c && CONTROLLED_GROUPS.includes(c.legal_group)

  const submit = async () => {
    setErr('')
    if (!c) return setErr('Chọn hóa chất.')
    const q = Number(form.quantity)
    if (form.quantity === '' || form.quantity == null || !Number.isFinite(q) || q === 0) return setErr('Nhập số lượng.')
    if (form.kind !== 'dieu_chinh' && q < 0) return setErr('Số lượng phải lớn hơn 0 (điều chỉnh kiểm kê mới được nhập số âm).')
    if (form.kind === 'nhap' && c.legal_group === 'cam') return setErr('Hóa chất cấm – không được mua, nhập, sử dụng.')
    if ((form.kind === 'xuat' || form.kind === 'thai_bo') && s && q > s.stock + 1e-9)
      return setErr(`Xuất vượt tồn (còn ${fmtNum(s.stock)} ${c.unit ?? ''}). Kiểm tra lại sổ hoặc ghi điều chỉnh kiểm kê trước.`)
    if (
      form.kind === 'nhap' &&
      controlled &&
      (!form.invoice_no?.trim() || !form.supplier_license?.trim()) &&
      !window.confirm(`${LEGAL_GROUP_LABELS[c.legal_group]}: cần lưu hóa đơn, chứng từ và giấy phép / giấy chứng nhận đủ điều kiện của bên bán. Vẫn lưu khi còn thiếu?`)
    )
      return
    setBusy(true)
    try {
      const { error } = await supabase.from('chemical_transactions').insert({
        ...base,
        chemical_id: c.id,
        txn_date: form.txn_date || todayISO(),
        kind: form.kind,
        quantity: q,
        area: form.kind === 'xuat' ? form.area || c.use_area : null,
        purpose: form.purpose?.trim() || null,
        supplier: form.kind === 'nhap' ? form.supplier?.trim() || c.supplier : null,
        supplier_license: form.kind === 'nhap' ? form.supplier_license?.trim() || null : null,
        invoice_no: form.invoice_no?.trim() || null,
        batch_no: form.batch_no?.trim() || null,
        person: form.person?.trim() || null,
        note: form.note?.trim() || null,
      })
      if (error) throw error
      await qc.invalidateQueries()
      onClose()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={!!form}
      onClose={onClose}
      title={`${TXN_KIND_LABELS[form.kind] ?? 'Ghi sổ'}${c ? ': ' + c.name : ''}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={busy}>
            Lưu
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hóa chất" required className="col-span-2">
            <Select value={form.chemical_id ?? ''} onChange={(e) => setForm({ ...form, chemical_id: e.target.value })}>
              <option value="">— Chọn hóa chất —</option>
              {chemicals
                .filter((x) => x.active || x.id === form.chemical_id)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} ({USE_AREA_LABELS[x.use_area] ?? x.use_area})
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Loại">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {Object.entries(TXN_KIND_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ngày" required>
            <Input type="date" value={form.txn_date ?? ''} onChange={(e) => setForm({ ...form, txn_date: e.target.value })} />
          </Field>
          <Field label={`Số lượng${c?.unit ? ' (' + c.unit + ')' : ''}`} required>
            <Input type="number" step="any" value={form.quantity ?? ''} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </Field>
          {s && (
            <div className="self-end pb-2 text-sm text-pine-800/60">
              Tồn hiện tại: <b className="text-pine-800">{fmtNum(s.stock)}</b> {c?.unit}
            </div>
          )}
        </div>
        {form.kind === 'nhap' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bên bán">
                <Input value={form.supplier ?? c?.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
              </Field>
              <Field label="Hóa đơn, chứng từ" required={controlled}>
                <Input value={form.invoice_no ?? ''} onChange={(e) => setForm({ ...form, invoice_no: e.target.value })} />
              </Field>
            </div>
            <Field label="Giấy phép / GCN đủ điều kiện của bên bán" required={controlled}>
              <Input value={form.supplier_license ?? ''} onChange={(e) => setForm({ ...form, supplier_license: e.target.value })} />
            </Field>
            {controlled && (
              <Note tone="amber">
                {LEGAL_GROUP_LABELS[c!.legal_group]}: lưu hóa đơn, chứng từ mua bán và giấy phép của bên bán; theo dõi sử dụng theo sổ (Luật Hóa chất 69/2025, NĐ 26/2026 – đối chiếu danh mục).
              </Note>
            )}
          </>
        )}
        {form.kind === 'xuat' && (
          <Field label="Nơi sử dụng">
            <Select value={form.area ?? c?.use_area ?? 'san_xuat'} onChange={(e) => setForm({ ...form, area: e.target.value })}>
              {Object.entries(USE_AREA_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label={form.kind === 'xuat' ? 'Mục đích sử dụng' : 'Nội dung'}>
            <Input value={form.purpose ?? ''} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder={form.kind === 'xuat' ? 'VD: phân tích COD, chỉnh pH' : ''} />
          </Field>
          <Field label={form.kind === 'nhap' ? 'Người nhận' : 'Người nhận / giao'}>
            <Input value={form.person ?? ''} onChange={(e) => setForm({ ...form, person: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số lô">
            <Input value={form.batch_no ?? ''} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} />
          </Field>
          <Field label="Ghi chú">
            <Input value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
        </div>
        {form.kind === 'thai_bo' && <Note>Hóa chất hết hạn, bao bì dính hóa chất, dịch thải phân tích: chuyển kho CTNH, ghi phát sinh tại Chất thải & CTNH.</Note>}
        {err && <ErrorNote message={err} />}
      </div>
    </Modal>
  )
}
