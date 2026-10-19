// Phiếu sửa chữa thiết bị: biên bản hư hỏng → sửa chữa (Tổ Cơ điện / thuê ngoài) → nghiệm thu an toàn → đưa vào vận hành / thanh lý
import { useQueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { Check, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, ErrorNote, Field, Input, Modal, Note, Select, Textarea } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import {
  deriveWoStatus,
  ENV_IMPACT_NOTE,
  EQUIPMENT_CATEGORY_LABELS,
  inspectionLabel,
  inspectionState,
  MAINTAINER_LABELS,
  PRIORITY_DUE_DAYS,
  PRIORITY_LABELS,
  WO_STATUS_LABELS,
  WO_STATUS_TONE,
  woAlerts,
  woStep,
  type Equipment,
  type WorkOrder,
} from '../../lib/equipment'
import { blank, docHeader, esc, printDocument, signBlock } from '../../lib/print'
import { supabase } from '../../lib/supabase'
import { cls, errMsg, fmtDate, fmtNum, todayISO } from '../../lib/utils'
import { syncEquipmentStatus } from './useEquipmentData'

const STEPS = ['Biên bản hư hỏng', 'Sửa chữa', 'Nghiệm thu an toàn', 'Vận hành / thanh lý']

/** Phiếu mới: hạn hoàn thành gợi ý theo mức ưu tiên; đơn vị sửa mặc định theo thiết bị */
export function newWorkOrder(e?: Equipment | null): Record<string, any> {
  return {
    equipment_id: e?.id ?? '',
    report_date: todayISO(),
    priority: 'trung_binh',
    assignee: e?.maintainer ?? 'to_co_dien',
    due_date: format(addDays(new Date(), PRIORITY_DUE_DAYS.trung_binh), 'yyyy-MM-dd'),
    env_impact: e?.category === 'moi_truong',
    safety_impact: false,
  }
}

const dmy = (iso?: string | null) => {
  if (!iso) return 'ngày …… tháng …… năm ………'
  const [y, m, d] = iso.split('-')
  return `ngày ${d} tháng ${m} năm ${y}`
}

function equipmentRows(e: Equipment | null) {
  return `<tr><th style="width:32%">Tên thiết bị</th><td>${esc(e?.name)}</td></tr>
    <tr><th>Mã thiết bị</th><td>${blank(e?.code, 20)}</td></tr>
    <tr><th>Model / số chế tạo</th><td>${blank([e?.model, e?.serial_no].filter(Boolean).join(' / '), 20)}</td></tr>
    <tr><th>Bộ phận quản lý, vị trí</th><td>${blank([e?.department, e?.location].filter(Boolean).join(' – '), 20)}</td></tr>`
}

export function printDamageReport(w: any, e: Equipment | null, org: string, unit: string) {
  const who = w.assignee === 'thue_ngoai' ? `đơn vị thuê ngoài: ${w.contractor_name || '……………………'}` : 'Tổ Cơ điện'
  printDocument(
    'Biên bản hư hỏng thiết bị',
    `${docHeader(org, unit)}
    <h1>Biên bản hư hỏng thiết bị</h1>
    <div class="sub">Số: ${blank(w.report_no, 14)}</div>
    <p>Hôm nay, ${dmy(w.report_date)}, tại ${blank(e?.location || e?.department, 30)}, chúng tôi gồm:</p>
    <p>1. Người phát hiện, báo hỏng: ${blank(w.reported_by, 40)}</p>
    <p>2. Đại diện bộ phận sử dụng: ……………………………………………………</p>
    <p>3. Đại diện Tổ Cơ điện: ……………………………………………………</p>
    <p>4. Đại diện Phòng Kỹ thuật Sản xuất (an toàn – môi trường): ……………………………</p>
    <p>Cùng xác nhận tình trạng hư hỏng của thiết bị như sau:</p>
    <table class="grid">${equipmentRows(e)}
      <tr><th>Hiện tượng hư hỏng</th><td>${esc(w.description)}</td></tr>
      <tr><th>Nguyên nhân sơ bộ</th><td>${blank(w.cause, 40)}</td></tr>
      <tr><th>Mức độ ưu tiên</th><td>${esc(PRIORITY_LABELS[w.priority] ?? '')}</td></tr>
      <tr><th>Ảnh hưởng</th><td>${w.env_impact ? '☒' : '☐'} Công trình BVMT, phát thải &nbsp;&nbsp; ${w.safety_impact ? '☒' : '☐'} Nguy cơ mất an toàn</td></tr>
    </table>
    <p><b>Đề xuất:</b> giao ${esc(who)} sửa chữa, hoàn thành trước ${w.due_date ? fmtDate(w.due_date) : '……/……/………'}. ${w.env_impact ? 'Giảm tải hoặc dừng công đoạn phát thải liên quan cho đến khi khắc phục; ghi nhật ký sự cố.' : ''}</p>
    <p>Biên bản lập thành 02 bản, mỗi bên giữ 01 bản.</p>
    ${signBlock(['Người phát hiện', 'Bộ phận sử dụng', 'Tổ Cơ điện', 'Phòng KT-SX'])}`
  )
}

export function printAcceptance(w: any, e: Equipment | null, org: string, unit: string) {
  const who = w.assignee === 'thue_ngoai' ? w.contractor_name || 'Đơn vị thuê ngoài' : 'Tổ Cơ điện'
  const ok = w.safety_result === 'dat'
  const conclusion =
    w.outcome === 'thanh_ly'
      ? `Thiết bị không sửa chữa được, đề nghị thanh lý (${blank(w.outcome_no, 16)}).`
      : ok
        ? `Đồng ý đưa thiết bị vào vận hành từ ${w.outcome_date ? fmtDate(w.outcome_date) : '……/……/………'}.`
        : w.safety_result === 'khong_dat'
          ? 'Không đưa thiết bị vào vận hành; yêu cầu sửa chữa lại và nghiệm thu lại.'
          : '……………………………………………………………………'
  printDocument(
    'Biên bản nghiệm thu sửa chữa thiết bị',
    `${docHeader(org, unit)}
    <h1>Biên bản nghiệm thu sửa chữa thiết bị</h1>
    <div class="sub">Số: ${blank(w.acceptance_no, 14)}</div>
    <p>Căn cứ biên bản hư hỏng số ${blank(w.report_no, 12)} ${dmy(w.report_date)};</p>
    <p>Hôm nay, ${dmy(w.acceptance_date)}, chúng tôi gồm đại diện đơn vị sửa chữa (${esc(who)}), bộ phận sử dụng, Phòng Kỹ thuật Sản xuất, tiến hành nghiệm thu:</p>
    <table class="grid">${equipmentRows(e)}
      <tr><th>Nội dung sửa chữa, vật tư thay thế</th><td>${blank(w.repair_content, 40)}</td></tr>
      <tr><th>Thời gian thực hiện</th><td>${fmtDate(w.repair_start_date)} → ${fmtDate(w.repair_done_date)}</td></tr>
      <tr><th>Chi phí</th><td>${w.cost != null ? esc(fmtNum(Number(w.cost), 0)) + ' đồng' : '……………………'}</td></tr>
      <tr><th>Chạy thử, kiểm tra an toàn</th><td>${ok ? '☒' : '☐'} Đạt &nbsp;&nbsp; ${w.safety_result === 'khong_dat' ? '☒' : '☐'} Không đạt</td></tr>
    </table>
    <p><b>Kết luận:</b> ${conclusion}</p>
    ${signBlock(['Đơn vị sửa chữa', 'Bộ phận sử dụng', 'Phòng KT-SX', 'Ban Điều hành'])}`
  )
}

function Stepper({ step, status }: { step: number; status: string }) {
  return (
    <ol className="mb-3 grid grid-cols-4 gap-1" aria-label="Tiến trình phiếu sửa chữa">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < step || (n === 4 && (status === 'hoan_thanh' || status === 'thanh_ly'))
        const current = n === step && !done
        return (
          <li key={label} className="flex flex-col items-center gap-1 text-center">
            <span
              className={cls(
                'grid h-7 w-7 place-items-center rounded-full text-xs font-bold',
                done ? 'bg-viridian-600 text-white' : current ? 'bg-pine-900 text-white' : 'bg-pine-800/10 text-pine-800/50'
              )}
            >
              {done ? <Check size={14} /> : n}
            </span>
            <span className={cls('text-[11px] leading-tight', current ? 'font-semibold text-pine-800' : 'text-pine-800/55')}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default function WorkOrderModal({
  open,
  onClose,
  base,
  equipment,
  initial,
  canEdit,
}: {
  open: boolean
  onClose: () => void
  base: Record<string, string>
  equipment: Equipment[]
  initial: Record<string, any> | null
  canEdit: boolean
}) {
  const qc = useQueryClient()
  const { org, facility } = useAuth()
  const [f, setF] = useState<any>(initial ?? {})
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setF(initial ?? {})
    setErr('')
  }, [initial])

  if (!open) return null
  const eq = equipment.find((x) => x.id === f.equipment_id) ?? null
  const isNew = !f.id
  const status = deriveWoStatus(f)
  const step = woStep({ status })
  const insp = eq ? inspectionState(eq) : null
  const set = (patch: Record<string, any>) => setF({ ...f, ...patch })
  const today = todayISO()
  const orgName = org?.name ?? ''
  const unit = facility?.name ?? ''

  const save = async (patch: Record<string, any> = {}) => {
    setErr('')
    const n = { ...f, ...patch }
    try {
      if (!n.equipment_id) throw new Error('Chọn thiết bị.')
      if (!n.report_date) throw new Error('Nhập ngày lập biên bản hư hỏng.')
      if (!n.description?.trim()) throw new Error('Nhập hiện tượng hư hỏng.')
      if (n.assignee === 'thue_ngoai' && !n.contractor_name?.trim()) throw new Error('Nhập tên đơn vị thuê ngoài sửa chữa.')
      if (n.repair_start_date && n.repair_start_date < n.report_date) throw new Error('Ngày bắt đầu sửa chữa trước ngày lập biên bản.')
      if (n.repair_done_date && n.repair_start_date && n.repair_done_date < n.repair_start_date) throw new Error('Ngày hoàn thành sửa chữa trước ngày bắt đầu.')
      if (n.acceptance_date && !n.safety_result && n.outcome !== 'thanh_ly') throw new Error('Chọn kết quả kiểm tra an toàn khi nghiệm thu.')
      if (n.outcome === 'van_hanh' && n.safety_result !== 'dat') throw new Error('Chỉ đưa thiết bị vào vận hành khi kết quả kiểm tra an toàn đạt.')
      if (n.outcome === 'thanh_ly' && !n.outcome_no?.trim()) throw new Error('Nhập số quyết định / biên bản thanh lý ở bước 4.')
      if (n.outcome && !n.outcome_date) n.outcome_date = n.acceptance_date || today
      if (
        n.outcome === 'van_hanh' &&
        eq?.strict_safety &&
        insp &&
        (insp.state === 'qua_han' || insp.state === 'chua_co') &&
        !window.confirm(
          'Thiết bị có yêu cầu nghiêm ngặt về ATVSLĐ đang quá hạn hoặc chưa có kết quả kiểm định. Không được đưa vào sử dụng khi chưa kiểm định (NĐ 283/2026 Điều 35 k4). Vẫn ghi nhận?'
        )
      )
        return
      setBusy(true)
      const payload = {
        equipment_id: n.equipment_id,
        report_no: n.report_no?.trim() || null,
        report_date: n.report_date,
        reported_by: n.reported_by?.trim() || null,
        description: n.description.trim(),
        cause: n.cause?.trim() || null,
        priority: n.priority || 'trung_binh',
        env_impact: !!n.env_impact,
        safety_impact: !!n.safety_impact,
        assignee: n.assignee || 'to_co_dien',
        contractor_name: n.assignee === 'thue_ngoai' ? n.contractor_name?.trim() || null : null,
        due_date: n.due_date || null,
        repair_start_date: n.repair_start_date || null,
        repair_done_date: n.repair_done_date || null,
        repair_content: n.repair_content?.trim() || null,
        cost: n.cost === '' || n.cost == null ? null : Number(n.cost),
        acceptance_date: n.acceptance_date || null,
        acceptance_no: n.acceptance_no?.trim() || null,
        safety_result: n.safety_result || null,
        outcome: n.outcome || null,
        outcome_date: n.outcome_date || null,
        outcome_no: n.outcome_no?.trim() || null,
        status: deriveWoStatus(n),
        note: n.note?.trim() || null,
      }
      const { error } = isNew
        ? await supabase.from('equipment_work_orders').insert({ ...base, ...payload })
        : await supabase.from('equipment_work_orders').update(payload).eq('id', n.id)
      if (error) throw error
      await syncEquipmentStatus(n.equipment_id)
      await qc.invalidateQueries()
      onClose()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const finishRepair = () => {
    if (!f.repair_content?.trim()) return setErr('Ghi nội dung sửa chữa, vật tư thay thế trước khi hoàn thành.')
    const retry = f.acceptance_date && f.safety_result === 'khong_dat'
    save({
      repair_start_date: f.repair_start_date || today,
      repair_done_date: retry || !f.repair_done_date ? today : f.repair_done_date,
      ...(retry
        ? {
            acceptance_date: null,
            safety_result: null,
            note: [f.note, `Nghiệm thu ngày ${fmtDate(f.acceptance_date)} không đạt; đã sửa lại.`].filter(Boolean).join(' '),
          }
        : {}),
    })
  }

  const alerts = isNew ? [] : woAlerts({ ...f, status } as WorkOrder)
  const ro = !canEdit

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'Lập biên bản hư hỏng thiết bị' : 'Phiếu sửa chữa: ' + (eq?.name ?? '')}
      wide
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {!isNew && (
            <div className="mr-auto flex flex-wrap gap-1">
              <Button variant="ghost" onClick={() => printDamageReport(f, eq, orgName, unit)}>
                <Printer size={15} /> BB hư hỏng
              </Button>
              {f.acceptance_date && (
                <Button variant="ghost" onClick={() => printAcceptance(f, eq, orgName, unit)}>
                  <Printer size={15} /> BB nghiệm thu
                </Button>
              )}
            </div>
          )}
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {canEdit && (
            <>
              <Button variant="outline" onClick={() => save()} disabled={busy}>
                Lưu
              </Button>
              {status === 'moi' && (
                <Button onClick={() => save({ repair_start_date: f.repair_start_date || today })} disabled={busy}>
                  {isNew ? 'Lưu và giao sửa ngay' : 'Bắt đầu sửa chữa'}
                </Button>
              )}
              {status === 'dang_sua' && (
                <Button onClick={finishRepair} disabled={busy}>
                  Hoàn thành sửa chữa
                </Button>
              )}
              {status === 'cho_nghiem_thu' && (
                <>
                  <Button variant="danger" onClick={() => save({ acceptance_date: f.acceptance_date || today, safety_result: 'khong_dat', outcome: null })} disabled={busy}>
                    Không đạt – sửa lại
                  </Button>
                  <Button
                    onClick={() =>
                      save({ acceptance_date: f.acceptance_date || today, safety_result: 'dat', outcome: 'van_hanh', outcome_date: f.outcome_date || f.acceptance_date || today })
                    }
                    disabled={busy}
                  >
                    Nghiệm thu đạt – đưa vào vận hành
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <Stepper step={step} status={status} />
        {!isNew && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={WO_STATUS_TONE[status]}>{WO_STATUS_LABELS[status]}</Badge>
            {alerts.map((a) => (
              <Badge key={a.label} tone={a.tone}>
                {a.label}
              </Badge>
            ))}
          </div>
        )}

        {/* 1. Biên bản hư hỏng */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-pine-800/50">1. Biên bản hư hỏng</h4>
          <Field label="Thiết bị" required>
            <Select value={f.equipment_id ?? ''} onChange={(e) => set({ equipment_id: e.target.value })} disabled={!isNew || ro}>
              <option value="">— Chọn thiết bị —</option>
              {equipment
                .filter((x) => x.status !== 'thanh_ly' || x.id === f.equipment_id)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {[x.code, x.name].filter(Boolean).join(' · ')}
                  </option>
                ))}
            </Select>
          </Field>
          {eq && (
            <div className="text-xs text-pine-800/55">
              {EQUIPMENT_CATEGORY_LABELS[eq.category] ?? eq.category} · {eq.department ?? '—'}
              {eq.strict_safety && insp && (
                <>
                  {' '}
                  · Thiết bị nghiêm ngặt – kiểm định: <b>{inspectionLabel(insp)}</b>
                  {eq.next_inspection ? ` (hạn ${fmtDate(eq.next_inspection)})` : ''}
                </>
              )}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Số biên bản">
              <Input value={f.report_no ?? ''} onChange={(e) => set({ report_no: e.target.value })} disabled={ro} />
            </Field>
            <Field label="Ngày lập" required>
              <Input type="date" value={f.report_date ?? ''} onChange={(e) => set({ report_date: e.target.value })} disabled={ro} />
            </Field>
            <Field label="Người phát hiện, báo hỏng">
              <Input value={f.reported_by ?? ''} onChange={(e) => set({ reported_by: e.target.value })} disabled={ro} />
            </Field>
          </div>
          <Field label="Hiện tượng hư hỏng" required>
            <Textarea value={f.description ?? ''} onChange={(e) => set({ description: e.target.value })} disabled={ro} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nguyên nhân sơ bộ" className="sm:col-span-2">
              <Input value={f.cause ?? ''} onChange={(e) => set({ cause: e.target.value })} disabled={ro} />
            </Field>
            <Field label="Mức ưu tiên">
              <Select
                value={f.priority ?? 'trung_binh'}
                onChange={(e) =>
                  set({
                    priority: e.target.value,
                    ...(isNew && f.report_date ? { due_date: format(addDays(new Date(f.report_date + 'T00:00:00'), PRIORITY_DUE_DAYS[e.target.value] ?? 7), 'yyyy-MM-dd') } : {}),
                  })
                }
                disabled={ro}
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-pine-800">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={!!f.env_impact} onChange={(e) => set({ env_impact: e.target.checked })} disabled={ro} />
              Ảnh hưởng công trình BVMT, phát thải
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={!!f.safety_impact} onChange={(e) => set({ safety_impact: e.target.checked })} disabled={ro} />
              Nguy cơ mất an toàn
            </label>
          </div>
          {f.env_impact && <Note tone="amber">{ENV_IMPACT_NOTE}</Note>}
        </section>

        {/* 2. Sửa chữa */}
        <section className="space-y-3 border-t border-pine-800/10 pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-pine-800/50">2. Giao sửa chữa</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Đơn vị sửa chữa">
              <Select value={f.assignee ?? 'to_co_dien'} onChange={(e) => set({ assignee: e.target.value })} disabled={ro}>
                {Object.entries(MAINTAINER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            {f.assignee === 'thue_ngoai' && (
              <Field label="Tên đơn vị thuê ngoài" required className="sm:col-span-2">
                <Input value={f.contractor_name ?? ''} onChange={(e) => set({ contractor_name: e.target.value })} disabled={ro} placeholder="Nhà thầu đã ký cam kết an toàn – môi trường" />
              </Field>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Hạn hoàn thành">
              <Input type="date" value={f.due_date ?? ''} onChange={(e) => set({ due_date: e.target.value })} disabled={ro} />
            </Field>
            <Field label="Ngày bắt đầu sửa">
              <Input type="date" value={f.repair_start_date ?? ''} onChange={(e) => set({ repair_start_date: e.target.value })} disabled={ro} />
            </Field>
            <Field label="Ngày hoàn thành sửa chữa">
              <Input type="date" value={f.repair_done_date ?? ''} onChange={(e) => set({ repair_done_date: e.target.value })} disabled={ro} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nội dung sửa chữa, vật tư thay thế" className="sm:col-span-2">
              <Textarea rows={2} value={f.repair_content ?? ''} onChange={(e) => set({ repair_content: e.target.value })} disabled={ro} />
            </Field>
            <Field label="Chi phí (đồng)">
              <Input type="number" min={0} step="any" value={f.cost ?? ''} onChange={(e) => set({ cost: e.target.value })} disabled={ro} />
            </Field>
          </div>
        </section>

        {/* 3. Nghiệm thu */}
        <section className="space-y-3 border-t border-pine-800/10 pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-pine-800/50">3. Nghiệm thu – kiểm tra an toàn</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Ngày nghiệm thu">
              <Input type="date" value={f.acceptance_date ?? ''} onChange={(e) => set({ acceptance_date: e.target.value })} disabled={ro} />
            </Field>
            <Field label="Số biên bản nghiệm thu">
              <Input value={f.acceptance_no ?? ''} onChange={(e) => set({ acceptance_no: e.target.value })} disabled={ro} />
            </Field>
            <Field label="Kết quả an toàn">
              <Select value={f.safety_result ?? ''} onChange={(e) => set({ safety_result: e.target.value || null, ...(e.target.value === 'khong_dat' && f.outcome === 'van_hanh' ? { outcome: null } : {}) })} disabled={ro}>
                <option value="">— Chưa nghiệm thu —</option>
                <option value="dat">Đạt</option>
                <option value="khong_dat">Không đạt</option>
              </Select>
            </Field>
          </div>
          {f.safety_result === 'khong_dat' && (
            <Note tone="amber">Kết quả an toàn không đạt: không đưa thiết bị vào vận hành. Sửa lại rồi nghiệm thu lại, hoặc lập hồ sơ thanh lý.</Note>
          )}
        </section>

        {/* 4. Kết thúc */}
        <section className="space-y-3 border-t border-pine-800/10 pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-pine-800/50">4. Đưa vào vận hành / thanh lý</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Kết quả">
              <Select value={f.outcome ?? ''} onChange={(e) => set({ outcome: e.target.value || null })} disabled={ro}>
                <option value="">— Chưa kết thúc —</option>
                <option value="van_hanh" disabled={f.safety_result !== 'dat'}>
                  Đưa vào vận hành
                </option>
                <option value="thanh_ly">Thanh lý thiết bị</option>
              </Select>
            </Field>
            <Field label="Ngày">
              <Input type="date" value={f.outcome_date ?? ''} onChange={(e) => set({ outcome_date: e.target.value })} disabled={ro} />
            </Field>
            <Field label={f.outcome === 'thanh_ly' ? 'Số QĐ / biên bản thanh lý' : 'Số lệnh đưa vào vận hành'} required={f.outcome === 'thanh_ly'}>
              <Input value={f.outcome_no ?? ''} onChange={(e) => set({ outcome_no: e.target.value })} disabled={ro} />
            </Field>
          </div>
          <Field label="Ghi chú">
            <Textarea rows={2} value={f.note ?? ''} onChange={(e) => set({ note: e.target.value })} disabled={ro} />
          </Field>
        </section>
        {err && <ErrorNote message={err} />}
      </div>
    </Modal>
  )
}
