// Dữ liệu dùng chung của phân hệ Hóa chất
import { useMemo } from 'react'
import { useList } from '../../hooks/useCrud'
import { chemicalAlerts, stockOf, type Chemical, type ChemicalTxn, type OperationLog } from '../../lib/chemicals'

export function useChemicalData(fid: string) {
  const on = !!fid
  const chemicals = useList<Chemical>('chemicals', { match: { facility_id: fid }, order: 'name', ascending: true, enabled: on })
  const txns = useList<ChemicalTxn>('chemical_transactions', { match: { facility_id: fid }, order: 'txn_date', ascending: false, enabled: on })
  const logs = useList<OperationLog & { influent_flow: number | null }>('operation_logs', {
    select: 'log_date, chemical_usage, influent_flow',
    match: { facility_id: fid },
    order: 'log_date',
    ascending: true,
    enabled: on,
  })

  const list = chemicals.data ?? []
  const tx = txns.data ?? []
  const lg = logs.data ?? []
  const rows = useMemo(
    () =>
      list.map((c) => {
        const s = stockOf(c, tx, lg)
        return { c, s, alerts: chemicalAlerts(c, s, tx) }
      }),
    [list, tx, lg]
  )
  const byId = useMemo(() => new Map(list.map((c) => [c.id, c])), [list])

  return {
    chemicals: list,
    txns: tx,
    logs: lg,
    rows,
    byId,
    loading: chemicals.isLoading || txns.isLoading || logs.isLoading,
    error: chemicals.error || txns.error || logs.error,
  }
}

export type ChemicalData = ReturnType<typeof useChemicalData>
