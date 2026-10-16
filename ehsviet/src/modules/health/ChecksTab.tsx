// Khám sức khỏe định kỳ – khám phát hiện bệnh nghề nghiệp; hồ sơ sức khỏe nghề nghiệp của NLĐ
import { useQueryClient } from '@tanstack/react-query'
import { Download, FileText, Pencil, Stethoscope, Trash2, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Kpi,
  Loading,
  Modal,
  Note,
  Select,
  Table,
  Td,
  Textarea,
  type Tone,
} from '../../components/UI'
import {
  ALLOWANCE_LABELS,
  bnnExposures,
  bnnStatus,
  DUE_STATE_LABELS,
  EXPOSURES,
  HEALTH_CHECK_KIND_LABELS,
  HEALTH_CLASS_LABELS,
  latestClass,
  periodicStatus,
  type DueStatus,
  type Exposure,
  type HealthCheck,
} from '../../lib/health'
import { supabase } from '../../lib/supabase'
import { cls, errMsg, fmtDate, todayISO } from '../../lib/utils'
import type { HealthData, HealthEmployee } from './useHealthData'

const DUE_TONE: Record<string, Tone> = { dung_han: 'green', sap_den: 'amber', qua_han: 'red', chua: 'red', khong_yeu_cau: 'gray' }

function DueBadge({ s }: { s: DueStatus }) {
  const label =
    s.state === 'qua_han' && s.due
      ? `Quá hạn ${fmtDate(s.due)}`
      : s.state === 'sap_den' && s.daysLeft !== undefined
        ? `Còn ${s.daysLeft} ngày`
        : s.state === 'dung_han' && s.due
          ? `Hạn ${fmtDate(s.due)}`
          : DUE_STATE_LABELS[s.state]
  return <Badge tone={DUE_TONE[s.state]}>{label}</Badge>
}

const needsExam = (s: DueStatus) => s.state === 'qua_han' || s.state === 'chua' || s.state === 'sap_den'

