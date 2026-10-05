import { useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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
  AIR_PARAMS,
  ALERT_LEVEL_LABELS,
  ALERT_STATUS_LABELS,
  POINT_KIND_LABELS,
  SHIFTS,
  SYSTEM_KIND_LABELS,
  WATER_PARAMS,
  type ParamPreset,
} from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtDate, fmtNum, todayISO } from '../../lib/utils'

const CHEMS = ['PAC', 'Polymer', 'Chlorine']

/* ================= Nhật ký vận hành ================= */
function OpLogsTab({ fid, base, systems, canEdit }: any) {
  const logs = useList('operation_logs', {
    select: '*, treatment_systems(name,kind)',
    match: { facility_id: fid },
    order: 'log_date',
    enabled: !!fid,
  })
  const save = useSave('operation_logs')
  const remove = useRemove('operation_logs')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const openCreate = () => setForm({ log_date: todayISO(), shift: 'Ca 1' })
  const openEdit = (r: any) => {
    const f: any = { ...r }
    for (const c of CHEMS) f['chem_' + c] = r.chemical_usage?.[c] ?? ''
    setForm(f)
  }

  const submit = async () => {
    setErr('')
    if (!form.system_id) {
      setErr('Chọn hệ thống xử lý.')
      return
    }
    const chemical_usage: Record<string, number> = {}
    for (const c of CHEMS) {
      const v = form['chem_' + c]
      if (v !== '' && v != null && !Number.isNaN(Number(v))) chemical_usage[c] = Number(v)
    }
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        system_id: form.system_id,
        log_date: form.log_date || todayISO(),
        shift: form.shift || 'Ca 1',
        influent_flow: form.influent_flow === '' || form.influent_flow == null ? null : Number(form.influent_flow),
        ph: form.ph === '' || form.ph == null ? null : Number(form.ph),
        chemical_usage,
        equipment_status: form.equipment_status || null,
        issues: form.issues || null,
        actions: form.actions || null,
        operator_name: form.operator_name || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const chemText = (cu: any) =>
    cu && Object.keys(cu).length
      ? Object.entries(cu)
          .map(([k, v]) => k + ' ' + fmtNum(Number(v)))
          .join(' · ')
      : '—'

  return (
    <Card>
      <CardHeader
        title="Nhật ký vận hành"
        hint="HTXLNT, hệ thống xử lý khí thải — theo ca, kèm hóa chất sử dụng và sự cố"
        action={
          canEdit && (
            <Button onClick={openCreate}>
              <Plus size={15} /> Ghi nhật ký
            </Button>
          )
        }
      />
      {logs.isLoading ? (
        <Loading />
      ) : (logs.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có nhật ký" hint="Khai báo hệ thống ở thẻ Cấu hình rồi ghi nhật ký" />
      ) : (
        <Table head={['Ngày / Ca', 'Hệ thống', 'Lưu lượng', 'pH', 'Hóa chất (kg)', 'Sự cố / Khắc phục', 'Người VH', '']}>
          {(logs.data as any[]).map((r) => (
            <tr key={r.id}>
              <Td>
                <div>{fmtDate(r.log_date)}</div>
                <div className="text-xs text-pine-800/45">{r.shift}</div>
              </Td>
              <Td className="font-medium">{r.treatment_systems?.name}</Td>
              <Td>{r.influent_flow != null ? fmtNum(r.influent_flow) + ' m³' : '—'}</Td>
              <Td>{r.ph != null ? fmtNum(r.ph) : '—'}</Td>
              <Td className="text-pine-800/60">{chemText(r.chemical_usage)}</Td>
              <Td className="max-w-[260px] text-pine-800/60">
                {r.issues ? (
                  <>
                    <div>{r.issues}</div>
                    {r.actions && <div className="text-xs text-viridian-700">→ {r.actions}</div>}
                  </>
                ) : (
                  'Bình thường'
                )}
              </Td>
              <Td className="text-pine-800/60">{r.operator_name ?? '—'}</Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => openEdit(r)}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() => window.confirm('Xóa nhật ký này?') && remove.mutate(r.id)}
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
        title={form?.id ? 'Sửa nhật ký vận hành' : 'Ghi nhật ký vận hành'}
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Hệ thống" required className="col-span-2 sm:col-span-1">
              <Select
                value={form?.system_id ?? ''}
                onChange={(e) => setForm({ ...form, system_id: e.target.value })}
              >
                <option value="">— Chọn —</option>
                {systems.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ngày">
              <Input
                type="date"
                value={form?.log_date ?? ''}
                onChange={(e) => setForm({ ...form, log_date: e.target.value })}
              />
            </Field>
            <Field label="Ca">
              <Select value={form?.shift ?? 'Ca 1'} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Field label="Lưu lượng (m³)">
              <Input
                type="number"
                step="any"
                value={form?.influent_flow ?? ''}
                onChange={(e) => setForm({ ...form, influent_flow: e.target.value })}
              />
            </Field>
            <Field label="pH">
              <Input
                type="number"
                step="any"
                value={form?.ph ?? ''}
                onChange={(e) => setForm({ ...form, ph: e.target.value })}
              />
            </Field>
            {CHEMS.map((c) => (
              <Field key={c} label={c + ' (kg)'}>
                <Input
                  type="number"
                  step="any"
                  value={form?.['chem_' + c] ?? ''}
                  onChange={(e) => setForm({ ...form, ['chem_' + c]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          <Field label="Tình trạng thiết bị">
            <Input
              value={form?.equipment_status ?? ''}
              onChange={(e) => setForm({ ...form, equipment_status: e.target.value })}
              placeholder="VD: Bơm, máy thổi khí hoạt động bình thường"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sự cố / bất thường">
              <Textarea
                value={form?.issues ?? ''}
                onChange={(e) => setForm({ ...form, issues: e.target.value })}
              />
            </Field>
            <Field label="Biện pháp khắc phục">
              <Textarea
                value={form?.actions ?? ''}
                onChange={(e) => setForm({ ...form, actions: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Người vận hành">
            <Input
              value={form?.operator_name ?? ''}
              onChange={(e) => setForm({ ...form, operator_name: e.target.value })}
            />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Quan trắc ================= */
function MonitoringTab({ fid, base, points, canEdit }: any) {
  const qc = useQueryClient()
  const results = useList('monitoring_results', {
    select: '*, monitoring_points(name,kind)',
    match: { facility_id: fid },
    order: 'sample_date',
    enabled: !!fid,
  })
  const remove = useRemove('monitoring_results')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [chartPoint, setChartPoint] = useState('')
  const [chartParam, setChartParam] = useState('')

  const rows = (results.data ?? []) as any[]

  const chartParams = useMemo(
    () => Array.from(new Set(rows.filter((r) => r.point_id === chartPoint).map((r) => r.parameter))),
    [rows, chartPoint]
  )
  const chartData = useMemo(() => {
    const list = rows
      .filter((r) => r.point_id === chartPoint && r.parameter === chartParam)
      .sort((a, b) => a.sample_date.localeCompare(b.sample_date))
    return list.map((r) => ({
      label: format(parseISO(r.sample_date), 'dd/MM/yy'),
      value: Number(r.value),
      threshold: r.threshold != null ? Number(r.threshold) : null,
    }))
  }, [rows, chartPoint, chartParam])
  const chartThreshold = [...chartData].reverse().find((d) => d.threshold != null)?.threshold ?? null

  const presetsFor = (pointId: string): ParamPreset[] => {
    const p = points.find((x: any) => x.id === pointId)
    return p?.kind === 'khi_thai' ? AIR_PARAMS : WATER_PARAMS
  }

  const applyPreset = (name: string) => {
    const preset = presetsFor(form.point_id).find((p) => p.parameter === name)
    if (!preset) return
    setForm({
      ...form,
      parameter: preset.parameter,
      unit: preset.unit,
      threshold: preset.threshold ?? '',
      threshold_min: preset.thresholdMin ?? '',
      regulation: preset.regulation,
    })
  }

  const submit = async () => {
    setErr('')
    if (!form.point_id || !form.parameter || form.value === '' || form.value == null) {
      setErr('Chọn điểm quan trắc, thông số và nhập giá trị.')
      return
    }
    setBusy(true)
    try {
      const v = Number(form.value)
      const thr = form.threshold === '' || form.threshold == null ? null : Number(form.threshold)
      const thrMin =
        form.threshold_min === '' || form.threshold_min == null ? null : Number(form.threshold_min)
      const exceeded = (thr != null && v > thr) || (thrMin != null && v < thrMin)
      const payload = {
        point_id: form.point_id,
        sample_date: form.sample_date || todayISO(),
        parameter: form.parameter,
        unit: form.unit || null,
        value: v,
        threshold: thr,
        threshold_min: thrMin,
        regulation: form.regulation || null,
        is_exceeded: exceeded,
        lab: form.lab || null,
        report_no: form.report_no || null,
      }
      if (form.id) {
        const { error } = await supabase.from('monitoring_results').update(payload).eq('id', form.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('monitoring_results')
          .insert({ ...base, ...payload })
          .select()
          .single()
        if (error) throw error
        if (exceeded) {
          const pointName = points.find((p: any) => p.id === form.point_id)?.name ?? ''
          await supabase.from('alerts').insert({
            ...base,
            source: 'quan_trac',
            level: 'critical',
            status: 'open',
            related_id: data.id,
            message:
              form.parameter +
              ' = ' +
              v +
              (form.unit ? ' ' + form.unit : '') +
              ' tại ' +
              pointName +
              ' vượt giới hạn' +
              (thr != null ? ' ' + thr : '') +
              (form.regulation ? ' (' + form.regulation + ')' : ''),
          })
        }
      }
      await qc.invalidateQueries()
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const limitText = (r: any) => {
    if (r.threshold_min != null && r.threshold != null) return r.threshold_min + ' – ' + r.threshold
    if (r.threshold != null) return '≤ ' + r.threshold
    return '—'
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Xu hướng theo thông số"
          hint="Giá trị đo so với giới hạn QCVN (đường đỏ)"
          action={
            <div className="flex gap-2">
              <Select
                value={chartPoint}
                onChange={(e) => {
                  setChartPoint(e.target.value)
                  setChartParam('')
                }}
                className="max-w-[180px]"
              >
                <option value="">— Điểm quan trắc —</option>
                {points.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Select
                value={chartParam}
                onChange={(e) => setChartParam(e.target.value)}
                className="max-w-[170px]"
              >
                <option value="">— Thông số —</option>
                {chartParams.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
          }
        />
        <div className="px-2 py-3">
          {chartData.length < 2 ? (
            <EmptyState
              title="Chưa đủ dữ liệu để vẽ biểu đồ"
              hint="Chọn điểm và thông số có từ 2 kết quả trở lên"
            />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#14261F14" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                {chartThreshold != null && (
                  <ReferenceLine
                    y={chartThreshold}
                    stroke="#B91C1C"
                    strokeDasharray="5 4"
                    label={{ value: 'Giới hạn', fontSize: 11, fill: '#B91C1C', position: 'insideTopRight' }}
                  />
                )}
                <Line type="monotone" dataKey="value" stroke="#2C7DA0" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Kết quả quan trắc"
          hint="Giá trị vượt giới hạn tự động tạo cảnh báo"
          action={
            canEdit && (
              <Button onClick={() => setForm({ sample_date: todayISO() })}>
                <Plus size={15} /> Nhập kết quả
              </Button>
            )
          }
        />
        {results.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState title="Chưa có kết quả" hint="Khai báo điểm quan trắc ở thẻ Cấu hình" />
        ) : (
          <Table head={['Ngày', 'Điểm', 'Thông số', 'Giá trị', 'Giới hạn', 'Đánh giá', 'Đơn vị QT', '']}>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>{fmtDate(r.sample_date)}</Td>
                <Td className="font-medium">{r.monitoring_points?.name}</Td>
                <Td>{r.parameter}</Td>
                <Td className="font-semibold">
                  {fmtNum(r.value, 4)} {r.unit ?? ''}
                </Td>
                <Td className="text-pine-800/60">{limitText(r)}</Td>
                <Td>
                  {r.is_exceeded ? <Badge tone="red">Vượt</Badge> : <Badge tone="green">Đạt</Badge>}
                </Td>
                <Td className="text-pine-800/60">{r.lab ?? '—'}</Td>
                <Td className="text-right">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...r })}>
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label="Xóa"
                        onClick={() => window.confirm('Xóa kết quả này?') && remove.mutate(r.id)}
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
      </Card>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa kết quả quan trắc' : 'Nhập kết quả quan trắc'}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
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
            <Field label="Điểm quan trắc" required>
              <Select
                value={form?.point_id ?? ''}
                onChange={(e) => setForm({ ...form, point_id: e.target.value })}
              >
                <option value="">— Chọn —</option>
                {points.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({POINT_KIND_LABELS[p.kind]})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ngày lấy mẫu">
              <Input
                type="date"
                value={form?.sample_date ?? ''}
                onChange={(e) => setForm({ ...form, sample_date: e.target.value })}
              />
            </Field>
          </div>
          {form?.point_id && (
            <Field label="Chọn nhanh thông số theo QCVN">
              <Select value="" onChange={(e) => e.target.value && applyPreset(e.target.value)}>
                <option value="">— Áp preset (có thể sửa lại) —</option>
                {presetsFor(form.point_id).map((p) => (
                  <option key={p.parameter} value={p.parameter}>
                    {p.parameter} · {p.regulation}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Thông số" required>
              <Input
                value={form?.parameter ?? ''}
                onChange={(e) => setForm({ ...form, parameter: e.target.value })}
              />
            </Field>
            <Field label="Đơn vị">
              <Input value={form?.unit ?? ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Giá trị đo" required>
              <Input
                type="number"
                step="any"
                value={form?.value ?? ''}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </Field>
            <Field label="Giới hạn trên">
              <Input
                type="number"
                step="any"
                value={form?.threshold ?? ''}
                onChange={(e) => setForm({ ...form, threshold: e.target.value })}
              />
            </Field>
            <Field label="Giới hạn dưới">
              <Input
                type="number"
                step="any"
                value={form?.threshold_min ?? ''}
                onChange={(e) => setForm({ ...form, threshold_min: e.target.value })}
              />
            </Field>
          </div>
          <p className="text-xs text-pine-800/45">
            Ngưỡng preset là giá trị C cơ sở của QCVN — điều chỉnh theo hệ số Kq, Kf (nước thải) hoặc
            Kp, Kv (khí thải) quy định tại GPMT của cơ sở.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quy chuẩn áp dụng">
              <Input
                value={form?.regulation ?? ''}
                onChange={(e) => setForm({ ...form, regulation: e.target.value })}
                placeholder="VD: QCVN 40:2011/BTNMT cột A"
              />
            </Field>
            <Field label="Đơn vị quan trắc">
              <Input value={form?.lab ?? ''} onChange={(e) => setForm({ ...form, lab: e.target.value })} />
            </Field>
          </div>
          <Field label="Số phiếu / báo cáo">
            <Input
              value={form?.report_no ?? ''}
              onChange={(e) => setForm({ ...form, report_no: e.target.value })}
            />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </div>
  )
}

/* ================= Cảnh báo ================= */
function AlertsTab({ fid }: any) {
  const alerts = useList('alerts', { match: { facility_id: fid }, enabled: !!fid })
  const save = useSave('alerts')
  const srcLabel: Record<string, string> = {
    quan_trac: 'Quan trắc',
    tuan_thu: 'Tuân thủ',
    thiet_bi: 'Thiết bị',
    khac: 'Khác',
  }
  return (
    <Card>
      <CardHeader title="Cảnh báo" hint="Vượt ngưỡng quan trắc và các cảnh báo hệ thống" />
      {(alerts.data ?? []).length === 0 ? (
        <EmptyState title="Không có cảnh báo" />
      ) : (
        <Table head={['Thời điểm', 'Nội dung', 'Nguồn', 'Mức độ', 'Trạng thái']}>
          {(alerts.data as any[]).map((a) => (
            <tr key={a.id}>
              <Td className="whitespace-nowrap">{fmtDate(a.created_at)}</Td>
              <Td>{a.message}</Td>
              <Td className="text-pine-800/60">{srcLabel[a.source] ?? a.source}</Td>
              <Td>
                <Badge tone={a.level === 'critical' ? 'red' : a.level === 'warning' ? 'amber' : 'gray'}>
                  {ALERT_LEVEL_LABELS[a.level]}
                </Badge>
              </Td>
              <Td>
                <Select
                  value={a.status}
                  onChange={(e) => save.mutate({ id: a.id, status: e.target.value })}
                  className="max-w-[150px]"
                >
                  {Object.entries(ALERT_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  )
}

/* ================= Cấu hình ================= */
function ConfigTab({ fid, base, systems, points, canEdit }: any) {
  const saveSys = useSave('treatment_systems')
  const removeSys = useRemove('treatment_systems')
  const savePoint = useSave('monitoring_points')
  const removePoint = useRemove('monitoring_points')
  const [sysForm, setSysForm] = useState<any>(null)
  const [pointForm, setPointForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submitSys = async () => {
    setErr('')
    if (!sysForm.name?.trim()) return setErr('Nhập tên hệ thống.')
    try {
      await saveSys.mutateAsync({
        ...(sysForm.id ? { id: sysForm.id } : base),
        name: sysForm.name.trim(),
        kind: sysForm.kind || 'nuoc_thai',
        capacity: sysForm.capacity || null,
        description: sysForm.description || null,
      })
      setSysForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }
  const submitPoint = async () => {
    setErr('')
    if (!pointForm.name?.trim()) return setErr('Nhập tên điểm quan trắc.')
    try {
      await savePoint.mutateAsync({
        ...(pointForm.id ? { id: pointForm.id } : base),
        name: pointForm.name.trim(),
        kind: pointForm.kind || 'nuoc_thai',
        position: pointForm.position || null,
      })
      setPointForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  return (
    <div className="space-y-4">
      {err && <ErrorNote message={err} />}
      <Card>
        <CardHeader
          title="Hệ thống xử lý"
          hint="HTXLNT, lọc bụi túi vải, lò hơi… — ghi rõ công suất, thông số theo GPMT"
          action={
            canEdit && (
              <Button variant="outline" onClick={() => setSysForm({ kind: 'nuoc_thai' })}>
                <Plus size={15} /> Thêm
              </Button>
            )
          }
        />
        {systems.length === 0 ? (
          <EmptyState title="Chưa khai báo hệ thống" />
        ) : (
          <Table head={['Tên', 'Loại', 'Công suất', 'Mô tả', '']}>
            {systems.map((s: any) => (
              <tr key={s.id}>
                <Td className="font-medium">{s.name}</Td>
                <Td>
                  <Badge tone={s.kind === 'nuoc_thai' ? 'blue' : 'gray'}>
                    {SYSTEM_KIND_LABELS[s.kind]}
                  </Badge>
                </Td>
                <Td className="text-pine-800/60">{s.capacity ?? '—'}</Td>
                <Td className="max-w-[280px] text-pine-800/60">{s.description ?? '—'}</Td>
                <Td className="text-right">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" aria-label="Sửa" onClick={() => setSysForm({ ...s })}>
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label="Xóa"
                        onClick={() => window.confirm('Xóa hệ thống này?') && removeSys.mutate(s.id)}
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
      </Card>

      <Card>
        <CardHeader
          title="Điểm quan trắc"
          action={
            canEdit && (
              <Button variant="outline" onClick={() => setPointForm({ kind: 'nuoc_thai' })}>
                <Plus size={15} /> Thêm
              </Button>
            )
          }
        />
        {points.length === 0 ? (
          <EmptyState title="Chưa khai báo điểm quan trắc" />
        ) : (
          <Table head={['Tên điểm', 'Loại', 'Vị trí', '']}>
            {points.map((p: any) => (
              <tr key={p.id}>
                <Td className="font-medium">{p.name}</Td>
                <Td className="text-pine-800/60">{POINT_KIND_LABELS[p.kind]}</Td>
                <Td className="text-pine-800/60">{p.position ?? '—'}</Td>
                <Td className="text-right">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" aria-label="Sửa" onClick={() => setPointForm({ ...p })}>
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label="Xóa"
                        onClick={() => window.confirm('Xóa điểm này?') && removePoint.mutate(p.id)}
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
      </Card>

      <Modal
        open={!!sysForm}
        onClose={() => setSysForm(null)}
        title={sysForm?.id ? 'Sửa hệ thống' : 'Thêm hệ thống xử lý'}
        footer={
          <>
            <Button variant="outline" onClick={() => setSysForm(null)}>
              Hủy
            </Button>
            <Button onClick={submitSys}>Lưu</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên hệ thống" required>
            <Input
              value={sysForm?.name ?? ''}
              onChange={(e) => setSysForm({ ...sysForm, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Loại">
              <Select
                value={sysForm?.kind ?? 'nuoc_thai'}
                onChange={(e) => setSysForm({ ...sysForm, kind: e.target.value })}
              >
                {Object.entries(SYSTEM_KIND_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Công suất">
              <Input
                value={sysForm?.capacity ?? ''}
                onChange={(e) => setSysForm({ ...sysForm, capacity: e.target.value })}
                placeholder="VD: 120 m³/ngày đêm"
              />
            </Field>
          </div>
          <Field label="Mô tả">
            <Textarea
              value={sysForm?.description ?? ''}
              onChange={(e) => setSysForm({ ...sysForm, description: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!pointForm}
        onClose={() => setPointForm(null)}
        title={pointForm?.id ? 'Sửa điểm quan trắc' : 'Thêm điểm quan trắc'}
        footer={
          <>
            <Button variant="outline" onClick={() => setPointForm(null)}>
              Hủy
            </Button>
            <Button onClick={submitPoint}>Lưu</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên điểm" required>
            <Input
              value={pointForm?.name ?? ''}
              onChange={(e) => setPointForm({ ...pointForm, name: e.target.value })}
              placeholder="VD: NT-01 Đầu ra HTXLNT"
            />
          </Field>
          <Field label="Loại">
            <Select
              value={pointForm?.kind ?? 'nuoc_thai'}
              onChange={(e) => setPointForm({ ...pointForm, kind: e.target.value })}
            >
              {Object.entries(POINT_KIND_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Vị trí / ghi chú">
            <Input
              value={pointForm?.position ?? ''}
              onChange={(e) => setPointForm({ ...pointForm, position: e.target.value })}
              placeholder="VD: Ống khói H = 22 m"
            />
          </Field>
        </div>
      </Modal>
    </div>
  )
}

/* ================= Trang ================= */
export default function OperationsPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('nhat-ky')

  const systemsQ = useList('treatment_systems', {
    match: { facility_id: fid },
    order: 'created_at',
    ascending: true,
    enabled: !!fid,
  })
  const pointsQ = useList('monitoring_points', {
    match: { facility_id: fid },
    order: 'created_at',
    ascending: true,
    enabled: !!fid,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Vận hành & Quan trắc</h1>
        <p className="text-sm text-pine-800/50">
          Nhật ký HTXLNT, khí thải · kết quả quan trắc so với QCVN · cảnh báo vượt ngưỡng
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'nhat-ky', label: 'Nhật ký vận hành' },
          { key: 'quan-trac', label: 'Quan trắc' },
          { key: 'canh-bao', label: 'Cảnh báo' },
          { key: 'cau-hinh', label: 'Cấu hình' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'nhat-ky' && (
        <OpLogsTab fid={fid} base={base} systems={systemsQ.data ?? []} canEdit={canEdit} />
      )}
      {tab === 'quan-trac' && (
        <MonitoringTab fid={fid} base={base} points={pointsQ.data ?? []} canEdit={canEdit} />
      )}
      {tab === 'canh-bao' && <AlertsTab fid={fid} />}
      {tab === 'cau-hinh' && (
        <ConfigTab
          fid={fid}
          base={base}
          systems={systemsQ.data ?? []}
          points={pointsQ.data ?? []}
          canEdit={canEdit}
        />
      )}
    </div>
  )
}
