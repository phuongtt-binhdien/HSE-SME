// Bộ checklist kiểm tra: PCCC, VSCN, môi trường, ATVSLĐ, hóa chất, tổng thể; kiểm tra đột xuất ngoài chương trình
import { useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Loading, Table, Td } from '../../components/UI'
import { CHECKLIST_CATEGORY_LABELS, FREQUENCY_LABELS } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { errMsg } from '../../lib/utils'
import { RunModal, TemplateModal } from './checklist'
import type { ChecklistTemplate, InspectionData } from './useInspectionData'

export default function TemplatesTab({ data, base, canEdit }: { data: InspectionData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { templates, plans, loading } = data
  const [form, setForm] = useState<any>(null)
  const [adhoc, setAdhoc] = useState<ChecklistTemplate | null>(null)
  const [err, setErr] = useState('')

  const remove = async (t: ChecklistTemplate) => {
    const used = plans.filter((p) => p.template_id === t.id).length
    if (!window.confirm(`Xóa checklist "${t.name}" cùng các lần kiểm tra theo checklist này?${used ? ` ${used} chương trình đang dùng sẽ mất checklist.` : ''}`)) return
    const { error } = await supabase.from('checklist_templates').delete().eq('id', t.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  if (loading) return <Loading />

  return (
    <Card>
      <CardHeader
        title="Bộ checklist kiểm tra"
        hint="Mỗi dòng một hạng mục; bảng tự kiểm tra tuân thủ có căn cứ, mức phạt, bằng chứng. Kiểm tra đột xuất: bấm Thực hiện."
        action={
          canEdit && (
            <Button variant="outline" onClick={() => setForm({ category: 'PCCC', frequency: 'monthly', itemsText: '' })}>
              <Plus size={15} /> Tạo checklist
            </Button>
          )
        }
      />
      {err && (
        <div className="px-4 pt-3">
          <ErrorNote message={err} />
        </div>
      )}
      {templates.length === 0 ? (
        <EmptyState title="Chưa có checklist" hint="Nạp bộ mẫu tại Cài đặt › Bộ mẫu nghiệp vụ" />
      ) : (
        <Table head={['Tên', 'Nhóm', 'Tần suất', 'Số mục', 'Chương trình dùng', '']}>
          {templates.map((t) => (
            <tr key={t.id}>
              <Td className="min-w-[260px] font-medium">{t.name}</Td>
              <Td>
                <Badge tone={t.category === 'PCCC' ? 'red' : 'blue'}>{CHECKLIST_CATEGORY_LABELS[t.category] ?? t.category}</Badge>
              </Td>
              <Td className="whitespace-nowrap text-pine-800/60">{FREQUENCY_LABELS[t.frequency] ?? t.frequency}</Td>
              <Td className="text-pine-800/60">{(t.items ?? []).length}</Td>
              <Td className="text-pine-800/60">{plans.filter((p) => p.template_id === t.id).length || '—'}</Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button onClick={() => setAdhoc(t)}>
                      <ClipboardCheck size={15} /> Thực hiện
                    </Button>
                    <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...t, itemsText: (t.items ?? []).map((i) => i.label).join('\n') })}>
                      <Pencil size={15} />
                    </Button>
                    <Button variant="ghost" aria-label="Xóa" onClick={() => remove(t)}>
                      <Trash2 size={15} />
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
      <TemplateModal form={form} setForm={setForm} base={base} onClose={() => setForm(null)} />
      <RunModal open={!!adhoc} template={adhoc} base={base} onClose={() => setAdhoc(null)} />
    </Card>
  )
}
