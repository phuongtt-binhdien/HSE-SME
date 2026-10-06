// Chế độ dùng thử: client giả lập phần API Supabase mà ứng dụng sử dụng (from/select/insert/
// update/delete, lọc eq/in/gte/lte, order, single, nhúng bảng liên kết, auth), lưu dữ liệu
// trong localStorage của trình duyệt. Bật tự động khi chưa cấu hình VITE_SUPABASE_URL.
import { newId as uuid } from '../utils'
import { buildSeed, DEMO_USER_ID } from './seed'

type Row = Record<string, any>
export type DemoDb = Record<string, Row[]>
type Result = { data: any; error: { message: string; code?: string } | null; count?: number | null }

const STORAGE_KEY = 'ehsviet_demo_db_v2'
const SESSION_KEY = 'ehsviet_demo_session'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Khóa ngoại: bảng → { bảng được tham chiếu → cột } (dùng cho nhúng select và xóa dây chuyền) */
const FK: Record<string, Record<string, string>> = {
  profiles: { organizations: 'org_id', facilities: 'facility_id' },
  waste_logs: { waste_types: 'waste_type_id' },
  waste_transfers: { waste_contractors: 'contractor_id' },
  waste_transfer_items: { waste_types: 'waste_type_id', waste_transfers: 'transfer_id' },
  operation_logs: { treatment_systems: 'system_id' },
  monitoring_results: { monitoring_points: 'point_id' },
  checklist_runs: { checklist_templates: 'template_id' },
  capa_actions: { incidents: 'incident_id' },
  training_records: { employees: 'employee_id', training_courses: 'course_id' },
  rule_violations: { internal_rules: 'rule_id', employees: 'employee_id' },
}

/** Hành vi khi xóa bản ghi cha (theo schema.sql) */
const ON_DELETE: Record<string, { table: string; column: string; action: 'cascade' | 'set null' | 'restrict' }[]> = {
  waste_types: [
    { table: 'waste_logs', column: 'waste_type_id', action: 'restrict' },
    { table: 'waste_transfer_items', column: 'waste_type_id', action: 'restrict' },
  ],
  waste_transfers: [{ table: 'waste_transfer_items', column: 'transfer_id', action: 'cascade' }],
  waste_contractors: [{ table: 'waste_transfers', column: 'contractor_id', action: 'set null' }],
  treatment_systems: [{ table: 'operation_logs', column: 'system_id', action: 'cascade' }],
  monitoring_points: [{ table: 'monitoring_results', column: 'point_id', action: 'cascade' }],
  checklist_templates: [{ table: 'checklist_runs', column: 'template_id', action: 'cascade' }],
  incidents: [{ table: 'capa_actions', column: 'incident_id', action: 'cascade' }],
  employees: [
    { table: 'training_records', column: 'employee_id', action: 'cascade' },
    { table: 'rule_violations', column: 'employee_id', action: 'set null' },
  ],
  training_courses: [{ table: 'training_records', column: 'course_id', action: 'cascade' }],
  internal_rules: [{ table: 'rule_violations', column: 'rule_id', action: 'set null' }],
}

/** Ràng buộc duy nhất cần mô phỏng */
const UNIQUE: Record<string, { cols: string[]; name: string }[]> = {
  employees: [{ cols: ['facility_id', 'code'], name: 'employees_facility_code_key' }],
  training_records: [{ cols: ['employee_id', 'course_id'], name: 'training_records_employee_id_course_id_key' }],
  esg_metrics: [{ cols: ['facility_id', 'year', 'code'], name: 'esg_metrics_facility_id_year_code_key' }],
}

