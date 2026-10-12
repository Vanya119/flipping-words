import type { AppData, Word } from './types'
import { shuffle } from './utils'

export const SESSION_LIMIT = 20

/** Слова колоды или всех колод, если deckId не задан. */
export function poolWords(data: AppData, deckId?: string): Word[] {
  return deckId ? (data.decks.find((d) => d.id === deckId)?.words ?? []) : data.decks.flatMap((d) => d.words)
}

/** Слова для тренировки: сначала те, что пора повторить, потом остальные. */
export function pickForPractice(words: Word[], limit = SESSION_LIMIT): Word[] {
  const now = Date.now()
  return [...shuffle(words.filter((w) => w.due <= now)), ...shuffle(words.filter((w) => w.due > now))].slice(0, limit)
}
