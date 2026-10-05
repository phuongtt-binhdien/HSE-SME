import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
  PHYSICAL_STATE_LABELS,
  TRANSFER_STATUS_LABELS,
  WASTE_CATEGORY_LABELS,
} from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { daysUntil, errMsg, fmtDate, fmtNum, todayISO } from '../../lib/utils'

const catTone = (c: string) => (c === 'CTNH' ? 'red' : c === 'CTRCNTT' ? 'blue' : 'gray') as any

/* ================= Nhật ký phát sinh ================= */
function LogsTab({ fid, base, types, canEdit }: any) {
  const logs = useList('waste_logs', {
    select: '*, waste_types(code,name,unit,category)',
    match: { facility_id: fid },
    order: 'log_date',
    enabled: !!fid,
  })
  const save = useSave('waste_logs')
  const remove = useRemove('waste_logs')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!form.waste_type_id || !form.quantity) {
      setErr('Chọn loại chất thải và nhập khối lượng.')
      return
    }
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        waste_type_id: form.waste_type_id,
        log_date: form.log_date || todayISO(),
        quantity: Number(form.quantity),
        source: form.source || null,
        handler: form.handler || null,
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
        title="Nhật ký phát sinh chất thải"
        hint="Ghi nhận khối lượng cân/ước lượng theo ngày và bộ phận"
        action={
          canEdit && (
            <Button onClick={() => setForm({ log_date: todayISO() })}>
              <Plus size={15} /> Ghi nhận
            </Button>
          )
        }
      />
      {logs.isLoading ? (
        <Loading />
      ) : (logs.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có bản ghi" hint="Bấm Ghi nhận để nhập khối lượng phát sinh" />
      ) : (
        <Table head={['Ngày', 'Chất thải', 'Khối lượng', 'Bộ phận', 'Người ghi', '']}>
          {(logs.data as any[]).map((r) => (
            <tr key={r.id}>
              <Td>{fmtDate(r.log_date)}</Td>
              <Td>
                <div className="font-medium">{r.waste_types?.name}</div>
                <div className="text-xs text-pine-800/45">
                  {r.waste_types?.code ? 'Mã ' + r.waste_types.code : WASTE_CATEGORY_LABELS[r.waste_types?.category] ?? ''}
                </div>
              </Td>
              <Td className="font-semibold">
                {fmtNum(r.quantity)} {r.waste_types?.unit}
              </Td>
              <Td className="text-pine-800/60">{r.source ?? '—'}</Td>
              <Td className="text-pine-800/60">{r.handler ?? '—'}</Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...r })}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() => window.confirm('Xóa bản ghi này?') && remove.mutate(r.id)}
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
        title={form?.id ? 'Sửa bản ghi phát sinh' : 'Ghi nhận phát sinh'}
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
          <Field label="Loại chất thải" required>
            <Select
              value={form?.waste_type_id ?? ''}
              onChange={(e) => setForm({ ...form, waste_type_id: e.target.value })}
            >
              <option value="">— Chọn —</option>
              {types.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {(t.code ? t.code + ' — ' : '') + t.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày" required>
              <Input
                type="date"
                value={form?.log_date ?? ''}
                onChange={(e) => setForm({ ...form, log_date: e.target.value })}
              />
            </Field>
            <Field label="Khối lượng (kg)" required>
              <Input
                type="number"
                min={0}
                step="any"
                value={form?.quantity ?? ''}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bộ phận phát sinh">
              <Input
                value={form?.source ?? ''}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="VD: Xưởng tạo hạt 1"
              />
            </Field>
            <Field label="Người ghi nhận">
              <Input
                value={form?.handler ?? ''}
                onChange={(e) => setForm({ ...form, handler: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Ghi chú">
            <Textarea
              value={form?.note ?? ''}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Chuyển giao & chứng từ ================= */
function TransfersTab({ fid, base, types, canEdit }: any) {
  const qc = useQueryClient()
  const transfers = useList('waste_transfers', {
    select:
      '*, waste_contractors(name), waste_transfer_items(id, quantity, waste_type_id, waste_types(code,name,unit))',
    match: { facility_id: fid },
    order: 'transfer_date',
    enabled: !!fid,
  })
  const contractors = useList('waste_contractors', { order: 'created_at', ascending: true })
  const remove = useRemove('waste_transfers')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const openCreate = () =>
    setForm({
      transfer_date: todayISO(),
      status: 'draft',
      items: [{ waste_type_id: '', quantity: '' }],
    })
  const openEdit = (r: any) =>
    setForm({
      ...r,
      items: (r.waste_transfer_items ?? []).map((it: any) => ({
        waste_type_id: it.waste_type_id,
        quantity: it.quantity,
      })),
    })

  const submit = async () => {
    setErr('')
    const items = (form.items ?? []).filter((it: any) => it.waste_type_id && it.quantity)
    if (items.length === 0) {
      setErr('Thêm ít nhất một dòng chất thải bàn giao.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        transfer_date: form.transfer_date || todayISO(),
        contractor_id: form.contractor_id || null,
        manifest_no: form.manifest_no || null,
        status: form.status || 'draft',
        note: form.note || null,
      }
      let tid = form.id
      if (tid) {
        const { error } = await supabase.from('waste_transfers').update(payload).eq('id', tid)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('waste_transfers')
          .insert({ ...base, ...payload })
          .select()
          .single()
        if (error) throw error
        tid = data.id
      }
      const { error: eDel } = await supabase
        .from('waste_transfer_items')
        .delete()
        .eq('transfer_id', tid)
      if (eDel) throw eDel
      const { error: eIns } = await supabase.from('waste_transfer_items').insert(
        items.map((it: any) => ({
          transfer_id: tid,
          org_id: base.org_id,
          waste_type_id: it.waste_type_id,
          quantity: Number(it.quantity),
        }))
      )
      if (eIns) throw eIns
      await qc.invalidateQueries()
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const setItem = (i: number, k: string, v: any) => {
    const items = [...form.items]
    items[i] = { ...items[i], [k]: v }
    setForm({ ...form, items })
  }

  const statusTone = (s: string) => (s === 'completed' ? 'green' : s === 'signed' ? 'blue' : 'gray')

  return (
    <Card>
      <CardHeader
        title="Chuyển giao chất thải"
        hint="Bàn giao cho đơn vị chức năng kèm số chứng từ CTNH"
        action={
          canEdit && (
            <Button onClick={openCreate}>
              <Plus size={15} /> Lập bàn giao
            </Button>
          )
        }
      />
      {transfers.isLoading ? (
        <Loading />
      ) : (transfers.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có đợt chuyển giao" />
      ) : (
        <Table head={['Ngày', 'Đơn vị nhận', 'Chứng từ', 'Nội dung', 'Trạng thái', '']}>
          {(transfers.data as any[]).map((r) => (
            <tr key={r.id}>
              <Td>{fmtDate(r.transfer_date)}</Td>
              <Td className="font-medium">{r.waste_contractors?.name ?? '—'}</Td>
              <Td className="text-pine-800/60">{r.manifest_no ?? '—'}</Td>
              <Td className="text-pine-800/60">
                {(r.waste_transfer_items ?? [])
                  .map(
                    (it: any) =>
                      (it.waste_types?.code ? it.waste_types.code + ' ' : '') +
                      fmtNum(it.quantity) +
                      ' ' +
                      (it.waste_types?.unit ?? 'kg')
                  )
                  .join(' · ') || '—'}
              </Td>
              <Td>
                <Badge tone={statusTone(r.status)}>{TRANSFER_STATUS_LABELS[r.status]}</Badge>
              </Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => openEdit(r)}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() => window.confirm('Xóa đợt bàn giao này?') && remove.mutate(r.id)}
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
        title={form?.id ? 'Sửa đợt bàn giao' : 'Lập đợt bàn giao'}
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
            <Field label="Ngày bàn giao" required>
              <Input
                type="date"
                value={form?.transfer_date ?? ''}
                onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
              />
            </Field>
            <Field label="Đơn vị thu gom / xử lý">
              <Select
                value={form?.contractor_id ?? ''}
                onChange={(e) => setForm({ ...form, contractor_id: e.target.value })}
              >
                <option value="">— Chọn —</option>
                {(contractors.data ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số chứng từ CTNH">
              <Input
                value={form?.manifest_no ?? ''}
                onChange={(e) => setForm({ ...form, manifest_no: e.target.value })}
              />
            </Field>
            <Field label="Trạng thái">
              <Select
                value={form?.status ?? 'draft'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {Object.entries(TRANSFER_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-pine-800/80">Danh mục bàn giao</div>
            <div className="space-y-2">
              {(form?.items ?? []).map((it: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={it.waste_type_id}
                    onChange={(e) => setItem(i, 'waste_type_id', e.target.value)}
                    className="flex-1"
                  >
                    <option value="">— Chất thải —</option>
                    {types.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {(t.code ? t.code + ' — ' : '') + t.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="kg"
                    value={it.quantity}
                    onChange={(e) => setItem(i, 'quantity', e.target.value)}
                    className="w-28"
                  />
                  <Button
                    variant="ghost"
                    aria-label="Bỏ dòng"
                    onClick={() =>
                      setForm({ ...form, items: form.items.filter((_: any, j: number) => j !== i) })
                    }
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() =>
                setForm({ ...form, items: [...form.items, { waste_type_id: '', quantity: '' }] })
              }
            >
              <Plus size={15} /> Thêm dòng
            </Button>
          </div>

          <Field label="Ghi chú">
            <Textarea
              value={form?.note ?? ''}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Tồn kho lưu giữ ================= */
function InventoryTab({ fid }: any) {
  const inv = useList('waste_inventory', {
    match: { facility_id: fid },
    order: 'name',
    ascending: true,
    enabled: !!fid,
  })
  return (
    <Card>
      <CardHeader
        title="Tồn kho lưu giữ"
        hint="Tồn = phát sinh − đã chuyển giao (chứng từ đã ký/hoàn tất)"
      />
      {inv.isLoading ? (
        <Loading />
      ) : (inv.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có dữ liệu" hint="Khai báo danh mục và ghi nhận phát sinh trước" />
      ) : (
        <Table head={['Mã', 'Tên chất thải', 'Nhóm', 'Phát sinh', 'Đã giao', 'Tồn', 'Vị trí lưu giữ']}>
          {(inv.data as any[]).map((w) => (
            <tr key={w.waste_type_id}>
              <Td className="font-mono text-xs">{w.code ?? '—'}</Td>
              <Td className="font-medium">{w.name}</Td>
              <Td>
                <Badge tone={catTone(w.category)}>{WASTE_CATEGORY_LABELS[w.category]}</Badge>
              </Td>
              <Td>{fmtNum(w.total_in)} {w.unit}</Td>
              <Td>{fmtNum(w.total_out)} {w.unit}</Td>
              <Td className="font-semibold">
                {fmtNum(w.stock)} {w.unit}
                {w.category === 'CTNH' && Number(w.stock) > 0 && (
                  <div className="text-[11px] font-normal text-amber-700">
                    Lưu giữ trong thời hạn quy định
                  </div>
                )}
              </Td>
              <Td className="text-pine-800/60">{w.storage_location ?? '—'}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  )
}

/* ================= Danh mục chất thải ================= */
function TypesTab({ fid, base, types, canEdit }: any) {
  const save = useSave('waste_types')
  const remove = useRemove('waste_types')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!form.name?.trim()) {
      setErr('Nhập tên chất thải.')
      return
    }
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        code: form.code || null,
        name: form.name.trim(),
        category: form.category || 'CTNH',
        physical_state: form.physical_state || null,
        unit: form.unit || 'kg',
        storage_location: form.storage_location || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  return (
    <Card>
      <CardHeader
        title="Danh mục chất thải"
        hint="Mã CTNH theo Thông tư 02/2022/TT-BTNMT; kiểm tra trạng thái tồn tại (rắn/lỏng/bùn)"
        action={
          canEdit && (
            <Button onClick={() => setForm({ category: 'CTNH', unit: 'kg' })}>
              <Plus size={15} /> Thêm
            </Button>
          )
        }
      />
      {types.length === 0 ? (
        <EmptyState title="Chưa khai báo danh mục" />
      ) : (
        <Table head={['Mã', 'Tên', 'Nhóm', 'Trạng thái', 'ĐVT', 'Vị trí lưu giữ', '']}>
          {types.map((t: any) => (
            <tr key={t.id}>
              <Td className="font-mono text-xs">{t.code ?? '—'}</Td>
              <Td className="font-medium">{t.name}</Td>
              <Td>
                <Badge tone={catTone(t.category)}>{WASTE_CATEGORY_LABELS[t.category]}</Badge>
              </Td>
              <Td className="text-pine-800/60">
                {t.physical_state ? PHYSICAL_STATE_LABELS[t.physical_state] : '—'}
              </Td>
              <Td className="text-pine-800/60">{t.unit}</Td>
              <Td className="text-pine-800/60">{t.storage_location ?? '—'}</Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...t })}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() =>
                        window.confirm('Xóa loại chất thải này? (chỉ xóa được khi chưa có bản ghi)') &&
                        remove.mutate(t.id)
                      }
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
        title={form?.id ? 'Sửa loại chất thải' : 'Thêm loại chất thải'}
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
            <Field label="Mã CTNH">
              <Input
                value={form?.code ?? ''}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="VD: 17 02 03"
              />
            </Field>
            <Field label="Nhóm" required>
              <Select
                value={form?.category ?? 'CTNH'}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(WASTE_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Tên chất thải" required>
            <Input
              value={form?.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Trạng thái tồn tại">
              <Select
                value={form?.physical_state ?? ''}
                onChange={(e) => setForm({ ...form, physical_state: e.target.value })}
              >
                <option value="">—</option>
                {Object.entries(PHYSICAL_STATE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Đơn vị tính">
              <Input
                value={form?.unit ?? 'kg'}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Vị trí lưu giữ">
            <Input
              value={form?.storage_location ?? ''}
              onChange={(e) => setForm({ ...form, storage_location: e.target.value })}
              placeholder="VD: Kho CTNH"
            />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Đơn vị thu gom ================= */
function ContractorsTab({ orgId, canEdit }: any) {
  const list = useList('waste_contractors', { order: 'created_at', ascending: true })
  const save = useSave('waste_contractors')
  const remove = useRemove('waste_contractors')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!form.name?.trim()) {
      setErr('Nhập tên đơn vị.')
      return
    }
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : { org_id: orgId }),
        name: form.name.trim(),
        license_no: form.license_no || null,
        license_expiry: form.license_expiry || null,
        scope: form.scope || null,
        contact_person: form.contact_person || null,
        phone: form.phone || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const expiryBadge = (d: string | null) => {
    if (!d) return <span className="text-pine-800/40">—</span>
    const n = daysUntil(d)
    if (n < 0) return <Badge tone="red">Hết hạn</Badge>
    if (n <= 60) return <Badge tone="amber">Còn {n} ngày</Badge>
    return <Badge tone="green">{fmtDate(d)}</Badge>
  }

  return (
    <Card>
      <CardHeader
        title="Đơn vị thu gom, xử lý"
        hint="Theo dõi giấy phép xử lý CTNH và phạm vi hợp đồng"
        action={
          canEdit && (
            <Button onClick={() => setForm({})}>
              <Plus size={15} /> Thêm
            </Button>
          )
        }
      />
      {(list.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có đơn vị" />
      ) : (
        <Table head={['Đơn vị', 'Giấy phép', 'Hạn giấy phép', 'Phạm vi', 'Liên hệ', '']}>
          {(list.data as any[]).map((c) => (
            <tr key={c.id}>
              <Td className="font-medium">{c.name}</Td>
              <Td className="text-pine-800/60">{c.license_no ?? '—'}</Td>
              <Td>{expiryBadge(c.license_expiry)}</Td>
              <Td className="text-pine-800/60">{c.scope ?? '—'}</Td>
              <Td className="text-pine-800/60">
                {[c.contact_person, c.phone].filter(Boolean).join(' · ') || '—'}
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
                      onClick={() => window.confirm('Xóa đơn vị này?') && remove.mutate(c.id)}
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
        title={form?.id ? 'Sửa đơn vị' : 'Thêm đơn vị thu gom'}
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
          <Field label="Tên đơn vị" required>
            <Input value={form?.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số giấy phép xử lý CTNH">
              <Input
                value={form?.license_no ?? ''}
                onChange={(e) => setForm({ ...form, license_no: e.target.value })}
              />
            </Field>
            <Field label="Hạn giấy phép">
              <Input
                type="date"
                value={form?.license_expiry ?? ''}
                onChange={(e) => setForm({ ...form, license_expiry: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Phạm vi thu gom / xử lý">
            <Input value={form?.scope ?? ''} onChange={(e) => setForm({ ...form, scope: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Người liên hệ">
              <Input
                value={form?.contact_person ?? ''}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              />
            </Field>
            <Field label="Điện thoại">
              <Input value={form?.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Trang ================= */
export default function WastePage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('nhat-ky')

  const typesQ = useList('waste_types', {
    match: { facility_id: fid },
    order: 'created_at',
    ascending: true,
    enabled: !!fid,
  })
  const types = typesQ.data ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Chất thải & CTNH</h1>
        <p className="text-sm text-pine-800/50">
          Nhật ký phát sinh · chuyển giao, chứng từ · tồn kho lưu giữ
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'nhat-ky', label: 'Nhật ký phát sinh' },
          { key: 'chuyen-giao', label: 'Chuyển giao' },
          { key: 'ton-kho', label: 'Tồn kho' },
          { key: 'danh-muc', label: 'Danh mục' },
          { key: 'don-vi', label: 'Đơn vị thu gom' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'nhat-ky' && <LogsTab fid={fid} base={base} types={types} canEdit={canEdit} />}
      {tab === 'chuyen-giao' && (
        <TransfersTab fid={fid} base={base} types={types} canEdit={canEdit} />
      )}
      {tab === 'ton-kho' && <InventoryTab fid={fid} />}
      {tab === 'danh-muc' && <TypesTab fid={fid} base={base} types={types} canEdit={canEdit} />}
      {tab === 'don-vi' && <ContractorsTab orgId={profile!.org_id} canEdit={canEdit} />}
    </div>
  )
}
