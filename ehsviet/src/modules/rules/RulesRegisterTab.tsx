// Danh mục nội quy, quy định nội bộ đang áp dụng
import { useQueryClient } from '@tanstack/react-query'
import { format, subYears } from 'date-fns'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Loading,
  Modal,
  Note,
  Select,
  Table,
  Td,
  Textarea,
  type Tone,
} from '../../components/UI'
import { RULE_CATEGORY_LABELS, RULE_STATUS_LABELS } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { ruleRows } from '../../lib/templates'
import { errMsg, fmtDate } from '../../lib/utils'
import type { RulesData } from './shared'

const STATUS_TONE: Record<string, Tone> = { draft: 'amber', active: 'green', retired: 'gray' }

export default function RulesRegisterTab({ data, base, canEdit }: { data: RulesData; base: any; canEdit: boolean }) {
  const qc = useQueryClient()
  const { rules, violations, loading } = data
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const counts = useMemo(() => {
    const from = format(subYears(new Date(), 1), 'yyyy-MM-dd')
    const m = new Map<string, number>()
    for (const v of violations) if (v.rule_id && v.violation_date >= from) m.set(v.rule_id, (m.get(v.rule_id) ?? 0) + 1)
    return m
  }, [violations])

  const loadTemplates = async () => {
    setErr('')
    setBusy(true)
    try {
      const { error } = await supabase.from('internal_rules').insert(ruleRows(base))
      if (error) throw error
      await qc.invalidateQueries()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    setErr('')
    if (!form.title?.trim()) return setErr('Nhập tên nội quy / quy định.')
    const payload = {
      code: form.code?.trim() || null,
      title: form.title.trim(),
      category: form.category || 'moi_truong',
      decision_no: form.decision_no?.trim() || null,
      issued_date: form.issued_date || null,
      status: form.status || 'active',
      summary: form.summary?.trim() || null,
      file_url: form.file_url?.trim() || null,
    }
    const { error } = form.id
      ? await supabase.from('internal_rules').update(payload).eq('id', form.id)
      : await supabase.from('internal_rules').insert({ ...base, ...payload })
    if (error) return setErr(errMsg(error))
    await qc.invalidateQueries()
    setForm(null)
  }

  const remove = async (r: any) => {
    if (!window.confirm(`Xóa "${r.title}"? Các vi phạm đã ghi nhận vẫn được giữ.`)) return
    const { error } = await supabase.from('internal_rules').delete().eq('id', r.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Nội quy, quy định nội bộ"
          hint="Căn cứ khi lập biên bản vi phạm; theo dõi số hiệu quyết định, hiệu lực và số vi phạm 12 tháng"
          action={
            canEdit && (
              <div className="flex gap-2">
                {rules.length === 0 && (
                  <Button variant="outline" disabled={busy} onClick={loadTemplates}>
                    Nạp danh mục mẫu
                  </Button>
                )}
                <Button onClick={() => setForm({ category: 'moi_truong', status: 'active' })}>
                  <Plus size={15} /> Thêm nội quy
                </Button>
              </div>
            )
          }
        />
        {err && !form && (
          <div className="px-4 pt-3">
            <ErrorNote message={err} />
          </div>
        )}
        {rules.length === 0 ? (
          <EmptyState title="Chưa có nội quy" hint="Nạp danh mục mẫu (MT-HD01…07, quy định tuân thủ MT nội bộ, nội quy lao động) rồi chỉnh sửa" />
        ) : (
          <Table head={['Mã hiệu', 'Tên nội quy / quy định', 'Lĩnh vực', 'Quyết định', 'Trạng thái', 'Vi phạm 12 tháng', '']}>
            {rules.map((r: any) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap font-mono text-xs">{r.code ?? '—'}</Td>
                <Td className="max-w-[360px]">
                  <div className="font-medium">{r.title}</div>
                  {r.summary && <div className="text-xs text-pine-800/50">{r.summary}</div>}
                  {r.file_url && (
                    <a href={r.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-viridian-700 underline">
                      Văn bản <ExternalLink size={12} />
                    </a>
                  )}
                </Td>
                <Td className="text-pine-800/70">{RULE_CATEGORY_LABELS[r.category]}</Td>
                <Td className="whitespace-nowrap text-pine-800/70">
                  {r.decision_no ?? '—'}
                  {r.issued_date && <div className="text-xs text-pine-800/45">{fmtDate(r.issued_date)}</div>}
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[r.status]}>{RULE_STATUS_LABELS[r.status]}</Badge>
                </Td>
                <Td className="text-center">{counts.get(r.id) ?? '·'}</Td>
                <Td className="text-right">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...r })}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" aria-label="Xóa" onClick={() => remove(r)}>
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <Note>
        Bảng tự kiểm tra tuân thủ theo nghị định xử phạt (Môi trường – NĐ 45/2022; PCCC & CNCH – NĐ 106/2025; ATVSLĐ – NĐ 12/2022; hóa chất) và
        checklist kiểm tra môi trường – VSCN hằng tháng 12 khu vực nằm ở{' '}
        <Link to="/an-toan" className="font-medium text-viridian-700 underline">
          PCCC & An toàn › Checklist
        </Link>{' '}
        (nạp tại Cài đặt › Bộ mẫu nghiệp vụ nếu chưa có).
      </Note>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa nội quy' : 'Thêm nội quy / quy định'}
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit}>Lưu</Button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Mã hiệu">
                <Input value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MT-HD03-NQ" />
              </Field>
              <Field label="Tên" required className="col-span-2">
                <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lĩnh vực">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(RULE_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Trạng thái">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {Object.entries(RULE_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số quyết định ban hành">
                <Input value={form.decision_no ?? ''} onChange={(e) => setForm({ ...form, decision_no: e.target.value })} />
              </Field>
              <Field label="Ngày ban hành">
                <Input type="date" value={form.issued_date ?? ''} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} />
              </Field>
            </div>
            <Field label="Nội dung chính">
              <Textarea rows={4} value={form.summary ?? ''} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </Field>
            <Field label="Liên kết văn bản">
              <Input value={form.file_url ?? ''} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://…" />
            </Field>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
    </div>
  )
}