/** Giá trị mặc định của cột (theo schema.sql) */
const DEFAULTS: Record<string, () => Row> = {
  organizations: () => ({ plan: 'trial', tax_code: null }),
  profiles: () => ({ role: 'officer', phone: null, facility_id: null }),
  waste_types: () => ({ category: 'CTNH', unit: 'kg' }),
  waste_logs: () => ({ log_date: today() }),
  waste_transfers: () => ({ status: 'draft', transfer_date: today() }),
  treatment_systems: () => ({ kind: 'nuoc_thai' }),
  operation_logs: () => ({ shift: 'Ca 1', chemical_usage: {}, log_date: today() }),
  monitoring_points: () => ({ kind: 'nuoc_thai' }),
  monitoring_results: () => ({ is_exceeded: false, sample_date: today() }),
  alerts: () => ({ level: 'warning', status: 'open' }),
  checklist_templates: () => ({ category: 'PCCC', frequency: 'monthly', items: [] }),
  checklist_runs: () => ({ results: [], run_date: today() }),
  fire_equipment: () => ({ type: 'binh_bot', quantity: 1, status: 'tot' }),
  drills: () => ({ kind: 'PCCC', drill_date: today() }),
  contractor_permits: () => ({ commitment_signed: false, safety_briefing: false }),
  incidents: () => ({ kind: 'moi_truong', severity: 'nhe', status: 'open', incident_date: today() }),
  capa_actions: () => ({ status: 'open' }),
  chemicals: () => ({ unit: 'kg', pathh_available: false }),
  legal_documents: () => ({ category: 'GPMT' }),
  compliance_tasks: () => ({ category: 'bao_cao', recurrence: 'none', remind_days: 14, status: 'pending' }),
  employees: () => ({ status: 'active' }),
  training_courses: () => ({ category: 'atvsld' }),
  training_records: () => ({ result: 'dat' }),
  esg_policies: () => ({ pillar: 'E', status: 'draft' }),
  esg_targets: () => ({ pillar: 'E', direction: 'decrease' }),
  internal_rules: () => ({ category: 'moi_truong', status: 'active' }),
  rule_violations: () => ({
    violation_date: today(),
    category: 'moi_truong',
    kind: 'hanh_vi',
    subject_type: 'don_vi',
    severity: 'nhe',
    community_impact: false,
    counts_for_unit: true,
    status: 'open',
  }),
}

/** Bảng ảo (view) */
const VIEWS: Record<string, (db: DemoDb) => Row[]> = {
  waste_inventory: (db) =>
    (db.waste_types ?? []).map((wt) => {
      const totalIn = (db.waste_logs ?? [])
        .filter((l) => l.waste_type_id === wt.id)
        .reduce((s, l) => s + Number(l.quantity ?? 0), 0)
      const done = new Set(
        (db.waste_transfers ?? []).filter((t) => t.status === 'signed' || t.status === 'completed').map((t) => t.id)
      )
      const totalOut = (db.waste_transfer_items ?? [])
        .filter((i) => i.waste_type_id === wt.id && done.has(i.transfer_id))
        .reduce((s, i) => s + Number(i.quantity ?? 0), 0)
      return {
        waste_type_id: wt.id,
        org_id: wt.org_id,
        facility_id: wt.facility_id,
        code: wt.code,
        name: wt.name,
        category: wt.category,
        unit: wt.unit,
        storage_location: wt.storage_location,
        total_in: totalIn,
        total_out: totalOut,
        stock: totalIn - totalOut,
      }
    }),
}

// ---------------- Lưu trữ ----------------

let memory: DemoDb | null = null

function load(): DemoDb {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) memory = JSON.parse(raw) as DemoDb
  } catch {
    memory = null
  }
  if (!memory) {
    memory = buildSeed(uuid)
    persist()
  }
  return memory
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch {
    /* hết dung lượng hoặc chặn lưu trữ: vẫn chạy trong bộ nhớ */
  }
}

/** Xóa dữ liệu dùng thử, tạo lại bộ dữ liệu mẫu ở lần tải tiếp theo */
export function resetDemoData() {
  memory = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* bỏ qua */
  }
}

// ---------------- Phân tích chuỗi select ----------------

interface SelNode {
  name: string
  alias?: string
  children?: SelNode[]
}

function splitTop(s: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out.map((x) => x.trim()).filter(Boolean)
}

function parseSelect(s: string): SelNode[] {
  return splitTop(s || '*').map((part) => {
    let alias: string | undefined
    let body = part
    const colon = part.indexOf(':')
    const paren = part.indexOf('(')
    if (colon > 0 && (paren < 0 || colon < paren)) {
      alias = part.slice(0, colon).trim()
      body = part.slice(colon + 1).trim()
    }
    const p = body.indexOf('(')
    if (p > 0 && body.endsWith(')')) {
      const name = body.slice(0, p).split('!')[0].trim()
      return { name, alias, children: parseSelect(body.slice(p + 1, -1)) }
    }
    return { name: body.trim(), alias }
  })
}

const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)))

function rowsOf(db: DemoDb, table: string): Row[] {
  if (VIEWS[table]) return VIEWS[table](db)
  return db[table] ?? (db[table] = [])
}

