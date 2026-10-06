import { ClipboardCheck, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
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
  Select,
  Table,
  Tabs,
  Td,
  Textarea,
} from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { useList, useRemove, useSave } from '../../hooks/useCrud'
import {
  CAPA_STATUS_LABELS,
  CHECKLIST_CATEGORY_LABELS,
  DRILL_KIND_LABELS,
  EQUIPMENT_STATUS_LABELS,
  FIRE_TYPE_LABELS,
  FREQUENCY_LABELS,
  INCIDENT_KIND_LABELS,
  INCIDENT_STATUS_LABELS,
  SEVERITY_LABELS,
} from '../../lib/constants'
import { cls, daysUntil, errMsg, fmtDate, todayISO } from '../../lib/utils'

/* ---------- nút chọn Đạt / K.đạt / N/A ---------- */
function Seg({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts: [string, string, string][] = [
    ['dat', 'Đạt', 'bg-viridian-600 text-white'],
    ['khong_dat', 'K.đạt', 'bg-red-600 text-white'],
    ['na', 'N/A', 'bg-pine-800/60 text-white'],
  ]
  return (
    <div className="flex shrink-0 overflow-hidden rounded-lg border border-pine-800/15">
      {opts.map(([k, l, activeCls]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={cls('px-2 py-1 text-xs font-medium', value === k ? activeCls : 'text-pine-800/50')}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

const scoreTone = (s: number) => (s >= 90 ? 'green' : s >= 70 ? 'amber' : 'red') as any

/* ================= Checklist ================= */
function ChecklistTab({ fid, base, canEdit }: any) {
  const templates = useList('checklist_templates', {
    match: { facility_id: fid },
    order: 'created_at',
    ascending: true,
    enabled: !!fid,
  })
  const runs = useList('checklist_runs', {
    select: '*, checklist_templates(name,category)',
    match: { facility_id: fid },
    order: 'run_date',
    enabled: !!fid,
  })
  const saveTpl = useSave('checklist_templates')
  const removeTpl = useRemove('checklist_templates')
  const saveRun = useSave('checklist_runs')
  const removeRun = useRemove('checklist_runs')

  const [tplForm, setTplForm] = useState<any>(null)
  const [runForm, setRunForm] = useState<any>(null)
  const [viewRun, setViewRun] = useState<any>(null)
  const [err, setErr] = useState('')

  const openTplCreate = () => setTplForm({ category: 'PCCC', frequency: 'monthly', itemsText: '' })
  const openTplEdit = (t: any) =>
    setTplForm({ ...t, itemsText: (t.items ?? []).map((i: any) => i.label).join('\n') })

  const submitTpl = async () => {
    setErr('')
    const previous = new Map<string, any>((tplForm.items ?? []).map((i: any) => [i.label, i]))
    const items = (tplForm.itemsText ?? '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .map((label: string) => previous.get(label) ?? { label })
    if (!tplForm.name?.trim() || items.length === 0)
      return setErr('Nhập tên checklist và ít nhất một hạng mục (mỗi dòng một mục).')
    try {
      await saveTpl.mutateAsync({
        ...(tplForm.id ? { id: tplForm.id } : base),
        name: tplForm.name.trim(),
        category: tplForm.category,
        frequency: tplForm.frequency,
        items,
      })
      setTplForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const openRun = (t: any) =>
    setRunForm({
      template: t,
      run_date: todayISO(),
      inspector: '',
      note: '',
      results: (t.items ?? []).map((i: any) => ({ label: i.label, hint: i.hint, fix: i.fix, status: 'dat', note: '' })),
    })

  const runScore = (results: any[]) => {
    const scored = results.filter((r) => r.status !== 'na')
    if (scored.length === 0) return 100
    return Math.round((scored.filter((r) => r.status === 'dat').length / scored.length) * 100)
  }

  const submitRun = async () => {
    setErr('')
    try {
      await saveRun.mutateAsync({
        ...base,
        template_id: runForm.template.id,
        run_date: runForm.run_date || todayISO(),
        inspector: runForm.inspector || null,
        results: runForm.results,
        score: runScore(runForm.results),
        note: runForm.note || null,
      })
      setRunForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const setResult = (i: number, patch: any) => {
    const results = [...runForm.results]
    results[i] = { ...results[i], ...patch }
    setRunForm({ ...runForm, results })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Bộ checklist kiểm tra"
          hint="PCCC, vệ sinh công nghiệp, an toàn — mỗi dòng một hạng mục"
          action={
            canEdit && (
              <Button variant="outline" onClick={openTplCreate}>
                <Plus size={15} /> Tạo checklist
              </Button>
            )
          }
        />
        {templates.isLoading ? (
          <Loading />
        ) : (templates.data ?? []).length === 0 ? (
          <EmptyState title="Chưa có checklist" />
        ) : (
          <Table head={['Tên', 'Nhóm', 'Tần suất', 'Số mục', '']}>
            {(templates.data as any[]).map((t) => (
              <tr key={t.id}>
                <Td className="font-medium">{t.name}</Td>
                <Td>
                  <Badge tone={t.category === 'PCCC' ? 'red' : 'blue'}>
                    {CHECKLIST_CATEGORY_LABELS[t.category]}
                  </Badge>
                </Td>
                <Td className="text-pine-800/60">{FREQUENCY_LABELS[t.frequency]}</Td>
                <Td className="text-pine-800/60">{(t.items ?? []).length}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    {canEdit && (
                      <Button onClick={() => openRun(t)}>
                        <ClipboardCheck size={15} /> Thực hiện
                      </Button>
                    )}
                    {canEdit && (
                      <>
                        <Button variant="ghost" aria-label="Sửa" onClick={() => openTplEdit(t)}>
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label="Xóa"
                          onClick={() => window.confirm('Xóa checklist này?') && removeTpl.mutate(t.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Lịch sử kiểm tra" hint="Điểm đạt = tỷ lệ hạng mục đạt (loại trừ N/A)" />
        {(runs.data ?? []).length === 0 ? (
          <EmptyState title="Chưa có lượt kiểm tra" />
        ) : (
          <Table head={['Ngày', 'Checklist', 'Người kiểm tra', 'Điểm', '']}>
            {(runs.data as any[]).map((r) => (
              <tr key={r.id}>
                <Td>{fmtDate(r.run_date)}</Td>
                <Td className="font-medium">{r.checklist_templates?.name}</Td>
                <Td className="text-pine-800/60">{r.inspector ?? '—'}</Td>
                <Td>
                  <Badge tone={scoreTone(Number(r.score ?? 0))}>{r.score ?? '—'}%</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Xem" onClick={() => setViewRun(r)}>
                      <Eye size={15} />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        aria-label="Xóa"
                        onClick={() => window.confirm('Xóa lượt kiểm tra này?') && removeRun.mutate(r.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Tạo/sửa checklist */}
      <Modal
        open={!!tplForm}
        onClose={() => setTplForm(null)}
        title={tplForm?.id ? 'Sửa checklist' : 'Tạo checklist'}
        footer={
          <>
            <Button variant="outline" onClick={() => setTplForm(null)}>
              Hủy
            </Button>
            <Button onClick={submitTpl}>Lưu</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên checklist" required>
            <Input
              value={tplForm?.name ?? ''}
              onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nhóm">
              <Select
                value={tplForm?.category ?? 'PCCC'}
                onChange={(e) => setTplForm({ ...tplForm, category: e.target.value })}
              >
                {Object.entries(CHECKLIST_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tần suất">
              <Select
                value={tplForm?.frequency ?? 'monthly'}
                onChange={(e) => setTplForm({ ...tplForm, frequency: e.target.value })}
              >
                {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Hạng mục kiểm tra (mỗi dòng một mục)" required>
            <Textarea
              rows={8}
              value={tplForm?.itemsText ?? ''}
              onChange={(e) => setTplForm({ ...tplForm, itemsText: e.target.value })}
              placeholder={'Bình chữa cháy đủ số lượng, còn hạn kiểm định\nLối thoát nạn thông thoáng\n…'}
            />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>

      {/* Thực hiện checklist */}
      <Modal
        open={!!runForm}
        onClose={() => setRunForm(null)}
        title={'Thực hiện: ' + (runForm?.template?.name ?? '')}
        wide
        footer={
          <>
            <div className="mr-auto text-sm font-medium text-pine-800/70">
              Điểm hiện tại:{' '}
              <Badge tone={scoreTone(runScore(runForm?.results ?? []))}>
                {runScore(runForm?.results ?? [])}%
              </Badge>
            </div>
            <Button variant="outline" onClick={() => setRunForm(null)}>
              Hủy
            </Button>
            <Button onClick={submitRun} disabled={saveRun.isPending}>
              Lưu kết quả
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày kiểm tra">
              <Input
                type="date"
                value={runForm?.run_date ?? ''}
                onChange={(e) => setRunForm({ ...runForm, run_date: e.target.value })}
              />
            </Field>
            <Field label="Người kiểm tra">
              <Input
                value={runForm?.inspector ?? ''}
                onChange={(e) => setRunForm({ ...runForm, inspector: e.target.value })}
              />
            </Field>
          </div>
          <div className="space-y-2">
            {(runForm?.results ?? []).map((r: any, i: number) => (
              <div key={i} className="rounded-lg border border-pine-800/10 p-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-pine-800">{r.label}</div>
                    {r.hint && <div className="mt-0.5 text-[11px] text-pine-800/45">{r.hint}</div>}
                  </div>
                  <Seg value={r.status} onChange={(v) => setResult(i, { status: v })} />
                </div>
                {r.status === 'khong_dat' && (
                  <Input
                    className="mt-2"
                    placeholder={r.fix ? 'Tồn tại / khắc phục — đề xuất: ' + r.fix : 'Ghi chú tồn tại / yêu cầu khắc phục'}
                    value={r.note}
                    onChange={(e) => setResult(i, { note: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <Field label="Nhận xét chung">
            <Textarea
              value={runForm?.note ?? ''}
              onChange={(e) => setRunForm({ ...runForm, note: e.target.value })}
            />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>

      {/* Xem kết quả */}
      <Modal
        open={!!viewRun}
        onClose={() => setViewRun(null)}
        title={'Kết quả: ' + (viewRun?.checklist_templates?.name ?? '')}
        wide
      >
        <div className="space-y-2">
          <div className="text-sm text-pine-800/60">
            Ngày {fmtDate(viewRun?.run_date)} · {viewRun?.inspector ?? '—'} · Điểm{' '}
            <Badge tone={scoreTone(Number(viewRun?.score ?? 0))}>{viewRun?.score}%</Badge>
          </div>
          {(viewRun?.results ?? []).map((r: any, i: number) => (
            <div key={i} className="flex items-start justify-between gap-3 rounded-lg border border-pine-800/10 p-2.5">
              <div>
                <div className="text-sm text-pine-800">{r.label}</div>
                {r.note && <div className="text-xs text-red-700">→ {r.note}</div>}
              </div>
              <Badge tone={r.status === 'dat' ? 'green' : r.status === 'khong_dat' ? 'red' : 'gray'}>
                {r.status === 'dat' ? 'Đạt' : r.status === 'khong_dat' ? 'Không đạt' : 'N/A'}
              </Badge>
            </div>
          ))}
          {viewRun?.note && <p className="text-sm text-pine-800/60">Nhận xét: {viewRun.note}</p>}
        </div>
      </Modal>
    </div>
  )
}

/* ================= Thiết bị PCCC ================= */
function FireTab({ fid, base, canEdit }: any) {
  const list = useList('fire_equipment', {
    match: { facility_id: fid },
    order: 'created_at',
    ascending: true,
    enabled: !!fid,
  })
  const save = useSave('fire_equipment')
  const remove = useRemove('fire_equipment')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!form.name?.trim()) return setErr('Nhập tên thiết bị.')
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        name: form.name.trim(),
        type: form.type || 'binh_bot',
        location: form.location || null,
        quantity: Number(form.quantity || 1),
        last_inspection: form.last_inspection || null,
        next_inspection: form.next_inspection || null,
        status: form.status || 'tot',
        note: form.note || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const inspBadge = (d: string | null) => {
    if (!d) return <span className="text-pine-800/40">—</span>
    const n = daysUntil(d)
    if (n < 0) return <Badge tone="red">Quá hạn {-n} ngày</Badge>
    if (n <= 15) return <Badge tone="amber">Còn {n} ngày</Badge>
    return <span className="text-pine-800/60">{fmtDate(d)}</span>
  }

  return (
    <Card>
      <CardHeader
        title="Thiết bị PCCC"
        hint="Theo dõi số lượng, vị trí và hạn kiểm tra định kỳ"
        action={
          canEdit && (
            <Button onClick={() => setForm({ type: 'binh_bot', status: 'tot', quantity: 1 })}>
              <Plus size={15} /> Thêm thiết bị
            </Button>
          )
        }
      />
      {(list.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có thiết bị" />
      ) : (
        <Table head={['Thiết bị', 'Loại', 'Vị trí', 'SL', 'Tình trạng', 'Hạn kiểm tra', '']}>
          {(list.data as any[]).map((e) => (
            <tr key={e.id}>
              <Td className="font-medium">{e.name}</Td>
              <Td className="text-pine-800/60">{FIRE_TYPE_LABELS[e.type]}</Td>
              <Td className="text-pine-800/60">{e.location ?? '—'}</Td>
              <Td>{e.quantity}</Td>
              <Td>
                <Badge tone={e.status === 'tot' ? 'green' : e.status === 'can_bao_tri' ? 'amber' : 'red'}>
                  {EQUIPMENT_STATUS_LABELS[e.status]}
                </Badge>
              </Td>
              <Td>{inspBadge(e.next_inspection)}</Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...e })}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() => window.confirm('Xóa thiết bị này?') && remove.mutate(e.id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa thiết bị' : 'Thêm thiết bị PCCC'}
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên thiết bị" required>
            <Input value={form?.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Loại">
              <Select value={form?.type ?? 'binh_bot'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(FIRE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Số lượng">
              <Input
                type="number"
                min={1}
                value={form?.quantity ?? 1}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Vị trí">
            <Input value={form?.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kiểm tra gần nhất">
              <Input
                type="date"
                value={form?.last_inspection ?? ''}
                onChange={(e) => setForm({ ...form, last_inspection: e.target.value })}
              />
            </Field>
            <Field label="Hạn kiểm tra tiếp theo">
              <Input
                type="date"
                value={form?.next_inspection ?? ''}
                onChange={(e) => setForm({ ...form, next_inspection: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Tình trạng">
            <Select value={form?.status ?? 'tot'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(EQUIPMENT_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ghi chú">
            <Textarea value={form?.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Diễn tập ================= */
function DrillsTab({ fid, base, canEdit }: any) {
  const list = useList('drills', { match: { facility_id: fid }, order: 'drill_date', enabled: !!fid })
  const save = useSave('drills')
  const remove = useRemove('drills')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        drill_date: form.drill_date || todayISO(),
        kind: form.kind || 'PCCC',
        scenario: form.scenario || null,
        participants: form.participants ? Number(form.participants) : null,
        organizer: form.organizer || null,
        evaluation: form.evaluation || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  return (
    <Card>
      <CardHeader
        title="Diễn tập & thực tập phương án"
        hint="PCCC, ứng phó sự cố hóa chất/môi trường, cấp cứu TNLĐ — lưu biên bản đánh giá"
        action={
          canEdit && (
            <Button onClick={() => setForm({ kind: 'PCCC', drill_date: todayISO() })}>
              <Plus size={15} /> Ghi nhận
            </Button>
          )
        }
      />
      {(list.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có đợt diễn tập" />
      ) : (
        <Table head={['Ngày', 'Loại', 'Tình huống', 'Số người', 'Chủ trì', 'Đánh giá', '']}>
          {(list.data as any[]).map((d) => (
            <tr key={d.id}>
              <Td>{fmtDate(d.drill_date)}</Td>
              <Td>
                <Badge tone="blue">{DRILL_KIND_LABELS[d.kind]}</Badge>
              </Td>
              <Td className="max-w-[240px] text-pine-800/60">{d.scenario ?? '—'}</Td>
              <Td>{d.participants ?? '—'}</Td>
              <Td className="text-pine-800/60">{d.organizer ?? '—'}</Td>
              <Td className="max-w-[220px] text-pine-800/60">{d.evaluation ?? '—'}</Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...d })}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() => window.confirm('Xóa bản ghi này?') && remove.mutate(d.id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa đợt diễn tập' : 'Ghi nhận diễn tập'}
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày">
              <Input
                type="date"
                value={form?.drill_date ?? ''}
                onChange={(e) => setForm({ ...form, drill_date: e.target.value })}
              />
            </Field>
            <Field label="Loại">
              <Select value={form?.kind ?? 'PCCC'} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {Object.entries(DRILL_KIND_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Tình huống giả định">
            <Textarea
              value={form?.scenario ?? ''}
              onChange={(e) => setForm({ ...form, scenario: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số người tham gia">
              <Input
                type="number"
                min={0}
                value={form?.participants ?? ''}
                onChange={(e) => setForm({ ...form, participants: e.target.value })}
              />
            </Field>
            <Field label="Đơn vị chủ trì">
              <Input
                value={form?.organizer ?? ''}
                onChange={(e) => setForm({ ...form, organizer: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Đánh giá / rút kinh nghiệm">
            <Textarea
              value={form?.evaluation ?? ''}
              onChange={(e) => setForm({ ...form, evaluation: e.target.value })}
            />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Nhà thầu ================= */
function PermitsTab({ fid, base, canEdit }: any) {
  const list = useList('contractor_permits', {
    match: { facility_id: fid },
    order: 'created_at',
    enabled: !!fid,
  })
  const save = useSave('contractor_permits')
  const remove = useRemove('contractor_permits')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!form.contractor_name?.trim()) return setErr('Nhập tên nhà thầu.')
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        contractor_name: form.contractor_name.trim(),
        work_description: form.work_description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        commitment_signed: !!form.commitment_signed,
        safety_briefing: !!form.safety_briefing,
        note: form.note || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const statusBadge = (p: any) => {
    if (p.end_date && daysUntil(p.end_date) < 0) return <Badge tone="gray">Hết hiệu lực</Badge>
    if (!p.commitment_signed || !p.safety_briefing) return <Badge tone="red">Thiếu điều kiện</Badge>
    return <Badge tone="green">Đủ điều kiện</Badge>
  }

  return (
    <Card>
      <CardHeader
        title="Nhà thầu & khách vào làm việc"
        hint="Điều kiện vào nhà máy: ký cam kết BVMT–AT–PCCC và huấn luyện an toàn đầu vào"
        action={
          canEdit && (
            <Button onClick={() => setForm({})}>
              <Plus size={15} /> Thêm
            </Button>
          )
        }
      />
      {(list.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có nhà thầu" />
      ) : (
        <Table head={['Nhà thầu', 'Công việc', 'Thời gian', 'Cam kết', 'Huấn luyện', 'Trạng thái', '']}>
          {(list.data as any[]).map((p) => (
            <tr key={p.id}>
              <Td className="font-medium">{p.contractor_name}</Td>
              <Td className="max-w-[220px] text-pine-800/60">{p.work_description ?? '—'}</Td>
              <Td className="text-pine-800/60">
                {fmtDate(p.start_date)} → {fmtDate(p.end_date)}
              </Td>
              <Td>{p.commitment_signed ? <Badge tone="green">Đã ký</Badge> : <Badge tone="red">Chưa</Badge>}</Td>
              <Td>{p.safety_briefing ? <Badge tone="green">Đã HL</Badge> : <Badge tone="red">Chưa</Badge>}</Td>
              <Td>{statusBadge(p)}</Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...p })}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() => window.confirm('Xóa bản ghi này?') && remove.mutate(p.id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa nhà thầu' : 'Thêm nhà thầu'}
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên nhà thầu / khách" required>
            <Input
              value={form?.contractor_name ?? ''}
              onChange={(e) => setForm({ ...form, contractor_name: e.target.value })}
            />
          </Field>
          <Field label="Nội dung công việc">
            <Textarea
              value={form?.work_description ?? ''}
              onChange={(e) => setForm({ ...form, work_description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Từ ngày">
              <Input
                type="date"
                value={form?.start_date ?? ''}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </Field>
            <Field label="Đến ngày">
              <Input
                type="date"
                value={form?.end_date ?? ''}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-pine-800">
            <input
              type="checkbox"
              className="h-4 w-4 accent-viridian-600"
              checked={!!form?.commitment_signed}
              onChange={(e) => setForm({ ...form, commitment_signed: e.target.checked })}
            />
            Đã ký cam kết BVMT – An toàn – PCCC
          </label>
          <label className="flex items-center gap-2 text-sm text-pine-800">
            <input
              type="checkbox"
              className="h-4 w-4 accent-viridian-600"
              checked={!!form?.safety_briefing}
              onChange={(e) => setForm({ ...form, safety_briefing: e.target.checked })}
            />
            Đã huấn luyện an toàn đầu vào
          </label>
          <Field label="Ghi chú">
            <Textarea value={form?.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Sự cố & CAPA ================= */
function IncidentsTab({ fid, base, canEdit }: any) {
  const list = useList('incidents', { match: { facility_id: fid }, order: 'incident_date', enabled: !!fid })
  const save = useSave('incidents')
  const remove = useRemove('incidents')
  const saveCapa = useSave('capa_actions')
  const removeCapa = useRemove('capa_actions')
  const [form, setForm] = useState<any>(null)
  const [sel, setSel] = useState<any>(null) // sự cố đang mở CAPA
  const [capaForm, setCapaForm] = useState<any>({ action: '', owner: '', due_date: '' })
  const [err, setErr] = useState('')

  const capa = useList('capa_actions', {
    match: { incident_id: sel?.id ?? '' },
    order: 'created_at',
    ascending: true,
    enabled: !!sel,
  })

  const submit = async () => {
    setErr('')
    if (!form.title?.trim()) return setErr('Nhập tiêu đề sự cố.')
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        incident_date: form.incident_date || todayISO(),
        kind: form.kind || 'moi_truong',
        severity: form.severity || 'nhe',
        title: form.title.trim(),
        description: form.description || null,
        immediate_action: form.immediate_action || null,
        root_cause: form.root_cause || null,
        status: form.status || 'open',
        reporter: form.reporter || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const addCapa = async () => {
    if (!capaForm.action?.trim()) return
    await saveCapa.mutateAsync({
      org_id: base.org_id,
      incident_id: sel.id,
      action: capaForm.action.trim(),
      owner: capaForm.owner || null,
      due_date: capaForm.due_date || null,
      status: 'open',
    })
    setCapaForm({ action: '', owner: '', due_date: '' })
  }

  const sevTone = (s: string) => (s === 'nghiem_trong' ? 'red' : s === 'trung_binh' ? 'amber' : 'gray') as any
  const stTone = (s: string) => (s === 'closed' ? 'green' : s === 'investigating' ? 'amber' : 'red') as any

  return (
    <Card>
      <CardHeader
        title="Sự cố & hành động khắc phục (CAPA)"
        hint="Ghi nhận, điều tra nguyên nhân gốc và theo dõi hành động khắc phục – phòng ngừa"
        action={
          canEdit && (
            <Button onClick={() => setForm({ incident_date: todayISO(), kind: 'moi_truong', severity: 'nhe', status: 'open' })}>
              <Plus size={15} /> Ghi nhận sự cố
            </Button>
          )
        }
      />
      {(list.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có sự cố" hint="Một tin tốt — nhưng hãy ghi nhận đầy đủ khi xảy ra" />
      ) : (
        <Table head={['Ngày', 'Sự cố', 'Loại', 'Mức độ', 'Trạng thái', '']}>
          {(list.data as any[]).map((i) => (
            <tr key={i.id}>
              <Td>{fmtDate(i.incident_date)}</Td>
              <Td>
                <div className="font-medium">{i.title}</div>
                {i.root_cause && (
                  <div className="text-xs text-pine-800/45">Nguyên nhân: {i.root_cause}</div>
                )}
              </Td>
              <Td className="text-pine-800/60">{INCIDENT_KIND_LABELS[i.kind]}</Td>
              <Td>
                <Badge tone={sevTone(i.severity)}>{SEVERITY_LABELS[i.severity]}</Badge>
              </Td>
              <Td>
                <Badge tone={stTone(i.status)}>{INCIDENT_STATUS_LABELS[i.status]}</Badge>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="outline" onClick={() => setSel(i)}>
                    CAPA
                  </Button>
                  {canEdit && (
                    <>
                      <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...i })}>
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label="Xóa"
                        onClick={() => window.confirm('Xóa sự cố này?') && remove.mutate(i.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {/* Form sự cố */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa sự cố' : 'Ghi nhận sự cố'}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tiêu đề sự cố" required>
            <Input value={form?.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Ngày xảy ra">
              <Input
                type="date"
                value={form?.incident_date ?? ''}
                onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
              />
            </Field>
            <Field label="Loại">
              <Select value={form?.kind ?? 'moi_truong'} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {Object.entries(INCIDENT_KIND_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mức độ">
              <Select value={form?.severity ?? 'nhe'} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Trạng thái">
              <Select value={form?.status ?? 'open'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(INCIDENT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Diễn biến">
            <Textarea
              value={form?.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Xử lý ban đầu">
              <Textarea
                value={form?.immediate_action ?? ''}
                onChange={(e) => setForm({ ...form, immediate_action: e.target.value })}
              />
            </Field>
            <Field label="Nguyên nhân gốc">
              <Textarea
                value={form?.root_cause ?? ''}
                onChange={(e) => setForm({ ...form, root_cause: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Người báo cáo">
            <Input value={form?.reporter ?? ''} onChange={(e) => setForm({ ...form, reporter: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>

      {/* CAPA */}
      <Modal open={!!sel} onClose={() => setSel(null)} title={'CAPA: ' + (sel?.title ?? '')} wide>
        <div className="space-y-3">
          <div className="text-sm text-pine-800/60">
            {fmtDate(sel?.incident_date)} · {INCIDENT_KIND_LABELS[sel?.kind] ?? ''} ·{' '}
            {SEVERITY_LABELS[sel?.severity] ?? ''}
          </div>
          {(capa.data ?? []).length === 0 ? (
            <EmptyState title="Chưa có hành động khắc phục" hint="Thêm hành động bên dưới" />
          ) : (
            <div className="space-y-2">
              {(capa.data as any[]).map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border border-pine-800/10 p-2.5">
                  <div className="flex-1">
                    <div className="text-sm text-pine-800">{c.action}</div>
                    <div className="text-xs text-pine-800/45">
                      {c.owner ?? '—'} · hạn {fmtDate(c.due_date)}
                    </div>
                  </div>
                  <Select
                    value={c.status}
                    onChange={(e) => saveCapa.mutate({ id: c.id, status: e.target.value, completed_date: e.target.value === 'done' ? todayISO() : null })}
                    className="max-w-[160px]"
                  >
                    {Object.entries(CAPA_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                  {canEdit && (
                    <Button variant="ghost" aria-label="Xóa" onClick={() => removeCapa.mutate(c.id)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          {canEdit && (
            <div className="flex flex-wrap items-end gap-2 rounded-lg bg-pine-800/5 p-2.5">
              <Field label="Hành động khắc phục" className="min-w-[200px] flex-1">
                <Input
                  value={capaForm.action}
                  onChange={(e) => setCapaForm({ ...capaForm, action: e.target.value })}
                />
              </Field>
              <Field label="Người phụ trách">
                <Input
                  value={capaForm.owner}
                  onChange={(e) => setCapaForm({ ...capaForm, owner: e.target.value })}
                  className="w-36"
                />
              </Field>
              <Field label="Hạn">
                <Input
                  type="date"
                  value={capaForm.due_date}
                  onChange={(e) => setCapaForm({ ...capaForm, due_date: e.target.value })}
                  className="w-40"
                />
              </Field>
              <Button onClick={addCapa}>
                <Plus size={15} /> Thêm
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Hóa chất & PATHH ================= */
function ChemicalsTab({ fid, base, canEdit }: any) {
  const list = useList('chemicals', {
    match: { facility_id: fid },
    order: 'created_at',
    ascending: true,
    enabled: !!fid,
  })
  const save = useSave('chemicals')
  const remove = useRemove('chemicals')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!form.name?.trim()) return setErr('Nhập tên hóa chất.')
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        name: form.name.trim(),
        cas_no: form.cas_no || null,
        supplier: form.supplier || null,
        storage_location: form.storage_location || null,
        quantity: form.quantity === '' || form.quantity == null ? null : Number(form.quantity),
        unit: form.unit || 'kg',
        pathh_available: !!form.pathh_available,
        pathh_url: form.pathh_url || null,
        note: form.note || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  return (
    <Card>
      <CardHeader
        title="Danh mục hóa chất & PATHH"
        hint="Phiếu an toàn hóa chất phải sẵn có tại nơi bảo quản, sang chiết"
        action={
          canEdit && (
            <Button onClick={() => setForm({ unit: 'kg' })}>
              <Plus size={15} /> Thêm hóa chất
            </Button>
          )
        }
      />
      {(list.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có hóa chất" />
      ) : (
        <Table head={['Hóa chất', 'CAS', 'Nơi bảo quản', 'Tồn', 'PATHH', '']}>
          {(list.data as any[]).map((c) => (
            <tr key={c.id}>
              <Td>
                <div className="font-medium">{c.name}</div>
                {c.supplier && <div className="text-xs text-pine-800/45">{c.supplier}</div>}
              </Td>
              <Td className="font-mono text-xs">{c.cas_no ?? '—'}</Td>
              <Td className="text-pine-800/60">{c.storage_location ?? '—'}</Td>
              <Td>{c.quantity != null ? c.quantity + ' ' + (c.unit ?? '') : '—'}</Td>
              <Td>
                {c.pathh_available ? (
                  c.pathh_url ? (
                    <a href={c.pathh_url} target="_blank" rel="noreferrer" className="text-viridian-700 underline">
                      Có · mở
                    </a>
                  ) : (
                    <Badge tone="green">Có</Badge>
                  )
                ) : (
                  <Badge tone="red">Thiếu</Badge>
                )}
              </Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...c })}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() => window.confirm('Xóa hóa chất này?') && remove.mutate(c.id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa hóa chất' : 'Thêm hóa chất'}
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên hóa chất" required>
            <Input value={form?.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số CAS">
              <Input value={form?.cas_no ?? ''} onChange={(e) => setForm({ ...form, cas_no: e.target.value })} />
            </Field>
            <Field label="Nhà cung cấp">
              <Input value={form?.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Nơi bảo quản" className="col-span-2">
              <Input
                value={form?.storage_location ?? ''}
                onChange={(e) => setForm({ ...form, storage_location: e.target.value })}
              />
            </Field>
            <Field label={'Tồn (' + (form?.unit ?? 'kg') + ')'}>
              <Input
                type="number"
                step="any"
                value={form?.quantity ?? ''}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-pine-800">
            <input
              type="checkbox"
              className="h-4 w-4 accent-viridian-600"
              checked={!!form?.pathh_available}
              onChange={(e) => setForm({ ...form, pathh_available: e.target.checked })}
            />
            Đã có Phiếu an toàn hóa chất (PATHH)
          </label>
          <Field label="Liên kết PATHH (file lưu trữ)">
            <Input
              value={form?.pathh_url ?? ''}
              onChange={(e) => setForm({ ...form, pathh_url: e.target.value })}
              placeholder="https://…"
            />
          </Field>
          <Field label="Ghi chú">
            <Textarea value={form?.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Trang ================= */
export default function SafetyPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('checklist')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">PCCC & An toàn</h1>
        <p className="text-sm text-pine-800/50">
          Checklist hiện trường · thiết bị PCCC · diễn tập · nhà thầu · sự cố & CAPA · hóa chất
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'checklist', label: 'Checklist' },
          { key: 'thiet-bi', label: 'Thiết bị PCCC' },
          { key: 'dien-tap', label: 'Diễn tập' },
          { key: 'nha-thau', label: 'Nhà thầu' },
          { key: 'su-co', label: 'Sự cố & CAPA' },
          { key: 'hoa-chat', label: 'Hóa chất' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'checklist' && <ChecklistTab fid={fid} base={base} canEdit={canEdit} />}
      {tab === 'thiet-bi' && <FireTab fid={fid} base={base} canEdit={canEdit} />}
      {tab === 'dien-tap' && <DrillsTab fid={fid} base={base} canEdit={canEdit} />}
      {tab === 'nha-thau' && <PermitsTab fid={fid} base={base} canEdit={canEdit} />}
      {tab === 'su-co' && <IncidentsTab fid={fid} base={base} canEdit={canEdit} />}
      {tab === 'hoa-chat' && <ChemicalsTab fid={fid} base={base} canEdit={canEdit} />}
    </div>
  )
}
