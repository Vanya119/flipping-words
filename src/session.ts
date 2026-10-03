import type { AppData, Word } from './types'

export const SESSION_LIMIT = 20

/** Слова колоды или всех колод, если deckId не задан. */
export function poolWords(data: AppData, deckId?: string): Word[] {
  return deckId ? (data.decks.find((d) => d.id === deckId)?.words ?? []) : data.decks.flatMap((d) => d.words)
}