function project(db: DemoDb, table: string, row: Row, nodes: SelNode[]): Row {
  const out: Row = {}
  for (const n of nodes) {
    if (n.name === '*') {
      Object.assign(out, clone(row))
    } else if (n.children) {
      const key = n.alias ?? n.name
      const fkHere = FK[table]?.[n.name]
      if (fkHere) {
        const target = rowsOf(db, n.name).find((r) => r.id === row[fkHere])
        out[key] = target ? project(db, n.name, target, n.children) : null
      } else {
        const fkThere = FK[n.name]?.[table]
        out[key] = fkThere
          ? rowsOf(db, n.name)
              .filter((r) => r[fkThere] === row.id)
              .map((r) => project(db, n.name, r, n.children!))
          : []
      }
    } else {
      out[n.alias ?? n.name] = clone(row[n.name] ?? null)
    }
  }
  return out
}

function compare(a: any, b: any): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'vi')
}

// ---------------- Truy vấn ----------------

type Filter = (r: Row) => boolean
const same = (a: any, b: any) => a === b || (a != null && b != null && String(a) === String(b))

class DemoQuery implements PromiseLike<Result> {
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private sel = '*'
  private returning = false
  private filters: Filter[] = []
  private orders: { col: string; asc: boolean }[] = []
  private max?: number
  private payload: any
  private mode?: 'single' | 'maybe'

  constructor(private table: string) {}

  select(cols = '*') {
    if (this.op === 'select') this.sel = cols
    else {
      this.returning = true
      this.sel = cols
    }
    return this
  }
  insert(values: Row | Row[]) {
    this.op = 'insert'
    this.payload = values
    return this
  }
  update(values: Row) {
    this.op = 'update'
    this.payload = values
    return this
  }
  delete() {
    this.op = 'delete'
    return this
  }
  eq(col: string, val: any) {
    this.filters.push((r) => same(r[col], val))
    return this
  }
  neq(col: string, val: any) {
    this.filters.push((r) => !same(r[col], val))
    return this
  }
  in(col: string, vals: any[]) {
    this.filters.push((r) => vals.some((v) => same(r[col], v)))
    return this
  }
  is(col: string, val: any) {
    this.filters.push((r) => (val === null ? r[col] == null : r[col] === val))
    return this
  }
  gte(col: string, val: any) {
    this.filters.push((r) => r[col] != null && compare(r[col], val) >= 0)
    return this
  }
  lte(col: string, val: any) {
    this.filters.push((r) => r[col] != null && compare(r[col], val) <= 0)
    return this
  }
  gt(col: string, val: any) {
    this.filters.push((r) => r[col] != null && compare(r[col], val) > 0)
    return this
  }
  lt(col: string, val: any) {
    this.filters.push((r) => r[col] != null && compare(r[col], val) < 0)
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending ?? true })
    return this
  }
  limit(n: number) {
    this.max = n
    return this
  }
  single() {
    this.mode = 'single'
    return this
  }
  maybeSingle() {
    this.mode = 'maybe'
    return this
  }

  then<T1 = Result, T2 = never>(
    onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null
  ): PromiseLike<T1 | T2> {
    return Promise.resolve()
      .then(() => this.run())
      .then(onfulfilled, onrejected)
  }

  private match(rows: Row[]) {
    return rows.filter((r) => this.filters.every((f) => f(r)))
  }

  private finish(rows: Row[]): Result {
    const db = load()
    const nodes = parseSelect(this.sel)
    let data: any = rows.map((r) => project(db, this.table, r, nodes))
    if (this.mode) {
      if (data.length === 1) data = data[0]
      else if (data.length === 0 && this.mode === 'maybe') data = null
      else return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } }
    }
    return { data, error: null }
  }

  private uniqueError(rows: Row[], candidate: Row): Result | null {
    for (const u of UNIQUE[this.table] ?? []) {
      if (u.cols.some((c) => candidate[c] == null)) continue
      const dup = rows.some((r) => r.id !== candidate.id && u.cols.every((c) => same(r[c], candidate[c])))
      if (dup)
        return {
          data: null,
          error: { message: `duplicate key value violates unique constraint "${u.name}"`, code: '23505' },
        }
    }
    return null
  }

  private run(): Result {
    const db = load()
    if (VIEWS[this.table] && this.op !== 'select')
      return { data: null, error: { message: 'Không ghi được vào view ' + this.table } }
    const all = rowsOf(db, this.table)

    if (this.op === 'select') {
      let rows = this.match(all)
      if (this.orders.length) {
        rows = [...rows].sort((a, b) => {
          for (const o of this.orders) {
            const va = a[o.col]
            const vb = b[o.col]
            if (va == null && vb == null) continue
            // như PostgreSQL: tăng dần → NULL cuối; giảm dần → NULL đầu
            if (va == null) return o.asc ? 1 : -1
            if (vb == null) return o.asc ? -1 : 1
            const c = compare(va, vb)
            if (c !== 0) return o.asc ? c : -c
          }
          return 0
        })
      }
      if (this.max != null) rows = rows.slice(0, this.max)
      return this.finish(rows)
    }

    if (this.op === 'insert') {
      const list: Row[] = Array.isArray(this.payload) ? this.payload : [this.payload]
      const created: Row[] = []
      for (const v of list) {
        const row: Row = {
          ...(DEFAULTS[this.table]?.() ?? {}),
          ...clone(v),
          id: v.id ?? uuid(),
          created_at: v.created_at ?? new Date().toISOString(),
        }
        const err = this.uniqueError([...all, ...created], row)
        if (err) return err
        created.push(row)
      }
      all.push(...created)
      persist()
      return this.returning ? this.finish(created) : { data: null, error: null }
    }

    if (this.op === 'update') {
      const targets = this.match(all)
      const { id: _ignored, ...values } = this.payload ?? {}
      for (const r of targets) {
        const next = { ...r, ...clone(values) }
        const err = this.uniqueError(all, next)
        if (err) return err
      }
      for (const r of targets) Object.assign(r, clone(values))
      persist()
      return this.returning ? this.finish(targets) : { data: null, error: null }
    }

    // delete
    const targets = this.match(all)
    const ids = new Set(targets.map((r) => r.id))
    for (const rule of ON_DELETE[this.table] ?? []) {
      const children = rowsOf(db, rule.table).filter((c) => ids.has(c[rule.column]))
      if (children.length && rule.action === 'restrict')
        return {
          data: null,
          error: {
            message: `update or delete on table "${this.table}" violates foreign key constraint on table "${rule.table}"`,
            code: '23503',
          },
        }
    }
    const cascade = (table: string, idSet: Set<string>) => {
      for (const rule of ON_DELETE[table] ?? []) {
        const childRows = rowsOf(db, rule.table)
        if (rule.action === 'set null') {
          for (const c of childRows) if (idSet.has(c[rule.column])) c[rule.column] = null
        } else if (rule.action === 'cascade') {
          const removed = new Set(childRows.filter((c) => idSet.has(c[rule.column])).map((c) => c.id))
          if (removed.size) {
            cascade(rule.table, removed)
            db[rule.table] = childRows.filter((c) => !removed.has(c.id))
          }
        }
      }
    }
    cascade(this.table, ids)
    db[this.table] = all.filter((r) => !ids.has(r.id))
    persist()
    return { data: null, error: null }
  }
}

