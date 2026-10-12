import { IconCheck, IconTarget } from '../components/icons'
import { Cell, Page, Section } from '../components/ui'
import { type LibraryKind, setsOfKind } from '../library'
import { useRouter } from '../router'
import { useData } from '../store'
import { plural } from '../utils'

const TITLES: Record<LibraryKind, { title: string; text: string }> = {
  level: { title: 'Уровни', text: 'Слова по шкале CEFR — от первых шагов до свободного владения.' },
  topic: { title: 'Темы', text: 'Наборы слов для конкретных ситуаций.' },
  verbs: { title: 'Глаголы', text: 'Неправильные глаголы с тремя формами и самые частые фразовые глаголы.' },
}

/** Цветная плашка уровня: A — зелёные, B — синие, C — фиолетовые. */
export function LevelBadge({ badge, size = 40 }: { badge: string; size?: number }) {
  const color = badge.startsWith('A') ? '#31b545' : badge.startsWith('B') ? '#2f8cf0' : badge.startsWith('C') ? '#8e5cf0' : undefined
  if (!color) {
    return (
      <span className="flex items-center justify-center rounded-xl bg-bg" style={{ width: size, height: size, fontSize: size * 0.5 }}>
        {badge}
      </span>
    )
  }
  return (
    <span
      className="flex items-center justify-center rounded-xl font-bold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
    >
      {badge}
    </span>
  )
}

export function LibraryScreen({ kind }: { kind: LibraryKind }) {
  const { decks } = useData()
  const { push } = useRouter()
  const sets = setsOfKind(kind)
  const added = new Set(decks.map((d) => d.source).filter(Boolean))

  return (
    <Page>
      <h1 className="mb-1 px-1 text-[26px] font-bold">{TITLES[kind].title}</h1>
      <div className="mb-5 px-1 text-[15px] text-hint">{TITLES[kind].text}</div>

      {kind === 'level' && (
        <Section>
          <Cell
            before={<span className="text-link"><IconTarget size={22} /></span>}
            title="Не знаешь свой уровень?"
            subtitle="Пройди тест — займёт пару минут"
            chevron
            onClick={() => push({ name: 'levelTest' })}
          />
        </Section>
      )}

      <Section>
        {sets.map((s) => (
          <Cell
            key={s.id}
            before={<div className="py-1.5"><LevelBadge badge={s.badge} /></div>}
            title={kind === 'level' ? s.title.split(' — ')[1] : s.title}
            subtitle={`${s.words.length} ${plural(s.words.length, 'слово', 'слова', 'слов')} · ${s.subtitle}`}
            after={added.has(s.id) ? <span className="text-success"><IconCheck size={20} /></span> : undefined}
            chevron
            onClick={() => push({ name: 'librarySet', setId: s.id })}
          />
        ))}
      </Section>
    </Page>
  )
}
