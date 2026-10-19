// Ghi nhận / sửa một lượt huấn luyện của một người: Khóa – Ngày – Quyết định
import { useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, ErrorNote, Field, Input, Modal, Note, Select, Textarea } from '../../components/UI'
import {
  TRAINING_CATEGORY_BASIS,
  TRAINING_CATEGORY_LABELS,
  TRAINING_RESULT_LABELS,
} from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import {
  ALL_TRAINING_CATEGORIES,
  defaultValidityMonths,
  expiryOf,
  type Employee,
  type TrainingCourse,
  type TrainingRecord,
} from '../../lib/training'
import { errMsg, fmtDate, todayISO } from '../../lib/utils'
import { normalize } from './excel'

interface Props {
  open: boolean
  onClose: () => void
  base: { org_id: string; facility_id: string }
  employee: Employee | null
  category?: string
  record?: TrainingRecord | null
  courses: TrainingCourse[]
  canEdit: boolean
}

const NEW = ''

export default function TrainingRecordModal({ open, onClose, base, employee, category, record, courses, canEdit }: Props) {
  const qc = useQueryClient()
  const [f, setF] = useState<any>({})
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const latestOf = (cat: string) => courses.filter((c) => c.category === cat).sort((a, b) => b.start_date.localeCompare(a.start_date))[0]

  useEffect(() => {
    if (!open) return
    setErr('')
    if (record) {
      const c = courses.find((x) => x.id === record.course_id)
      setF({
        category: c?.category ?? category ?? 'atvsld',
        courseId: record.course_id,
        result: record.result,
        certificate_no: record.certificate_no ?? '',
        expiry_date: record.expiry_date ?? '',
        note: record.note ?? '',
      })
    } else {
      const cat = category ?? 'atvsld'
      setF({ category: cat, courseId: latestOf(cat)?.id ?? NEW, result: 'dat', start_date: todayISO() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record?.id, category])

  const catCourses = useMemo(
    () => courses.filter((c) => c.category === f.category).sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [courses, f.category]
  )
  const selected = courses.find((c) => c.id === f.courseId)

  const previewExpiry = useMemo(() => {
    if (f.expiry_date) return f.expiry_date
    const c: TrainingCourse | undefined = selected
      ? selected
      : f.start_date
        ? ({
            id: '',
            category: f.category,
            name: '',
            start_date: f.start_date,
            end_date: null,
            decision_no: null,
            decision_date: null,
            provider: null,
            hours: null,
            validity_months: f.validity_months === '' || f.validity_months == null ? null : Number(f.validity_months),
            note: null,
          } as TrainingCourse)
        : undefined
    if (!c) return null
    return expiryOf({ expiry_date: null } as TrainingRecord, c, employee)
  }, [f, selected, employee])

  const months = selected?.validity_months ?? defaultValidityMonths(f.category, employee?.atvsld_group)

  const submit = async () => {
    if (!employee) return
    setErr('')
    let courseId: string = f.courseId
    if (!courseId) {
      if (!f.name?.trim() || !f.start_date) return setErr('Nhập tên khóa và ngày huấn luyện.')
      const dup = courses.find(
        (c) =>
          c.category === f.category &&
          normalize(c.name) === normalize(f.name) &&
          c.start_date === f.start_date &&
          (c.decision_no ?? '').trim() === (f.decision_no ?? '').trim()
      )
      courseId = dup?.id ?? ''
    }
    setBusy(true)
    try {
      if (!courseId) {
        const { data, error } = await supabase
          .from('training_courses')
          .insert({
            ...base,
            category: f.category,
            name: f.name.trim(),
            start_date: f.start_date,
            decision_no: f.decision_no?.trim() || null,
            decision_date: f.decision_date || null,
            provider: f.provider?.trim() || null,
            hours: f.hours === '' || f.hours == null ? null : Number(f.hours),
            validity_months: f.validity_months === '' || f.validity_months == null ? null : Number(f.validity_months),
          })
          .select()
          .single()
        if (error) throw error
        courseId = data.id
      }
      const payload = {
        course_id: courseId,
        result: f.result || 'dat',
        certificate_no: f.certificate_no?.trim() || null,
        expiry_date: f.expiry_date || null,
        note: f.note?.trim() || null,
      }
      const { error } = record
        ? await supabase.from('training_records').update(payload).eq('id', record.id)
        : await supabase.from('training_records').insert({ ...base, employee_id: employee.id, ...payload })
      if (error) {
        if ((error as any).code === '23505') throw new Error('Người lao động này đã có trong khóa huấn luyện đã chọn.')
        throw error
      }
      await qc.invalidateQueries()
      onClose()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!record || !window.confirm('Xóa lượt huấn luyện này của ' + employee?.full_name + '?')) return
    const { error } = await supabase.from('training_records').delete().eq('id', record.id)
    if (error) return setErr(errMsg(error))
    await qc.invalidateQueries()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={(record ? 'Sửa lượt huấn luyện' : 'Ghi nhận huấn luyện') + (employee ? ' – ' + employee.full_name : '')}
      wide
      footer={
        canEdit ? (
          <>
            {record && (
              <Button variant="ghost" className="mr-auto text-red-700" onClick={remove}>
                <Trash2 size={15} /> Xóa
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={busy}>
              Lưu
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Loại huấn luyện" required>
            <Select
              value={f.category ?? 'atvsld'}
              disabled={!!record}
              onChange={(e) => setF({ ...f, category: e.target.value, courseId: latestOf(e.target.value)?.id ?? NEW })}
            >
              {ALL_TRAINING_CATEGORIES.map((k) => (
                <option key={k} value={k}>
                  {TRAINING_CATEGORY_LABELS[k]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Khóa huấn luyện" required>
            <Select value={f.courseId ?? NEW} onChange={(e) => setF({ ...f, courseId: e.target.value })}>
              {catCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {fmtDate(c.start_date)} · {c.name}
                  {c.decision_no ? ' · QĐ ' + c.decision_no : ''}
                </option>
              ))}
              <option value={NEW}>+ Khóa mới…</option>
            </Select>
          </Field>
        </div>

        {f.courseId ? (
          selected && (
            <div className="grid gap-x-4 gap-y-1 rounded-lg bg-pine-800/[0.03] px-3 py-2 text-sm sm:grid-cols-3">
              <div>
                <span className="text-pine-800/50">Ngày: </span>
                {fmtDate(selected.start_date)}
              </div>
              <div>
                <span className="text-pine-800/50">Quyết định: </span>
                {selected.decision_no ?? '—'}
                {selected.decision_date ? ` (${fmtDate(selected.decision_date)})` : ''}
              </div>
              <div>
                <span className="text-pine-800/50">Đơn vị HL: </span>
                {selected.provider ?? '—'}
              </div>
            </div>
          )
        ) : (
          <div className="space-y-3 rounded-lg border border-dashed border-pine-800/20 p-3">
            <Field label="Tên khóa" required>
              <Input
                value={f.name ?? ''}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                placeholder={'VD: Huấn luyện ' + (TRAINING_CATEGORY_LABELS[f.category] ?? '').toLowerCase() + ' định kỳ ' + new Date().getFullYear()}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Ngày huấn luyện" required>
                <Input type="date" value={f.start_date ?? ''} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
              </Field>
              <Field label="Số quyết định">
                <Input value={f.decision_no ?? ''} onChange={(e) => setF({ ...f, decision_no: e.target.value })} placeholder="VD: 15/QĐ-…" />
              </Field>
              <Field label="Ngày quyết định">
                <Input type="date" value={f.decision_date ?? ''} onChange={(e) => setF({ ...f, decision_date: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Đơn vị huấn luyện" className="sm:col-span-1">
                <Input value={f.provider ?? ''} onChange={(e) => setF({ ...f, provider: e.target.value })} />
              </Field>
              <Field label="Số giờ">
                <Input type="number" min={0} step="any" value={f.hours ?? ''} onChange={(e) => setF({ ...f, hours: e.target.value })} />
              </Field>
              <Field label="Hiệu lực (tháng)">
                <Input
                  type="number"
                  min={0}
                  value={f.validity_months ?? ''}
                  onChange={(e) => setF({ ...f, validity_months: e.target.value })}
                  placeholder={'Mặc định ' + (defaultValidityMonths(f.category, employee?.atvsld_group) ?? 'không hạn')}
                />
              </Field>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Kết quả">
            <Select value={f.result ?? 'dat'} onChange={(e) => setF({ ...f, result: e.target.value })}>
              {Object.entries(TRAINING_RESULT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Số chứng nhận / thẻ an toàn">
            <Input value={f.certificate_no ?? ''} onChange={(e) => setF({ ...f, certificate_no: e.target.value })} />
          </Field>
          <Field label="Hạn (nếu ghi trên chứng nhận)">
            <Input type="date" value={f.expiry_date ?? ''} onChange={(e) => setF({ ...f, expiry_date: e.target.value })} />
          </Field>
        </div>
        <Field label="Ghi chú">
          <Textarea rows={2} value={f.note ?? ''} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </Field>

        <Note>
          <b>Hạn huấn luyện lại: </b>
          {previewExpiry ? fmtDate(previewExpiry) : 'không thời hạn'}
          {!f.expiry_date && months ? ` (chu kỳ ${months} tháng)` : ''}
          <div className="mt-1">{TRAINING_CATEGORY_BASIS[f.category ?? 'atvsld']}</div>
        </Note>
        {err && <ErrorNote message={err} />}
      </div>
    </Modal>
  )
}
