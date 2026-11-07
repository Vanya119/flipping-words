import { createContext, useContext } from 'react'
import type { LibraryKind } from './library'

export type Route =
  | { name: 'home' }
  | { name: 'deck'; deckId: string }
  | { name: 'deckForm'; deckId?: string }
  | { name: 'word'; deckId: string; wordId?: string }
  | { name: 'cards'; deckId?: string; mode: 'due' | 'all'; shelved?: boolean }
  | { name: 'quiz'; deckId?: string; shelved?: boolean }
  | { name: 'share'; deckId: string }
  | { name: 'import'; code?: string }
  | { name: 'library'; kind: LibraryKind }
  | { name: 'librarySet'; setId: string }
  | { name: 'levelTest' }
  | { name: 'stats' }
  | { name: 'typing'; deckId?: string; shelved?: boolean }
  | { name: 'match'; deckId?: string; shelved?: boolean }
  | { name: 'forms'; deckId?: string; shelved?: boolean }
  /** Стопка отложенных слов колоды (или всех колод без deckId). */
  | { name: 'shelved'; deckId?: string }

export interface Router {
  route: Route
  depth: number
  push(r: Route): void
  replace(r: Route): void
  back(): void
  /** Сбросить стек до главного экрана. */
  home(): void
}

export const RouterContext = createContext<Router | null>(null)

export function useRouter() {
  const r = useContext(RouterContext)
  if (!r) throw new Error('useRouter outside RouterContext')
  return r
}
