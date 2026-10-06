import { X } from 'lucide-react'
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cls } from '../lib/utils'

/* ---------------- Button ---------------- */
type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger'
export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-viridian-600 text-white hover:bg-viridian-700 disabled:opacity-50',
    outline: 'border border-pine-800/20 text-pine-800 hover:bg-pine-800/5',
    ghost: 'text-pine-800/70 hover:bg-pine-800/5',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  return (
    <button
      className={cls(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        styles[variant],
        className
      )}
      {...props}
    />
  )
}

/* ---------------- Card ---------------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cls('rounded-xl border border-pine-800/10 bg-white', className)}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  hint,
  action,
}: {
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pine-800/10 px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold text-pine-800">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-pine-800/50">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---------------- Badge ---------------- */
export type Tone = 'green' | 'amber' | 'red' | 'gray' | 'blue'
export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  const tones: Record<Tone, string> = {
    green: 'bg-viridian-50 text-viridian-700 border-viridian-600/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-600/20',
    red: 'bg-red-50 text-red-700 border-red-600/20',
    gray: 'bg-pine-800/5 text-pine-800/70 border-pine-800/10',
    blue: 'bg-steel-50 text-steel-600 border-steel-600/20',
  }
  return (
    <span
      className={cls(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        tones[tone]
      )}
    >
      {children}
    </span>
  )
}

/* ---------------- Form controls ---------------- */
const controlCls =
  'w-full rounded-lg border border-pine-800/20 bg-white px-3 py-2 text-sm text-pine-800 placeholder:text-pine-800/35 focus:border-viridian-600'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cls(controlCls, props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cls(controlCls, props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cls(controlCls, props.className)} />
}

export function Field({
  label,
  required,
  children,
  className,
}: {
  label: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cls('block text-sm', className)}>
      <span className="mb-1 block font-medium text-pine-800/80">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  )
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-pine-950/50 p-0 sm:items-center sm:p-4">
      <div
        className={cls(
          'flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
        )}
      >
        <div className="flex items-center justify-between border-b border-pine-800/10 px-4 py-3">
          <h3 className="text-sm font-semibold text-pine-800">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-pine-800/50 hover:bg-pine-800/5"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-pine-800/10 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- Tabs ---------------- */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cls(
            'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            active === t.key
              ? 'bg-pine-900 text-white'
              : 'text-pine-800/60 hover:bg-pine-800/5'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ---------------- Table ---------------- */
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-pine-800/10 text-xs uppercase tracking-wide text-pine-800/50">
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-pine-800/5">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cls('px-4 py-2.5 align-top', className)}>{children}</td>
}

/* ---------------- Trạng thái trống / tải ---------------- */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm font-medium text-pine-800/70">{title}</p>
      {hint && <p className="mt-1 text-xs text-pine-800/45">{hint}</p>}
    </div>
  )
}

export function Loading() {
  return <div className="px-4 py-8 text-center text-sm text-pine-800/50">Đang tải dữ liệu…</div>
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-600/20 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  )
}

/* ---------------- Ô chỉ số (KPI) ---------------- */
export function Kpi({
  label,
  value,
  sub,
  tone = 'gray',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
}) {
  const bar: Record<Tone, string> = {
    green: 'bg-viridian-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    gray: 'bg-pine-800/20',
    blue: 'bg-steel-600',
  }
  return (
    <div className="relative min-w-[150px] flex-1 overflow-hidden rounded-xl border border-pine-800/10 bg-white px-3.5 py-3">
      <span className={cls('absolute inset-y-0 left-0 w-1', bar[tone])} />
      <div className="text-[11px] font-medium uppercase tracking-wide text-pine-800/50">{label}</div>
      <div className="mt-1 text-lg font-bold leading-tight text-pine-800 [font-variant-numeric:tabular-nums]">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-pine-800/50">{sub}</div>}
    </div>
  )
}

/* ---------------- Thanh tiến độ ---------------- */
export function Progress({ value, tone = 'green' }: { value: number; tone?: Tone }) {
  const fill: Record<Tone, string> = {
    green: 'bg-viridian-600',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    gray: 'bg-pine-800/30',
    blue: 'bg-steel-600',
  }
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-pine-800/10">
      <div className={cls('h-full rounded-full transition-all', fill[tone])} style={{ width: pct + '%' }} />
    </div>
  )
}

/* ---------------- Ghi chú căn cứ / hướng dẫn ---------------- */
export function Note({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'amber' | 'blue' }) {
  const tones = {
    gray: 'border-pine-800/10 bg-pine-800/[0.03] text-pine-800/70',
    amber: 'border-amber-600/25 bg-amber-50 text-amber-800',
    blue: 'border-steel-600/20 bg-steel-50 text-steel-600',
  }
  return <div className={cls('rounded-lg border px-3 py-2 text-xs leading-relaxed', tones[tone])}>{children}</div>
}
