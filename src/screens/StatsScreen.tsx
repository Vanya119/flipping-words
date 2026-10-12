import { useMemo, useRef, useState } from 'react'
import { Cell, Page, Section } from '../components/ui'
import { getSet } from '../library'
import { dayKey, LEARNED_BOX } from '../srs'
import { useData } from '../store'
import type { DayStat } from '../types'
import { plural } from '../utils'

const DAY = 24 * 60 * 60 * 1000
const WEEKS = 18

/** Ступени одного оттенка (цвет кнопки темы), от фона к насыщенному. */
const shade = (pct: number) => `color-mix(in srgb, var(--button) ${pct}%, var(--bg))`
const HEAT = [shade(0), shade(30), shade(55), shade(78), shade(100)]

function heatLevel(r: number) {
  if (r === 0) return 0
  if (r < 10) return 1
  if (r < 30) return 2
  if (r < 60) return 3
  return 4
}

const fmtDay = (ts: number) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

function Tile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl bg-section px-4 py-3">
      <div className="text-[24px] leading-tight font-bold tabular-nums">{value}</div>
      <div className="text-[13px] text-hint">{label}</div>
    </div>
  )
}

function Heatmap({ days }: { days: Record<string, DayStat> }) {
  const [picked, setPicked] = useState<number | null>(null)
  // Сетка заканчивается текущей неделей; недели начинаются с понедельника
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const weekday = (today.getDay() + 6) % 7
  const start = today.getTime() - (WEEKS * 7 - 1 - (6 - weekday)) * DAY
  const columns = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => start + (w * 7 + d) * DAY))
  const pickedStat = picked !== null ? days[dayKey(picked)] : undefined

  return (
    <div className="rounded-xl bg-section p-4">
      <div className="flex gap-[3px]">
        <div className="mr-1 grid grid-rows-7 gap-[3px] text-[10px] leading-none text-hint">
          {['Пн', '', 'Ср', '', 'Пт', '', ''].map((l, i) => (
            <div key={i} className="flex aspect-square items-center">
              {l}
            </div>
          ))}
        </div>
        {columns.map((col, w) => (
          <div key={w} className="grid flex-1 grid-rows-7 gap-[3px]">
            {col.map((ts) => {
              const future = ts > today.getTime()
              const r = days[dayKey(ts)]?.r ?? 0
              return (
                <button
                  key={ts}
                  disabled={future}
                  onClick={() => setPicked(picked === ts ? null : ts)}
                  aria-label={`${fmtDay(ts)}: ${r} ответов`}
                  className={`aspect-square rounded-[3px] ${picked === ts ? 'ring-2 ring-text' : ''}`}
                  style={{ background: future ? 'transparent' : HEAT[heatLevel(r)] }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-hint">
        <span className="min-h-4">
          {picked !== null
            ? pickedStat
              ? `${fmtDay(picked)}: ${pickedStat.r} ${plural(pickedStat.r, 'ответ', 'ответа', 'ответов')}, ${Math.round((pickedStat.c / pickedStat.r) * 100)}% верно`
              : `${fmtDay(picked)}: нет занятий`
            : 'Нажми на день, чтобы увидеть детали'}
        </span>
        <span className="flex items-center gap-1">
          меньше
          {HEAT.map((c, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />
          ))}
          больше
        </span>
      </div>
    </div>
  )
}

/** Линия «выучено слов» за 30 дней; пропущенные дни продолжают последнее значение. */
function LearnedChart({ days, current }: { days: Record<string, DayStat>; current: number }) {
  const N = 30
  const points = useMemo(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    // Значение до начала окна — последний известный день раньше него
    const firstTs = today.getTime() - (N - 1) * DAY
    const before = Object.keys(days)
      .filter((k) => k < dayKey(firstTs))
      .sort()
      .pop()
    let last = before ? days[before].l : 0
    return Array.from({ length: N }, (_, i) => {
      const ts = firstTs + i * DAY
      const d = days[dayKey(ts)]
      if (d) last = d.l
      if (i === N - 1) last = current
      return { ts, v: last }
    })
  }, [days, current])

  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 320
  const H = 140
  const PAD = { l: 8, r: 8, t: 12, b: 20 }
  const max = Math.max(5, ...points.map((p) => p.v))
  const x = (i: number) => PAD.l + (i / (N - 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('')
  const area = `${line}L${x(N - 1)},${H - PAD.b}L${x(0)},${H - PAD.b}Z`

  const onMove = (clientX: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const rel = ((clientX - rect.left) / rect.width) * W
    const i = Math.round(((rel - PAD.l) / (W - PAD.l - PAD.r)) * (N - 1))
    setHover(Math.max(0, Math.min(N - 1, i)))
  }

  const hp = hover !== null ? points[hover] : points[N - 1]
  const hi = hover ?? N - 1

  return (
    <div className="rounded-xl bg-section p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <div className="text-[24px] leading-tight font-bold tabular-nums">{hp.v}</div>
        <div className="text-[13px] text-hint">{hover !== null ? fmtDay(hp.ts) : 'сегодня'}</div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerDown={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Выучено слов за 30 дней: от ${points[0].v} до ${points[N - 1].v}`}
      >
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--separator)" strokeWidth="1" />
        <line x1={PAD.l} x2={W - PAD.r} y1={y(max)} y2={y(max)} stroke="var(--separator)" strokeWidth="1" strokeDasharray="2 4" />
        <path d={area} fill="var(--button)" opacity="0.12" />
        <path d={line} fill="none" stroke="var(--button)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <line x1={x(hi)} x2={x(hi)} y1={PAD.t} y2={H - PAD.b} stroke="var(--hint)" strokeWidth="1" opacity={hover !== null ? 0.6 : 0} />
        <circle cx={x(hi)} cy={y(hp.v)} r="4.5" fill="var(--button)" stroke="var(--section)" strokeWidth="2" />
        <text x={PAD.l} y={H - 4} fontSize="10" fill="var(--hint)">
          {fmtDay(points[0].ts)}
        </text>
        <text x={W - PAD.r} y={H - 4} fontSize="10" fill="var(--hint)" textAnchor="end">
          сегодня
        </text>
        <text x={W - PAD.r} y={y(max) - 3} fontSize="10" fill="var(--hint)" textAnchor="end">
          {max}
        </text>
      </svg>
    </div>
  )
}

function StageBar({ fresh, learning, learned }: { fresh: number; learning: number; learned: number }) {
  const total = fresh + learning + learned || 1
  const parts = [
    { label: 'Новые', value: fresh, color: shade(28) },
    { label: 'Изучаются', value: learning, color: shade(60) },
    { label: 'Выучены', value: learned, color: shade(100) },
  ]
  return (
    <div className="rounded-xl bg-section p-4">
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={`${p.label}: ${p.value}`} />
          ))}
      </div>
      <div className="mt-3 flex justify-between text-[13px]">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.color }} />
            <span className="text-hint">{p.label}</span>
            <span className="font-semibold tabular-nums">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatsScreen() {
  const { decks, days, levelTests } = useData()
  const words = decks.flatMap((d) => d.words.map((w) => ({ ...w, deck: d.name })))
  const learned = words.filter((w) => w.box >= LEARNED_BOX).length
  const fresh = words.filter((w) => w.box === 0).length
  const totals = Object.values(days).reduce((a, d) => ({ r: a.r + d.r, c: a.c + d.c }), { r: 0, c: 0 })
  const activeDays = Object.values(days).filter((d) => d.r > 0).length
  const hardest = words
    .filter((w) => (w.lapses ?? 0) > 0)
    .sort((a, b) => (b.lapses ?? 0) - (a.lapses ?? 0))
    .slice(0, 10)

  return (
    <Page>
      <h1 className="mb-4 px-1 text-[26px] font-bold">Статистика</h1>

      <div className="mb-6 grid grid-cols-2 gap-2.5">
        <Tile value={words.length} label="слов в колодах" />
        <Tile value={learned} label="выучено" />
        <Tile value={totals.r ? `${Math.round((totals.c / totals.r) * 100)}%` : '—'} label="верных ответов" />
        <Tile value={activeDays} label={plural(activeDays, 'день занятий', 'дня занятий', 'дней занятий')} />
      </div>

      <div className="mb-1.5 px-4 text-[13px] font-medium text-section-header uppercase">Активность</div>
      <div className="mb-6">
        <Heatmap days={days} />
      </div>

      <div className="mb-1.5 px-4 text-[13px] font-medium text-section-header uppercase">Выучено слов за 30 дней</div>
      <div className="mb-6">
        <LearnedChart days={days} current={learned} />
      </div>

      <div className="mb-1.5 px-4 text-[13px] font-medium text-section-header uppercase">Слова по стадиям</div>
      <div className="mb-1.5">
        <StageBar fresh={fresh} learning={words.length - fresh - learned} learned={learned} />
      </div>
      <div className="mb-6 px-4 text-[13px] text-hint">Выученным считается слово с интервалом повторения от 30 дней.</div>

      <Section title="Самые трудные слова" footer={hardest.length ? undefined : 'Пока нет — ошибки в карточках и тестах появятся здесь.'}>
        {hardest.map((w) => (
          <Cell key={w.id} title={w.en} subtitle={`${w.ru} · ${w.deck}`} after={`${w.lapses} ${plural(w.lapses!, 'ошибка', 'ошибки', 'ошибок')}`} />
        ))}
      </Section>

      {levelTests.length > 0 && (
        <Section title="Тесты на уровень">
          {[...levelTests]
            .reverse()
            .slice(0, 10)
            .map((t) => (
              <Cell key={t.at} title={t.level ? getSet(t.level)!.title : 'Ниже A1'} after={fmtDay(t.at)} />
            ))}
        </Section>
      )}
    </Page>
  )
}
