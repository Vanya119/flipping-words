import type { ReactNode } from 'react'

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-xl px-4 pt-4 pb-28 ${className}`}>{children}</div>
}

export function Section({ title, footer, children }: { title?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-6">
      {title && <div className="mb-1.5 px-4 text-[13px] font-medium uppercase text-section-header">{title}</div>}
      <div className="overflow-hidden rounded-xl bg-section">{children}</div>
      {footer && <div className="mt-1.5 px-4 text-[13px] text-hint">{footer}</div>}
    </div>
  )
}

interface CellProps {
  title: ReactNode
  subtitle?: ReactNode
  before?: ReactNode
  after?: ReactNode
  chevron?: boolean
  tone?: 'default' | 'link' | 'destructive'
  onClick?: () => void
}

export function Cell({ title, subtitle, before, after, chevron, tone = 'default', onClick }: CellProps) {
  const color = tone === 'link' ? 'text-link' : tone === 'destructive' ? 'text-destructive' : ''
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`group flex w-full items-center gap-3 pl-4 text-left ${onClick ? 'pressable cursor-pointer' : ''}`}
    >
      {before && <div className="shrink-0">{before}</div>}
      <div className="flex min-h-11 flex-1 items-center gap-2 border-b border-separator py-2.5 pr-4 group-last:border-b-0">
        <div className="min-w-0 flex-1">
          <div className={`truncate text-[16px] ${color}`}>{title}</div>
          {subtitle && <div className="truncate text-[14px] text-hint">{subtitle}</div>}
        </div>
        {after && <div className="shrink-0 text-[15px] text-hint">{after}</div>}
        {chevron && (
          <svg width="8" height="14" viewBox="0 0 8 14" className="shrink-0 text-hint opacity-60">
            <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </Tag>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  autoFocus,
  lang,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  autoFocus?: boolean
  lang?: string
}) {
  const cls = 'w-full bg-transparent px-4 py-3 text-[16px] outline-none placeholder:text-hint'
  return (
    <label className="block border-b border-separator last:border-b-0">
      {label && <div className="px-4 pt-2.5 text-[13px] text-hint">{label}</div>}
      {multiline ? (
        <textarea
          className={`${cls} min-h-20 resize-none ${label ? 'pt-1' : ''}`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          lang={lang}
        />
      ) : (
        <input
          className={`${cls} ${label ? 'pt-1' : ''}`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          lang={lang}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      )}
    </label>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-[10px] bg-section p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg py-1.5 text-[14px] font-medium transition-colors ${
            o.value === value ? 'bg-button text-button-text' : 'text-hint'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Tile({
  icon,
  label,
  badge,
  onClick,
  disabled,
}: {
  icon: ReactNode
  label: string
  badge?: number
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="pressable relative flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-section py-3.5 disabled:opacity-40"
    >
      <span className="text-accent">{icon}</span>
      <span className="text-[13px] font-medium">{label}</span>
      {!!badge && (
        <span className="absolute top-2 right-2 min-w-5 rounded-full bg-button px-1.5 text-[12px] leading-5 font-semibold text-button-text">
          {badge}
        </span>
      )}
    </button>
  )
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <div className="mb-4 text-accent">{icon}</div>
      <div className="mb-1 text-[20px] font-semibold">{title}</div>
      {text && <div className="text-[15px] text-hint">{text}</div>}
    </div>
  )
}

export function LevelDots({ box }: { box: number }) {
  const filled = Math.min(5, box)
  return (
    <span className="flex gap-0.5" title={`Ступень ${box}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < filled ? 'bg-success' : 'bg-hint/30'}`} />
      ))}
    </span>
  )
}
