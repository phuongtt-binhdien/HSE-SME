// Quan trắc môi trường lao động: đợt đo, kết quả theo vị trí × yếu tố, việc phải làm sau đợt đo
import { useQueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { CalendarPlus, Check, Download, FileUp, Pencil, Plus, Trash2 } from 'lucide-react'
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
  fmtMinutes,
  HEAT_LIMITS,
  limitText,
  noiseAllowedMinutes,
  pctOfLimit,
  resultLabel,
  summarizeWem,
  TOXIC_PRESETS,
  toxicPreset,
  FACTOR_DEFAULT_LIMITS,
  WEM_FACTORS,
  WEM_STATUS_LABELS,
  wemActions,
  wemKey,
  wemStatus,
  WORK_INTENSITY_LABELS,
  type WemAction,
  type WemFactor,
  type WemResult,
  type WemStatus,
} from '../../lib/health'
import { supabase } from '../../lib/supabase'
import { cls, errMsg, fmtDate, fmtNum, todayISO } from '../../lib/utils'
import { parseDelimited, readSpreadsheetFile } from '../personnel/excel'
import { DepartmentInput } from '../personnel/shared'
import type { HealthData } from './useHealthData'
import { downloadWemTemplate, parseWemRows, type ParsedWem } from './wemImport'

export const WEM_TONE: Record<WemStatus, Tone> = { dat: 'green', canh_bao: 'amber', khong_dat: 'red', khong_phan_loai: 'gray' }

const STATUS_ORDER: Record<WemStatus, number> = { khong_dat: 0, canh_bao: 1, khong_phan_loai: 2, dat: 3 }

const n = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v))

