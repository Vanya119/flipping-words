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
}

export interface Deck {
  id: string
  name: string
  createdAt: number
  words: Word[]
}

export type Direction = 'en-ru' | 'ru-en'

export interface Settings {
  direction: Direction
}

export interface AppData {
  v: 1
  decks: Deck[]
  settings: Settings
  updatedAt: number
}
