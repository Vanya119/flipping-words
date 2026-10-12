// Встроенная библиотека наборов. Сами слова лежат в src/data/**/*.txt:
// «en|ru» или «en|v2|v3|ru» для неправильных глаголов.
import { uid } from './store'
import type { Word } from './types'

const files = import.meta.glob('./data/**/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export type LibraryKind = 'level' | 'topic' | 'verbs'

export interface LibraryEntry {
  en: string
  ru: string
  forms?: [string, string]
}

export interface LibrarySet {
  id: string
  kind: LibraryKind
  /** Короткая метка: «A1», эмодзи темы и т.п. */
  badge: string
  title: string
  subtitle: string
  words: LibraryEntry[]
}

function parse(text: string): LibraryEntry[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const p = l.split('|').map((x) => x.trim())
      return p.length === 4 ? { en: p[0], ru: p[3], forms: [p[1], p[2]] as [string, string] } : { en: p[0], ru: p[1] }
    })
}

const META: Omit<LibrarySet, 'words'>[] = [
  { id: 'a1', kind: 'level', badge: 'A1', title: 'A1 — Начальный', subtitle: 'Самые базовые слова' },
  { id: 'a2', kind: 'level', badge: 'A2', title: 'A2 — Элементарный', subtitle: 'Повседневные ситуации' },
  { id: 'b1', kind: 'level', badge: 'B1', title: 'B1 — Средний', subtitle: 'Свободное общение на простые темы' },
  { id: 'b2', kind: 'level', badge: 'B2', title: 'B2 — Выше среднего', subtitle: 'Абстрактные темы, работа, учёба' },
  { id: 'c1', kind: 'level', badge: 'C1', title: 'C1 — Продвинутый', subtitle: 'Академическая и деловая лексика' },
  { id: 'c2', kind: 'level', badge: 'C2', title: 'C2 — Профессиональный', subtitle: 'Редкие и книжные слова' },
  { id: 'travel', kind: 'topic', badge: '✈️', title: 'Путешествия', subtitle: 'Аэропорт, отель, транспорт' },
  { id: 'food', kind: 'topic', badge: '🍳', title: 'Еда и кухня', subtitle: 'Продукты, вкусы, готовка' },
  { id: 'home', kind: 'topic', badge: '🏠', title: 'Дом и быт', subtitle: 'Комнаты, мебель, техника' },
  { id: 'work', kind: 'topic', badge: '💼', title: 'Работа и бизнес', subtitle: 'Офис, деньги, переговоры' },
  { id: 'it', kind: 'topic', badge: '💻', title: 'IT и технологии', subtitle: 'Компьютеры, интернет, разработка' },
  { id: 'health', kind: 'topic', badge: '🩺', title: 'Здоровье и тело', subtitle: 'Части тела, болезни, врач' },
  { id: 'emotions', kind: 'topic', badge: '🙂', title: 'Эмоции и характер', subtitle: 'Чувства и черты личности' },
  { id: 'nature', kind: 'topic', badge: '🌿', title: 'Природа и погода', subtitle: 'Ландшафт, явления, климат' },
  { id: 'irregular', kind: 'verbs', badge: '🔁', title: 'Неправильные глаголы', subtitle: 'go – went – gone и ещё сотня' },
  { id: 'phrasal', kind: 'verbs', badge: '🧩', title: 'Фразовые глаголы', subtitle: 'give up, look after, find out…' },
]

const FILES: Record<string, string> = {
  a1: 'levels/a1', a2: 'levels/a2', b1: 'levels/b1', b2: 'levels/b2', c1: 'levels/c1', c2: 'levels/c2',
  travel: 'topics/travel', food: 'topics/food', home: 'topics/home', work: 'topics/work',
  it: 'topics/it', health: 'topics/health', emotions: 'topics/emotions', nature: 'topics/nature',
  irregular: 'verbs/irregular', phrasal: 'verbs/phrasal',
}

export const librarySets: LibrarySet[] = META.map((m) => ({ ...m, words: parse(files[`./data/${FILES[m.id]}.txt`] ?? '') }))

export const LEVEL_IDS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const

export const getSet = (id: string) => librarySets.find((s) => s.id === id)

export const setsOfKind = (kind: LibraryKind) => librarySets.filter((s) => s.kind === kind)

/** Превращает набор в новые слова для колоды (с чистым прогрессом). */
export function setToWords(set: LibrarySet): Word[] {
  const now = Date.now()
  return set.words.map((w) => ({ ...w, id: uid(), createdAt: now, box: 0, due: now }))
}