export default function WemTab({ data, base, canEdit }: { data: HealthData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { campaigns, results, departments, tasks, loading } = data
  const [cid, setCid] = useState('')
  const [dept, setDept] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [factorFilter, setFactorFilter] = useState('')
  const [campForm, setCampForm] = useState<any>(null)
  const [resForm, setResForm] = useState<any>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const campaign = campaigns.find((c) => c.id === cid) ?? campaigns[0] ?? null
  const prevCampaign = campaign ? campaigns.find((c) => c.sample_date < campaign.sample_date) ?? null : null
  const rows = useMemo(() => results.filter((r) => r.campaign_id === campaign?.id), [results, campaign?.id])
  const prevMap = useMemo(
    () => new Map(results.filter((r) => r.campaign_id === prevCampaign?.id).map((r) => [wemKey(r), r])),
    [results, prevCampaign?.id]
  )
  const summary = useMemo(() => summarizeWem(rows), [rows])
  const actions = useMemo(() => wemActions(campaign, rows), [campaign, rows])
  const openTaskTitles = useMemo(() => new Set(tasks.filter((t) => t.status !== 'done').map((t) => t.title)), [tasks])

  const shown = useMemo(
    () =>
      rows
        .filter((r) => !dept || r.department === dept)
        .filter((r) => !statusFilter || wemStatus(r) === statusFilter)
        .filter((r) => !factorFilter || r.factor === factorFilter)
        .sort(
          (a, b) =>
            (a.department ?? '').localeCompare(b.department ?? '', 'vi') ||
            a.position.localeCompare(b.position, 'vi') ||
            a.factor.localeCompare(b.factor)
        ),
    [rows, dept, statusFilter, factorFilter]
  )

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

  // ---------- Đợt quan trắc ----------
  const saveCampaign = () =>
    run(async () => {
      if (!campForm.sample_date) throw new Error('Nhập ngày đo.')
      const payload = {
        sample_date: campForm.sample_date,
        provider: campForm.provider?.trim() || null,
        report_no: campForm.report_no?.trim() || null,
        report_date: campForm.report_date || null,
        published_date: campForm.published_date || null,
        note: campForm.note?.trim() || null,
      }
      if (campForm.id) {
        const { error } = await supabase.from('wem_campaigns').update(payload).eq('id', campForm.id)
        if (error) throw error
      } else {
        const { data: created, error } = await supabase.from('wem_campaigns').insert({ ...base, ...payload }).select()
        if (error) throw error
        if (created?.[0]?.id) setCid(created[0].id)
      }
      setCampForm(null)
    })

  const removeCampaign = () => {
    if (!campaign) return
    if (!window.confirm(`Xóa đợt quan trắc ngày ${fmtDate(campaign.sample_date)} cùng ${rows.length} kết quả?`)) return
    run(async () => {
      const { error } = await supabase.from('wem_campaigns').delete().eq('id', campaign.id)
      if (error) throw error
      setCid('')
    })
  }

  const markPublished = () =>
    run(async () => {
      if (!campaign) return
      const { error } = await supabase.from('wem_campaigns').update({ published_date: todayISO() }).eq('id', campaign.id)
      if (error) throw error
    })

  // ---------- Kết quả ----------
  const openNewResult = () =>
    setResForm({ factor: 'nhiet_do', work_intensity: 'vua', limit_min: HEAT_LIMITS.vua.min, limit_max: HEAT_LIMITS.vua.max, unit: '°C' })

  const changeFactor = (factor: WemFactor) => {
    const meta = WEM_FACTORS[factor]
    const next: any = { ...resForm, factor, unit: meta.unit || resForm.unit || '', parameter: '' }
    if (factor === 'nhiet_do') {
      const lim = HEAT_LIMITS[resForm.work_intensity || 'vua']
      Object.assign(next, { work_intensity: resForm.work_intensity || 'vua', limit_min: lim.min, limit_max: lim.max })
    } else {
      const def = FACTOR_DEFAULT_LIMITS[factor]
      Object.assign(next, { limit_min: def?.min ?? '', limit_max: def?.max ?? '' })
    }
    setResForm(next)
  }

  const saveResult = (keepOpen: boolean) =>
    run(async () => {
      if (!campaign) throw new Error('Chọn hoặc tạo đợt quan trắc trước.')
      if (!resForm.position?.trim()) throw new Error('Nhập vị trí đo.')
      const payload = {
        department: resForm.department?.trim() || null,
        position: resForm.position.trim(),
        factor: resForm.factor,
        parameter: resForm.parameter?.trim() || null,
        unit: resForm.unit?.trim() || null,
        value: n(resForm.value),
        limit_min: n(resForm.limit_min),
        limit_max: n(resForm.limit_max),
        work_intensity: resForm.factor === 'nhiet_do' ? resForm.work_intensity || null : null,
        exposed_count: n(resForm.exposed_count),
        note: resForm.note?.trim() || null,
      }
      const { error } = resForm.id
        ? await supabase.from('wem_results').update(payload).eq('id', resForm.id)
        : await supabase.from('wem_results').insert({ ...base, campaign_id: campaign.id, ...payload })
      if (error) throw error
      // "Lưu và thêm tiếp": giữ bộ phận, vị trí, yếu tố, giới hạn để nhập nhanh mẫu kế tiếp
      setResForm(keepOpen ? { ...resForm, id: undefined, value: '', note: '' } : null)
    })

  const removeResult = (r: WemResult) => {
    if (!window.confirm(`Xóa kết quả "${resultLabel(r)}" tại ${r.position}?`)) return
    run(async () => {
      const { error } = await supabase.from('wem_results').delete().eq('id', r.id)
      if (error) throw error
    })
  }

  // ---------- Việc phải làm → Lịch tuân thủ ----------
  const createTask = (a: WemAction) =>
    run(async () => {
      const due = format(addDays(new Date(), a.priority === 'cao' ? 15 : 30), 'yyyy-MM-dd')
      const { error } = await supabase.from('compliance_tasks').insert({
        ...base,
        title: a.title,
        description: `${a.detail}\nCăn cứ: ${a.basis}${campaign ? `\nĐợt quan trắc ngày ${fmtDate(campaign.sample_date)}.` : ''}`,
        category: a.category,
        due_date: due,
        recurrence: 'none',
        remind_days: 7,
        assigned_to: 'Bộ phận ATVSLĐ',
        status: 'pending',
      })
      if (error) throw error
    })

  // ---------- Xuất Excel ----------
  const exportXlsx = () =>
    run(async () => {
      if (!campaign) return
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const title = `KẾT QUẢ QUAN TRẮC MÔI TRƯỜNG LAO ĐỘNG – ĐỢT ${fmtDate(campaign.sample_date)}`
      const sheet: any[][] = [
        [{ value: title, fontWeight: 'bold', columnSpan: 12 }, ...Array(11).fill(null)],
        [`Tổ chức quan trắc: ${campaign.provider ?? '—'} · Báo cáo: ${campaign.report_no ?? '—'} ${campaign.report_date ? 'ngày ' + fmtDate(campaign.report_date) : ''} · Công khai: ${campaign.published_date ? fmtDate(campaign.published_date) : 'chưa'}`],
        [`Tổng ${summary.total} mẫu: đạt ${summary.dat}; ≥ 80% giới hạn ${summary.canhBao}; không đạt ${summary.khongDat}; không phân loại ${summary.khongPhanLoai}.`],
        [],
        ['Bộ phận', 'Vị trí đo', 'Yếu tố', 'Thông số', 'ĐVT', 'Kết quả', 'Giới hạn', '% giới hạn', 'Đánh giá', `Kỳ trước${prevCampaign ? ' (' + fmtDate(prevCampaign.sample_date) + ')' : ''}`, 'Số NLĐ', 'Ghi chú'].map(head),
        ...[...rows]
          .sort((a, b) => STATUS_ORDER[wemStatus(a)] - STATUS_ORDER[wemStatus(b)] || (a.department ?? '').localeCompare(b.department ?? '', 'vi'))
          .map((r) => {
            const prev = prevMap.get(wemKey(r))
            const pct = pctOfLimit(r)
            const allowed = r.factor === 'on' ? noiseAllowedMinutes(r.value) : null
            return [
              r.department ?? '',
              r.position,
              WEM_FACTORS[r.factor]?.label ?? r.factor,
              r.parameter ?? '',
              r.unit ?? '',
              r.value ?? null,
              limitText(r),
              pct === null ? '' : Math.round(pct) + '%',
              WEM_STATUS_LABELS[wemStatus(r)],
              prev?.value ?? null,
              r.exposed_count ?? null,
              [r.note, allowed ? `Thời gian tiếp xúc cho phép ≈ ${fmtMinutes(allowed)}/ca` : null].filter(Boolean).join('; '),
            ].map((v) => (v === null ? null : { value: v }))
          }),
        [],
        [{ value: 'VIỆC PHẢI LÀM SAU ĐỢT ĐO', fontWeight: 'bold' }],
        ...actions.map((a, i) => [{ value: `${i + 1}. ${a.title}` }, null, null, { value: a.detail, wrap: true, columnSpan: 6 }, null, null, null, null, null, { value: a.basis, wrap: true, columnSpan: 3 }, null, null]),
      ]
      const columns = [22, 22, 16, 22, 8, 9, 11, 9, 12, 11, 8, 36].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`QTMTLD_${campaign.sample_date}.xlsx`)
    })

  if (loading) return <Loading />

  const pass = summary.total - summary.khongPhanLoai
  const passPct = pass ? Math.round(((summary.dat + summary.canhBao) / pass) * 100) : 0

  return (
    <div className="space-y-4">
      {err && !campForm && !resForm && !importOpen && <ErrorNote message={err} />}
      <Card>
        <CardHeader
          title="Đợt quan trắc môi trường lao động"
          hint="Luật ATVSLĐ Điều 18: ít nhất 01 lần/năm; đo cùng mùa để so sánh giữa các năm"
          action={
            <div className="flex flex-wrap gap-2">
              {campaigns.length > 0 && (
                <Select value={campaign?.id ?? ''} onChange={(e) => setCid(e.target.value)} className="max-w-[200px]" aria-label="Chọn đợt quan trắc">
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      Đợt {fmtDate(c.sample_date)}
                    </option>
                  ))}
                </Select>
              )}
              {canEdit && (
                <Button variant="outline" onClick={() => setCampForm({ sample_date: todayISO() })}>
                  <Plus size={15} /> Thêm đợt
                </Button>
              )}
              {campaign && (
                <Button variant="outline" disabled={busy} onClick={exportXlsx}>
                  <Download size={15} /> Xuất Excel
                </Button>
              )}
            </div>
          }
        />
        {!campaign ? (
          <EmptyState title="Chưa có đợt quan trắc" hint="Thêm đợt (ngày đo, tổ chức quan trắc, số báo cáo) rồi nhập kết quả hoặc nhập từ Excel" />
        ) : (
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-pine-800/70">
              <span>
                Ngày đo <b className="text-pine-800">{fmtDate(campaign.sample_date)}</b>
              </span>
              {campaign.provider && <span>{campaign.provider}</span>}
              {campaign.report_no && (
                <span>
                  Báo cáo {campaign.report_no}
                  {campaign.report_date ? ` ngày ${fmtDate(campaign.report_date)}` : ''}
                </span>
              )}
              {campaign.published_date ? (
                <Badge tone="green">Đã công khai {fmtDate(campaign.published_date)}</Badge>
              ) : (
                <Badge tone="red">Chưa công khai cho NLĐ</Badge>
              )}
              {canEdit && (
                <span className="flex gap-1">
                  {!campaign.published_date && (
                    <Button variant="ghost" disabled={busy} onClick={markPublished}>
                      <Check size={15} /> Đã công khai hôm nay
                    </Button>
                  )}
                  <Button variant="ghost" aria-label="Sửa đợt" onClick={() => setCampForm({ ...campaign })}>
                    <Pencil size={15} />
                  </Button>
                  <Button variant="ghost" aria-label="Xóa đợt" onClick={removeCampaign}>
                    <Trash2 size={15} />
                  </Button>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Kpi label="Số mẫu" value={summary.total} sub={summary.khongPhanLoai ? `${summary.khongPhanLoai} không phân loại` : 'đã phân loại đủ'} />
              <Kpi label="Đạt" value={passPct + '%'} sub={`${summary.dat + summary.canhBao}/${pass} mẫu phân loại`} tone="green" />
              <Kpi label="Không đạt" value={summary.khongDat} sub={`${summary.positionsFailed} vị trí`} tone={summary.khongDat ? 'red' : 'green'} />
              <Kpi label="≥ 80% giới hạn" value={summary.canhBao} sub="bụi, hơi khí độc – theo dõi" tone={summary.canhBao ? 'amber' : 'gray'} />
              <Kpi label="NLĐ ở vị trí không đạt" value={summary.exposedFailed} sub="cần khám BNN, bồi dưỡng" tone={summary.exposedFailed ? 'red' : 'gray'} />
            </div>
            {summary.byFactor.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {summary.byFactor.map((f) => (
                  <button
                    key={f.factor}
                    onClick={() => setFactorFilter(factorFilter === f.factor ? '' : f.factor)}
                    className={cls(
                      'rounded-lg border px-2.5 py-1 text-xs',
                      factorFilter === f.factor ? 'border-pine-900 bg-pine-900 text-white' : 'border-pine-800/15 text-pine-800/70 hover:bg-pine-800/5'
                    )}
                  >
                    {WEM_FACTORS[f.factor]?.label ?? f.factor}: {f.total} mẫu
                    {f.khongDat > 0 && <b className={factorFilter === f.factor ? '' : 'text-red-700'}> · {f.khongDat} không đạt</b>}
                    {f.canhBao > 0 && <span className={factorFilter === f.factor ? '' : 'text-amber-700'}> · {f.canhBao} ≥ 80%</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {campaign && actions.length > 0 && (
        <Card>
          <CardHeader title="Việc phải làm sau đợt đo" hint="Luật ATVSLĐ Điều 18 · NĐ 44/2016 Điều 37 · đưa vào Lịch tuân thủ để theo dõi hạn" />
          <ul className="divide-y divide-pine-800/5">
            {actions.map((a) => {
              const exists = openTaskTitles.has(a.title)
              return (
                <li key={a.key} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={a.priority === 'cao' ? 'red' : 'amber'}>{a.priority === 'cao' ? 'Ưu tiên' : 'Cần làm'}</Badge>
                      <span className="text-sm font-medium text-pine-800">{a.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-pine-800/65">{a.detail}</p>
                    <p className="mt-0.5 text-[11px] text-pine-800/45">Căn cứ: {a.basis}</p>
                  </div>
                  {canEdit &&
                    (exists ? (
                      <Badge tone="green">Đã có trong lịch</Badge>
                    ) : (
                      <Button variant="outline" disabled={busy} onClick={() => createTask(a)}>
                        <CalendarPlus size={15} /> Tạo việc
                      </Button>
                    ))}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {campaign && (
        <Card>
          <CardHeader
            title={`Kết quả theo vị trí (${shown.length}/${rows.length})`}
            hint={prevCampaign ? `So sánh với đợt ${fmtDate(prevCampaign.sample_date)}` : 'Chưa có đợt trước để so sánh'}
            action={
              canEdit && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setImportOpen(true)}>
                    <FileUp size={15} /> Nhập từ Excel
                  </Button>
                  <Button onClick={openNewResult}>
                    <Plus size={15} /> Thêm kết quả
                  </Button>
                </div>
              )
            }
          />
          <div className="flex flex-wrap gap-2 border-b border-pine-800/10 px-4 py-3">
            <Select value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-[220px]" aria-label="Lọc bộ phận">
              <option value="">Tất cả bộ phận</option>
              {[...new Set(rows.map((r) => r.department).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'vi')).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[200px]" aria-label="Lọc đánh giá">
              <option value="">Tất cả đánh giá</option>
              {Object.entries(WEM_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Select value={factorFilter} onChange={(e) => setFactorFilter(e.target.value)} className="max-w-[200px]" aria-label="Lọc yếu tố">
              <option value="">Tất cả yếu tố</option>
              {Object.entries(WEM_FACTORS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="Đợt này chưa có kết quả" hint="Thêm từng kết quả hoặc nhập từ file Excel của báo cáo quan trắc" />
          ) : (
            <Table head={['Bộ phận / vị trí', 'Yếu tố', 'Kết quả', 'Giới hạn', '% GH', 'Kỳ trước', 'Đánh giá', 'NLĐ', '']}>
              {shown.map((r) => {
                const st = wemStatus(r)
                const pct = pctOfLimit(r)
                const prev = prevMap.get(wemKey(r))
                const allowed = r.factor === 'on' ? noiseAllowedMinutes(r.value) : null
                return (
                  <tr key={r.id} className={st === 'khong_dat' ? 'bg-red-50/40' : undefined}>
                    <Td className="min-w-[170px]">
                      <div className="font-medium">{r.position}</div>
                      <div className="text-xs text-pine-800/50">{r.department ?? '—'}</div>
                    </Td>
                    <Td className="min-w-[150px]">
                      {WEM_FACTORS[r.factor]?.label ?? r.factor}
                      {r.parameter && <div className="text-xs text-pine-800/55">{r.parameter}</div>}
                      {r.work_intensity && <div className="text-xs text-pine-800/45">{WORK_INTENSITY_LABELS[r.work_intensity]}</div>}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <b className={st === 'khong_dat' ? 'text-red-700' : 'text-pine-800'}>{r.value === null || r.value === undefined ? '—' : fmtNum(r.value, 3)}</b>{' '}
                      <span className="text-xs text-pine-800/50">{r.unit}</span>
                      {allowed !== null && <div className="text-xs text-red-700">cho phép ≈ {fmtMinutes(allowed)}/ca</div>}
                      {r.note && <div className="max-w-[220px] whitespace-normal text-xs text-pine-800/50">{r.note}</div>}
                    </Td>
                    <Td className="whitespace-nowrap text-pine-800/70">{limitText(r)}</Td>
                    <Td className="whitespace-nowrap text-pine-800/70">{pct === null ? '—' : Math.round(pct) + '%'}</Td>
                    <Td className="whitespace-nowrap text-pine-800/60">
                      {prev?.value !== null && prev?.value !== undefined ? fmtNum(prev.value, 3) : '—'}
                      {prev && wemStatus(prev) === 'khong_dat' && <div className="text-[11px] text-red-700">không đạt</div>}
                    </Td>
                    <Td>
                      <Badge tone={WEM_TONE[st]}>{WEM_STATUS_LABELS[st]}</Badge>
                    </Td>
                    <Td className="text-center">{r.exposed_count ?? '·'}</Td>
                    <Td className="text-right">
                      {canEdit && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" aria-label="Sửa kết quả" onClick={() => setResForm({ ...r })}>
                            <Pencil size={15} />
                          </Button>
                          <Button variant="ghost" aria-label="Xóa kết quả" onClick={() => removeResult(r)}>
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </Table>
          )}
        </Card>
      )}

      <Note>
        Giới hạn theo QCVN của Bộ Y tế: vi khí hậu QCVN 26:2016 (nhiệt độ lao động nhẹ 20–34 °C, vừa 18–32 °C, nặng 16–30 °C; độ ẩm 40–80%; tốc độ gió
        0,2–1,5 m/s); tiếng ồn QCVN 24:2016 (85 dBA cho 8 giờ, tăng 3 dBA giảm một nửa thời gian tiếp xúc); bụi QCVN 02:2019 (bụi chứa silic theo hàm
        lượng SiO₂); hơi khí độc QCVN 03:2019 (TWA: NH₃ 17, CO 20, SO₂ 5, NO₂ 5 mg/m³). Mẫu từ 80% giới hạn (bụi, hơi khí độc) được đánh dấu để khám
        BNN, cải thiện sớm. Xử phạt: không quan trắc 20–40 triệu, không công khai 2–5 triệu (NĐ 283/2026 Điều 38; tổ chức ×2).
      </Note>

      {/* Đợt quan trắc */}
      <Modal
        open={!!campForm}
        onClose={() => setCampForm(null)}
        title={campForm?.id ? 'Sửa đợt quan trắc' : 'Thêm đợt quan trắc MTLĐ'}
        footer={
          <>
            <Button variant="outline" onClick={() => setCampForm(null)}>
              Hủy
            </Button>
            <Button disabled={busy} onClick={saveCampaign}>
              Lưu
            </Button>
          </>
        }
      >
        {campForm && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày đo" required>
                <Input type="date" value={campForm.sample_date ?? ''} onChange={(e) => setCampForm({ ...campForm, sample_date: e.target.value })} />
              </Field>
              <Field label="Ngày công khai cho NLĐ">
                <Input type="date" value={campForm.published_date ?? ''} onChange={(e) => setCampForm({ ...campForm, published_date: e.target.value })} />
              </Field>
            </div>
            <Field label="Tổ chức quan trắc (đủ điều kiện)">
              <Input value={campForm.provider ?? ''} onChange={(e) => setCampForm({ ...campForm, provider: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số báo cáo">
                <Input value={campForm.report_no ?? ''} onChange={(e) => setCampForm({ ...campForm, report_no: e.target.value })} />
              </Field>
              <Field label="Ngày báo cáo">
                <Input type="date" value={campForm.report_date ?? ''} onChange={(e) => setCampForm({ ...campForm, report_date: e.target.value })} />
              </Field>
            </div>
            <Field label="Ghi chú (sai sót báo cáo cần đề nghị hiệu chỉnh…)">
              <Textarea rows={3} value={campForm.note ?? ''} onChange={(e) => setCampForm({ ...campForm, note: e.target.value })} />
            </Field>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>

      {/* Kết quả */}
      <Modal
        open={!!resForm}
        onClose={() => setResForm(null)}
        title={resForm?.id ? 'Sửa kết quả quan trắc' : 'Thêm kết quả quan trắc'}
        footer={
          <>
            <Button variant="outline" onClick={() => setResForm(null)}>
              Đóng
            </Button>
            {!resForm?.id && (
              <Button variant="outline" disabled={busy} onClick={() => saveResult(true)}>
                Lưu và thêm tiếp
              </Button>
            )}
            <Button disabled={busy} onClick={() => saveResult(false)}>
              Lưu
            </Button>
          </>
        }
      >
        {resForm && (
          <ResultForm form={resForm} setForm={setResForm} departments={departments} changeFactor={changeFactor} err={err} />
        )}
      </Modal>

      {campaign && (
        <ImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          campaignLabel={`Đợt ${fmtDate(campaign.sample_date)}`}
          onImport={(parsed) =>
            run(async () => {
              const rowsToInsert = parsed.map((p) => ({ ...base, campaign_id: campaign.id, ...p }))
              for (let i = 0; i < rowsToInsert.length; i += 200) {
                const { error } = await supabase.from('wem_results').insert(rowsToInsert.slice(i, i + 200))
                if (error) throw error
              }
              setImportOpen(false)
            })
          }
          busy={busy}
          err={err}
        />
      )}
    </div>
  )
}

function ResultForm({
  form,
  setForm,
  departments,
  changeFactor,
  err,
}: {
  form: any
  setForm: (f: any) => void
  departments: string[]
  changeFactor: (f: WemFactor) => void
  err: string
}) {
  const meta = WEM_FACTORS[form.factor as WemFactor]
  const preview: WemResult = {
    id: '',
    campaign_id: '',
    position: form.position ?? '',
    factor: form.factor,
    value: n(form.value),
    limit_min: n(form.limit_min),
    limit_max: n(form.limit_max),
  }
  const st = wemStatus(preview)
  const allowed = form.factor === 'on' ? noiseAllowedMinutes(n(form.value)) : null
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bộ phận">
          <DepartmentInput value={form.department ?? ''} onChange={(v) => setForm({ ...form, department: v })} departments={departments} />
        </Field>
        <Field label="Vị trí đo" required>
          <Input value={form.position ?? ''} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="VD: Thùng sấy quay" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Yếu tố">
          <Select value={form.factor} onChange={(e) => changeFactor(e.target.value as WemFactor)}>
            {Object.entries(WEM_FACTORS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </Field>
        {form.factor === 'nhiet_do' ? (
          <Field label="Cường độ lao động">
            <Select
              value={form.work_intensity ?? 'vua'}
              onChange={(e) => setForm({ ...form, work_intensity: e.target.value, limit_min: HEAT_LIMITS[e.target.value].min, limit_max: HEAT_LIMITS[e.target.value].max })}
            >
              {Object.entries(WORK_INTENSITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v} ({HEAT_LIMITS[k].min}–{HEAT_LIMITS[k].max} °C)
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Thông số">
            <Input
              list={form.factor === 'hoi_khi_doc' ? 'wem-gases' : undefined}
              value={form.parameter ?? ''}
              onChange={(e) => {
                const p = toxicPreset(e.target.value)
                setForm({ ...form, parameter: e.target.value, ...(p && form.factor === 'hoi_khi_doc' ? { limit_max: p.max, limit_min: '' } : {}) })
              }}
              placeholder={form.factor === 'hoi_khi_doc' ? 'NH₃, CO, SO₂…' : form.factor === 'bui_silic' ? 'Bụi hô hấp chứa silic' : ''}
            />
            <datalist id="wem-gases">
              {TOXIC_PRESETS.map((t) => (
                <option key={t.parameter} value={t.parameter} />
              ))}
            </datalist>
          </Field>
        )}
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Field label="Kết quả" className="col-span-2 sm:col-span-1">
          <Input type="number" step="any" value={form.value ?? ''} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        </Field>
        <Field label="Đơn vị" className="col-span-2 sm:col-span-1">
          <Input value={form.unit ?? ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </Field>
        <Field label="GH dưới" className="col-span-2 sm:col-span-1">
          <Input type="number" step="any" value={form.limit_min ?? ''} onChange={(e) => setForm({ ...form, limit_min: e.target.value })} />
        </Field>
        <Field label="GH trên" className="col-span-2 sm:col-span-1">
          <Input type="number" step="any" value={form.limit_max ?? ''} onChange={(e) => setForm({ ...form, limit_max: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Số NLĐ tiếp xúc">
          <Input type="number" min={0} value={form.exposed_count ?? ''} onChange={(e) => setForm({ ...form, exposed_count: e.target.value })} />
        </Field>
        <Field label="Ghi chú">
          <Input value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-pine-800/60">
        <span>Đánh giá:</span>
        <Badge tone={WEM_TONE[st]}>{WEM_STATUS_LABELS[st]}</Badge>
        {allowed !== null && <span className="text-red-700">Thời gian tiếp xúc cho phép ≈ {fmtMinutes(allowed)}/ca</span>}
        {meta?.basis && <span>· {meta.basis}</span>}
      </div>
      {err && <ErrorNote message={err} />}
    </div>
  )
}

function ImportModal({
  open,
  onClose,
  onImport,
  campaignLabel,
  busy,
  err,
}: {
  open: boolean
  onClose: () => void
  onImport: (rows: ParsedWem[]) => void
  campaignLabel: string
  busy: boolean
  err: string
}) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ReturnType<typeof parseWemRows> | undefined>(undefined)
  const [readErr, setReadErr] = useState('')

  const parse = (rows: ReturnType<typeof parseDelimited>) => {
    const res = parseWemRows(rows)
    setParsed(res)
    setReadErr(res ? '' : 'Không tìm thấy dòng tiêu đề: cần tối thiểu các cột "Vị trí", "Yếu tố" hoặc "Kết quả". Tải file mẫu để xem cách đặt cột.')
  }

  const onFile = async (f?: File | null) => {
    if (!f) return
    setReadErr('')
    try {
      parse(await readSpreadsheetFile(f))
    } catch (e) {
      setReadErr(errMsg(e))
    }
  }

  const close = () => {
    setText('')
    setParsed(undefined)
    setReadErr('')
    onClose()
  }

  const counts = useMemo(() => {
    const c: Record<WemStatus, number> = { dat: 0, canh_bao: 0, khong_dat: 0, khong_phan_loai: 0 }
    for (const p of parsed?.parsed ?? []) c[wemStatus({ id: '', campaign_id: '', ...p })]++
    return c
  }, [parsed])

  return (
    <Modal
      open={open}
      onClose={close}
      wide
      title={`Nhập kết quả QTMTLĐ – ${campaignLabel}`}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button disabled={busy || !parsed?.parsed.length} onClick={() => onImport(parsed!.parsed)}>
            Ghi {parsed?.parsed.length ?? 0} kết quả
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-pine-800/20 px-3 py-2 text-sm font-medium text-pine-800 hover:bg-pine-800/5">
            <FileUp size={15} /> Chọn file .xlsx / .csv
            <input type="file" accept=".xlsx,.csv,.tsv,.txt" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <Button variant="ghost" onClick={() => downloadWemTemplate()}>
            <Download size={15} /> Tải file mẫu
          </Button>
        </div>
        <Field label="Hoặc dán bảng từ Excel (gồm dòng tiêu đề)">
          <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Bộ phận\tVị trí đo\tYếu tố\tThông số\tĐơn vị tính\tKết quả\tGiới hạn…'} />
        </Field>
        <Button variant="outline" disabled={!text.trim()} onClick={() => parse(parseDelimited(text))}>
          Đọc dữ liệu đã dán
        </Button>
        {readErr && <ErrorNote message={readErr} />}
        {parsed && (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge tone="gray">{parsed.parsed.length} dòng hợp lệ</Badge>
              <Badge tone="green">{counts.dat} đạt</Badge>
              <Badge tone="amber">{counts.canh_bao} ≥ 80%</Badge>
              <Badge tone="red">{counts.khong_dat} không đạt</Badge>
              <Badge tone="gray">{counts.khong_phan_loai} không phân loại</Badge>
              {parsed.issues.length > 0 && <Badge tone="red">{parsed.issues.length} dòng bỏ qua</Badge>}
            </div>
            {parsed.issues.length > 0 && (
              <div className="text-xs text-red-700">
                {parsed.issues.slice(0, 6).map((i) => `Dòng ${i.row}: ${i.message}`).join(' · ')}
                {parsed.issues.length > 6 ? ' …' : ''}
              </div>
            )}
            <div className="max-h-72 overflow-auto rounded-lg border border-pine-800/10">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-pine-800/10 text-pine-800/50">
                    {['Bộ phận', 'Vị trí', 'Yếu tố', 'Kết quả', 'Giới hạn', 'Đánh giá'].map((h) => (
                      <th key={h} className="px-2 py-1.5 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-pine-800/5">
                  {parsed.parsed.slice(0, 100).map((p, i) => {
                    const r = { id: String(i), campaign_id: '', ...p }
                    const st = wemStatus(r)
                    return (
                      <tr key={i}>
                        <td className="px-2 py-1">{p.department ?? '—'}</td>
                        <td className="px-2 py-1">{p.position}</td>
                        <td className="px-2 py-1">{resultLabel(r)}</td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          {p.value === null ? '—' : fmtNum(p.value, 3)} {p.unit}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">{limitText(r)}</td>
                        <td className="px-2 py-1">
                          <Badge tone={WEM_TONE[st]}>{WEM_STATUS_LABELS[st]}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {parsed.parsed.length > 100 && <p className="text-xs text-pine-800/50">Hiển thị 100 dòng đầu.</p>}
          </>
        )}
        <Note>
          Cột nhận dạng: Bộ phận · Vị trí đo · Yếu tố · Thông số · Đơn vị tính · Kết quả · Giới hạn (hoặc Giới hạn dưới/trên) · Cường độ lao động · Số NLĐ
          tiếp xúc · Ghi chú. Ô gộp (bộ phận, vị trí để trống ở các dòng dưới) được hiểu theo dòng trên. Khi file không ghi giới hạn: nhiệt độ lấy theo
          cường độ lao động, tiếng ồn 85 dBA, NH₃/CO/SO₂/NO₂ theo QCVN 03:2019/BYT.
        </Note>
        {err && <ErrorNote message={err} />}
      </div>
    </Modal>
  )
}
