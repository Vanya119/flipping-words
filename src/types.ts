export interface Word {
  id: string
  en: string
  ru: string
  example?: string
  note?: string
  createdAt: number
  /** Ступень интервального повторения (0 — новое/забытое). */
  box: number
  /** Когда слово снова нужно показать (timestamp). */
  due: number
  /** Сколько раз слово было забыто — для списка «трудных слов». */
  lapses?: number
  /** Формы неправильного глагола: Past Simple и Past Participle. */
  forms?: [string, string]
}

export interface Deck {
  id: string
  name: string
  createdAt: number
  words: Word[]
  /** id набора из библиотеки, если колода добавлена оттуда. */
  source?: string
}

export type Direction = 'en-ru' | 'ru-en'

export interface Settings {
  direction: Direction
}

export interface DayStat {
  /** Ответов за день. */
  r: number
  /** Из них верных. */
  c: number
  /** Выучено слов на конец дня. */
  l: number
}

export interface LevelTestResult {
  at: number
  /** Самый высокий пройденный уровень ('a1'…'c2') или null, если не пройден даже A1. */
  level: string | null
}

export interface AppData {
  v: 1
  decks: Deck[]
  settings: Settings
  /** Статистика по дням, ключ — 'YYYY-MM-DD'. */
  days: Record<string, DayStat>
  levelTests: LevelTestResult[]
  updatedAt: number
}