export default function ChecksTab({ data, base, canEdit }: { data: HealthData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { employees, checks, departments, loading } = data
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [onlyDue, setOnlyDue] = useState(false)
  const [exam, setExam] = useState<any>(null)
  const [bulk, setBulk] = useState<any>(null)
  const [profile, setProfile] = useState<HealthEmployee | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const rows = useMemo(
    () =>
      employees.map((e) => ({
        e,
        ksk: periodicStatus(e, checks),
        bnn: bnnStatus(e, checks),
        cls: latestClass(e.id, checks),
        disease: checks.find((c) => c.employee_id === e.id && c.disease)?.disease ?? null,
      })),
    [employees, checks]
  )

  const stats = useMemo(() => {
    const total = rows.length
    const kskOk = rows.filter((r) => r.ksk.state === 'dung_han' || r.ksk.state === 'sap_den').length
    const kskOver = rows.filter((r) => r.ksk.state === 'qua_han').length
    const kskNone = rows.filter((r) => r.ksk.state === 'chua').length
    const hazardous = rows.filter((r) => r.e.hazardous)
    const bnnNeed = rows.filter((r) => r.bnn.state !== 'khong_yeu_cau')
    const bnnBad = bnnNeed.filter((r) => r.bnn.state === 'qua_han' || r.bnn.state === 'chua').length
    const disease = rows.filter((r) => r.disease).length
    const classes: Record<string, number> = {}
    for (const r of rows) if (r.cls) classes[r.cls] = (classes[r.cls] ?? 0) + 1
    return {
      total,
      kskOk,
      kskOver,
      kskNone,
      kskPct: total ? Math.round((kskOk / total) * 100) : 0,
      hazardous: hazardous.length,
      hazardousOver: hazardous.filter((r) => r.ksk.state === 'qua_han' || r.ksk.state === 'chua').length,
      bnnNeed: bnnNeed.length,
      bnnBad,
      disease,
      classes,
    }
  }, [rows])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows
      .filter((r) => !dept || r.e.department === dept)
      .filter((r) => !s || r.e.full_name.toLowerCase().includes(s) || (r.e.code ?? '').toLowerCase().includes(s) || (r.e.position ?? '').toLowerCase().includes(s))
      .filter((r) => !onlyDue || needsExam(r.ksk) || needsExam(r.bnn))
      .sort((a, b) => (a.e.department ?? '').localeCompare(b.e.department ?? '', 'vi') || (a.e.code ?? '').localeCompare(b.e.code ?? '', 'vi'))
  }, [rows, q, dept, onlyDue])

  const run = async (fn: () => Promise<void>) => {
    setErr('')
    setBusy(true)
    try {
      await fn()
      await qc.invalidateQueries()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const saveExam = () =>
    run(async () => {
      if (!exam.employee_id) throw new Error('Chọn người lao động.')
      if (!exam.exam_date) throw new Error('Nhập ngày khám.')
      const payload = {
        employee_id: exam.employee_id,
        exam_date: exam.exam_date,
        kind: exam.kind || 'dinh_ky',
        provider: exam.provider?.trim() || null,
        health_class: exam.health_class || null,
        conclusion: exam.conclusion?.trim() || null,
        disease: exam.disease?.trim() || null,
        follow_up: exam.follow_up?.trim() || null,
        note: exam.note?.trim() || null,
      }
      const { error } = exam.id
        ? await supabase.from('health_checks').update(payload).eq('id', exam.id)
        : await supabase.from('health_checks').insert({ ...base, ...payload })
      if (error) throw error
      setExam(null)
    })

  const removeExam = (c: HealthCheck) => {
    if (!window.confirm(`Xóa kết quả ${HEALTH_CHECK_KIND_LABELS[c.kind].toLowerCase()} ngày ${fmtDate(c.exam_date)}?`)) return
    run(async () => {
      const { error } = await supabase.from('health_checks').delete().eq('id', c.id)
      if (error) throw error
    })
  }

  const saveBulk = () =>
    run(async () => {
      const ids: string[] = bulk.ids ?? []
      if (!ids.length) throw new Error('Chọn người lao động trong đợt khám.')
      if (!bulk.exam_date) throw new Error('Nhập ngày khám.')
      const recs = ids.map((employee_id) => ({
        ...base,
        employee_id,
        exam_date: bulk.exam_date,
        kind: bulk.kind || 'dinh_ky',
        provider: bulk.provider?.trim() || null,
        health_class: null,
        conclusion: null,
        disease: null,
        follow_up: null,
        note: bulk.note?.trim() || null,
      }))
      for (let i = 0; i < recs.length; i += 200) {
        const { error } = await supabase.from('health_checks').insert(recs.slice(i, i + 200))
        if (error) throw error
      }
      setBulk(null)
    })

  const saveProfile = (p: HealthEmployee) =>
    run(async () => {
      const { error } = await supabase
        .from('employees')
        .update({ hazardous: !!p.hazardous, exposures: p.exposures ?? [], allowance_level: p.allowance_level || null })
        .eq('id', p.id)
      if (error) throw error
      setProfile(null)
    })

  const exportXlsx = () =>
    run(async () => {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const sheet: any[][] = [
        [{ value: `THEO DÕI KHÁM SỨC KHỎE – BỆNH NGHỀ NGHIỆP (${fmtDate(todayISO())})`, fontWeight: 'bold', columnSpan: 11 }, ...Array(10).fill(null)],
        [],
        ['Mã', 'Họ tên', 'Bộ phận', 'Chức danh', 'Nghề NNĐHNH', 'Yếu tố tiếp xúc', 'KSK gần nhất', 'KSK – trạng thái', 'Khám BNN gần nhất', 'BNN – trạng thái', 'Phân loại SK'].map(head),
        ...shown.map((r) =>
          [
            r.e.code ?? '',
            r.e.full_name,
            r.e.department ?? '',
            r.e.position ?? '',
            r.e.hazardous ? 'Có (06 tháng/lần)' : '',
            (r.e.exposures ?? []).map((x) => EXPOSURES[x as Exposure]?.label ?? x).join(', '),
            r.ksk.last ? fmtDate(r.ksk.last.exam_date) : '',
            DUE_STATE_LABELS[r.ksk.state] + (r.ksk.due ? ` (hạn ${fmtDate(r.ksk.due)})` : ''),
            r.bnn.last ? fmtDate(r.bnn.last.exam_date) : '',
            DUE_STATE_LABELS[r.bnn.state] + (r.bnn.due ? ` (hạn ${fmtDate(r.bnn.due)})` : '') + (r.disease ? ` – ${r.disease}` : ''),
            r.cls ?? '',
          ].map((v) => ({ value: v }))
        ),
      ]
      const columns = [8, 24, 22, 20, 14, 30, 12, 24, 14, 32, 10].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns, stickyRowsCount: 3 } as any).toFile(`Kham_suc_khoe_BNN_${todayISO()}.xlsx`)
    })

  if (loading) return <Loading />

  const classText = ['I', 'II', 'III', 'IV', 'V'].map((c) => `${c}: ${stats.classes[c] ?? 0}`).join(' · ')

  return (
    <div className="space-y-4">
      {err && !exam && !bulk && !profile && <ErrorNote message={err} />}
      <div className="flex flex-wrap gap-3">
        <Kpi label="KSK định kỳ đúng hạn" value={stats.kskPct + '%'} sub={`${stats.kskOver} quá hạn · ${stats.kskNone} chưa có kết quả`} tone={stats.kskOver + stats.kskNone ? 'amber' : 'green'} />
        <Kpi label="Nghề NNĐHNH (06 tháng/lần)" value={stats.hazardous} sub={`${stats.hazardousOver} người quá hạn khám`} tone={stats.hazardousOver ? 'red' : 'green'} />
        <Kpi label="Cần khám BNN" value={stats.bnnNeed} sub={`${stats.bnnBad} người chưa khám / quá hạn`} tone={stats.bnnBad ? 'red' : 'green'} />
        <Kpi label="Nghi ngờ / mắc BNN" value={stats.disease} sub="theo dõi, giám định, bố trí việc" tone={stats.disease ? 'red' : 'gray'} />
        <Kpi label="Phân loại sức khỏe" value={<span className="text-sm">{classText}</span>} sub="lần khám gần nhất" />
      </div>

      <Card>
        <CardHeader
          title="Hồ sơ sức khỏe người lao động"
          hint="Khám định kỳ ít nhất 01 lần/năm, nghề NNĐHNH 06 tháng/lần; khám phát hiện BNN theo yếu tố tiếp xúc"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={busy} onClick={exportXlsx}>
                <Download size={15} /> Xuất Excel
              </Button>
              {canEdit && (
                <Button onClick={() => setBulk({ kind: 'dinh_ky', exam_date: todayISO(), ids: [] })}>
                  <UsersRound size={15} /> Ghi đợt khám
                </Button>
              )}
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, họ tên, chức danh…" className="max-w-[240px]" />
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-[220px]" aria-label="Lọc bộ phận">
            <option value="">Tất cả bộ phận</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-1.5 text-sm text-pine-800/70">
            <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} /> Chỉ người cần khám
          </label>
          <span className="ml-auto text-xs text-pine-800/50">{shown.length} người</span>
        </div>
        {shown.length === 0 ? (
          <EmptyState title="Không có người lao động phù hợp" hint="Thêm nhân sự tại Nhân sự & Huấn luyện" />
        ) : (
          <Table head={['Người lao động', 'Bộ phận', 'Yếu tố tiếp xúc', 'Khám định kỳ', 'Khám BNN', 'Phân loại', '']}>
            {shown.map((r) => (
              <tr key={r.e.id}>
                <Td className="min-w-[180px]">
                  <div className="font-medium">{r.e.full_name}</div>
                  <div className="text-xs text-pine-800/50">
                    {r.e.code ?? '—'} · {r.e.position ?? '—'}
                  </div>
                </Td>
                <Td className="min-w-[140px] text-pine-800/70">{r.e.department ?? '—'}</Td>
                <Td className="min-w-[170px]">
                  <div className="flex flex-wrap gap-1">
                    {r.e.hazardous && <Badge tone="blue">NNĐHNH</Badge>}
                    {(r.e.exposures ?? []).map((x) => (
                      <Badge key={x} tone="gray">
                        {EXPOSURES[x as Exposure]?.label ?? x}
                      </Badge>
                    ))}
                    {!r.e.hazardous && !(r.e.exposures ?? []).length && <span className="text-xs text-pine-800/40">—</span>}
                  </div>
                </Td>
                <Td className="whitespace-nowrap">
                  <DueBadge s={r.ksk} />
                  <div className="mt-0.5 text-xs text-pine-800/50">{r.ksk.last ? `Khám ${fmtDate(r.ksk.last.exam_date)} · ${r.ksk.intervalMonths} tháng/lần` : `${r.ksk.intervalMonths} tháng/lần`}</div>
                </Td>
                <Td className="whitespace-nowrap">
                  <DueBadge s={r.bnn} />
                  {r.disease ? (
                    <div className="mt-0.5 max-w-[200px] whitespace-normal text-xs text-red-700">{r.disease}</div>
                  ) : (
                    r.bnn.last && <div className="mt-0.5 text-xs text-pine-800/50">Khám {fmtDate(r.bnn.last.exam_date)}</div>
                  )}
                </Td>
                <Td className="text-center">{r.cls ?? '·'}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        aria-label="Ghi kết quả khám"
                        onClick={() => setExam({ employee_id: r.e.id, exam_date: todayISO(), kind: needsExam(r.bnn) && !needsExam(r.ksk) ? 'bnn' : 'dinh_ky' })}
                      >
                        <Stethoscope size={15} />
                      </Button>
                    )}
                    <Button variant="ghost" aria-label="Hồ sơ sức khỏe" onClick={() => setProfile({ ...r.e, exposures: [...(r.e.exposures ?? [])] })}>
                      <FileText size={15} />
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Note>
        Luật ATVSLĐ Điều 21: khám sức khỏe ít nhất 01 lần/năm; người làm nghề, công việc nặng nhọc, độc hại, nguy hiểm (TT 11/2020, TT 19/2023/TT-BLĐTBXH)
        06 tháng/lần; khám phát hiện bệnh nghề nghiệp cho người tiếp xúc yếu tố có hại (TT 28/2016/TT-BYT; danh mục 35 BNN – TT 60/2025/TT-BYT, từ
        15/02/2026). Xử phạt: NĐ 283/2026 Điều 33 k2–k4 (1–15 triệu/NLĐ tùy hành vi; tổ chức ×2). Quỹ BHXH hỗ trợ 50% chi phí khám BNN (NĐ 88/2020,
        tối đa 800.000 đ/người/lần) – kiểm tra hiệu lực trước khi lập hồ sơ.
      </Note>

      {/* Ghi đợt khám cho nhiều người */}
      <Modal
        open={!!bulk}
        onClose={() => setBulk(null)}
        wide
        title="Ghi đợt khám sức khỏe"
        footer={
          <>
            <Button variant="outline" onClick={() => setBulk(null)}>
              Hủy
            </Button>
            <Button disabled={busy || !bulk?.ids?.length} onClick={saveBulk}>
              Ghi {bulk?.ids?.length ?? 0} người
            </Button>
          </>
        }
      >
        {bulk && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Loại khám">
                <Select value={bulk.kind} onChange={(e) => setBulk({ ...bulk, kind: e.target.value })}>
                  {Object.entries(HEALTH_CHECK_KIND_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Ngày khám" required>
                <Input type="date" value={bulk.exam_date ?? ''} onChange={(e) => setBulk({ ...bulk, exam_date: e.target.value })} />
              </Field>
              <Field label="Cơ sở khám">
                <Input value={bulk.provider ?? ''} onChange={(e) => setBulk({ ...bulk, provider: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setBulk({ ...bulk, ids: rows.filter((r) => needsExam(r.ksk)).map((r) => r.e.id) })}>
                Đến hạn khám định kỳ ({rows.filter((r) => needsExam(r.ksk)).length})
              </Button>
              <Button variant="outline" onClick={() => setBulk({ ...bulk, ids: rows.filter((r) => needsExam(r.bnn)).map((r) => r.e.id) })}>
                Cần khám BNN ({rows.filter((r) => needsExam(r.bnn)).length})
              </Button>
              <Button variant="outline" onClick={() => setBulk({ ...bulk, ids: rows.map((r) => r.e.id) })}>
                Tất cả ({rows.length})
              </Button>
              <Button variant="ghost" onClick={() => setBulk({ ...bulk, ids: [] })}>
                Bỏ chọn
              </Button>
            </div>
            <div className="max-h-72 overflow-auto rounded-lg border border-pine-800/10">
              {departments.map((d) => {
                const list = rows.filter((r) => (r.e.department ?? '') === d)
                if (!list.length) return null
                return (
                  <div key={d} className="border-b border-pine-800/5 px-3 py-2">
                    <div className="mb-1 text-xs font-semibold text-pine-800/60">{d}</div>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {list.map((r) => {
                        const on = (bulk.ids as string[]).includes(r.e.id)
                        return (
                          <label key={r.e.id} className={cls('flex items-center gap-2 rounded px-1.5 py-1 text-sm', on && 'bg-viridian-50')}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => setBulk({ ...bulk, ids: on ? bulk.ids.filter((x: string) => x !== r.e.id) : [...bulk.ids, r.e.id] })}
                            />
                            <span className="truncate">
                              {r.e.full_name} <span className="text-xs text-pine-800/45">{r.e.code}</span>
                            </span>
                            {bulk.kind === 'bnn' ? (
                              needsExam(r.bnn) && <Badge tone={DUE_TONE[r.bnn.state]}>{DUE_STATE_LABELS[r.bnn.state]}</Badge>
                            ) : (
                              needsExam(r.ksk) && <Badge tone={DUE_TONE[r.ksk.state]}>{DUE_STATE_LABELS[r.ksk.state]}</Badge>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <Field label="Ghi chú chung">
              <Input value={bulk.note ?? ''} onChange={(e) => setBulk({ ...bulk, note: e.target.value })} />
            </Field>
            <p className="text-xs text-pine-800/50">Phân loại sức khỏe, kết luận từng người nhập sau tại biểu tượng ống nghe trên từng dòng.</p>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>

      {/* Hồ sơ sức khỏe của NLĐ */}
      <Modal
        open={!!profile}
        onClose={() => setProfile(null)}
        wide
        title={profile ? `Hồ sơ sức khỏe – ${profile.full_name}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setProfile(null)}>
              Đóng
            </Button>
            {canEdit && profile && (
              <Button disabled={busy} onClick={() => saveProfile(profile)}>
                Lưu hồ sơ
              </Button>
            )}
          </>
        }
      >
        {profile && (
          <div className="space-y-4">
            <div className="text-sm text-pine-800/70">
              {profile.code ?? '—'} · {profile.position ?? '—'} · {profile.department ?? '—'}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled={!canEdit} checked={!!profile.hazardous} onChange={(e) => setProfile({ ...profile, hazardous: e.target.checked })} />
              Nghề, công việc nặng nhọc, độc hại, nguy hiểm (khám sức khỏe 06 tháng/lần)
            </label>
            <div>
              <div className="mb-1 text-sm font-medium text-pine-800/80">Yếu tố có hại tiếp xúc</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(EXPOSURES) as Exposure[]).map((x) => {
                  const on = (profile.exposures ?? []).includes(x)
                  return (
                    <button
                      key={x}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setProfile({ ...profile, exposures: on ? (profile.exposures ?? []).filter((y) => y !== x) : [...(profile.exposures ?? []), x] })}
                      className={cls(
                        'rounded-lg border px-2.5 py-1 text-xs',
                        on ? 'border-viridian-600 bg-viridian-50 text-viridian-700' : 'border-pine-800/15 text-pine-800/60 hover:bg-pine-800/5'
                      )}
                    >
                      {EXPOSURES[x].label}
                    </button>
                  )
                })}
              </div>
              {bnnExposures(profile).length > 0 && (
                <p className="mt-1.5 text-xs text-pine-800/55">
                  Khám BNN hằng năm: {bnnExposures(profile).map((x) => `${EXPOSURES[x].disease} (${EXPOSURES[x].exam})`).join('; ')}.
                </p>
              )}
            </div>
            <Field label="Bồi dưỡng bằng hiện vật (TT 24/2022/TT-BLĐTBXH)">
              <Select
                disabled={!canEdit}
                value={profile.allowance_level ?? ''}
                onChange={(e) => setProfile({ ...profile, allowance_level: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Không hưởng</option>
                {Object.entries(ALLOWANCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v} /ngày
                  </option>
                ))}
              </Select>
            </Field>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-pine-800/80">Lịch sử khám</span>
                {canEdit && (
                  <Button variant="ghost" onClick={() => setExam({ employee_id: profile.id, exam_date: todayISO(), kind: 'dinh_ky' })}>
                    <Stethoscope size={15} /> Thêm
                  </Button>
                )}
              </div>
              {checks.filter((c) => c.employee_id === profile.id).length === 0 ? (
                <p className="text-xs text-pine-800/50">Chưa có kết quả khám.</p>
              ) : (
                <ul className="divide-y divide-pine-800/5 rounded-lg border border-pine-800/10">
                  {checks
                    .filter((c) => c.employee_id === profile.id)
                    .sort((a, b) => b.exam_date.localeCompare(a.exam_date))
                    .map((c) => (
                      <li key={c.id} className="flex items-start justify-between gap-2 px-3 py-2 text-sm">
                        <div>
                          <div>
                            <b>{fmtDate(c.exam_date)}</b> · {HEALTH_CHECK_KIND_LABELS[c.kind]}
                            {c.health_class && <span> · Loại {c.health_class}</span>}
                          </div>
                          <div className="text-xs text-pine-800/55">
                            {[c.provider, c.conclusion].filter(Boolean).join(' · ') || '—'}
                          </div>
                          {c.disease && <div className="text-xs text-red-700">{c.disease}</div>}
                          {c.follow_up && <div className="text-xs text-pine-800/55">Theo dõi: {c.follow_up}</div>}
                        </div>
                        {canEdit && (
                          <div className="flex shrink-0 gap-1">
                            <Button variant="ghost" aria-label="Sửa kết quả khám" onClick={() => setExam({ ...c })}>
                              <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" aria-label="Xóa kết quả khám" onClick={() => removeExam(c)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
      {/* Ghi kết quả khám từng người – đặt cuối để nổi trên hồ sơ khi mở từ lịch sử */}
      <Modal
        open={!!exam}
        onClose={() => setExam(null)}
        title={exam?.id ? 'Sửa kết quả khám' : 'Ghi kết quả khám'}
        footer={
          <>
            <Button variant="outline" onClick={() => setExam(null)}>
              Hủy
            </Button>
            <Button disabled={busy} onClick={saveExam}>
              Lưu
            </Button>
          </>
        }
      >
        {exam && (
          <div className="space-y-3">
            <Field label="Người lao động" required>
              <Select value={exam.employee_id ?? ''} onChange={(e) => setExam({ ...exam, employee_id: e.target.value })}>
                <option value="">— Chọn —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code ? e.code + ' · ' : ''}
                    {e.full_name} – {e.department ?? ''}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loại khám">
                <Select value={exam.kind ?? 'dinh_ky'} onChange={(e) => setExam({ ...exam, kind: e.target.value })}>
                  {Object.entries(HEALTH_CHECK_KIND_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Ngày khám" required>
                <Input type="date" value={exam.exam_date ?? ''} onChange={(e) => setExam({ ...exam, exam_date: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cơ sở khám">
                <Input value={exam.provider ?? ''} onChange={(e) => setExam({ ...exam, provider: e.target.value })} />
              </Field>
              <Field label="Phân loại sức khỏe">
                <Select value={exam.health_class ?? ''} onChange={(e) => setExam({ ...exam, health_class: e.target.value })}>
                  <option value="">—</option>
                  {Object.entries(HEALTH_CLASS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Kết luận">
              <Input value={exam.conclusion ?? ''} onChange={(e) => setExam({ ...exam, conclusion: e.target.value })} placeholder="VD: Đủ sức khỏe làm việc" />
            </Field>
            <Field label="Bệnh nghề nghiệp phát hiện / nghi ngờ">
              <Input list="bnn-list" value={exam.disease ?? ''} onChange={(e) => setExam({ ...exam, disease: e.target.value })} />
              <datalist id="bnn-list">
                {Object.values(EXPOSURES)
                  .filter((x) => x.disease)
                  .map((x) => (
                    <option key={x.disease!} value={x.disease!} />
                  ))}
              </datalist>
            </Field>
            <Field label="Theo dõi, điều trị, giám định, bố trí công việc">
              <Textarea rows={2} value={exam.follow_up ?? ''} onChange={(e) => setExam({ ...exam, follow_up: e.target.value })} />
            </Field>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>

    </div>
  )
}