// ---------------- Xác thực giả lập ----------------

type AuthCallback = (event: string, session: any) => void
const listeners = new Set<AuthCallback>()

function sessionObj() {
  return {
    access_token: 'demo',
    token_type: 'bearer',
    user: { id: DEMO_USER_ID, email: 'dungthu@ehsviet.local', app_metadata: {}, user_metadata: {} },
  }
}

function signedIn(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return memorySession
  }
}
let memorySession = false

function setSignedIn(v: boolean) {
  memorySession = v
  try {
    if (v) localStorage.setItem(SESSION_KEY, '1')
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* bỏ qua */
  }
}

function emit(event: string) {
  const s = signedIn() ? sessionObj() : null
  for (const cb of listeners) cb(event, s)
}

export function createDemoClient() {
  return {
    from: (table: string) => new DemoQuery(table),
    auth: {
      getSession: async () => ({ data: { session: signedIn() ? sessionObj() : null }, error: null }),
      onAuthStateChange: (cb: AuthCallback) => {
        listeners.add(cb)
        return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } }
      },
      signInWithPassword: async () => {
        setSignedIn(true)
        emit('SIGNED_IN')
        return { data: { session: sessionObj(), user: sessionObj().user }, error: null }
      },
      signUp: async () => {
        setSignedIn(true)
        emit('SIGNED_IN')
        return { data: { session: sessionObj(), user: sessionObj().user }, error: null }
      },
      signOut: async () => {
        setSignedIn(false)
        emit('SIGNED_OUT')
        return { error: null }
      },
    },
  }
}
