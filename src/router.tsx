import { createContext, useContext } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'deck'; deckId: string }
  | { name: 'deckForm'; deckId?: string }
  | { name: 'word'; deckId: string; wordId?: string }
  | { name: 'cards'; deckId?: string; mode: 'due' | 'all' }
  | { name: 'quiz'; deckId?: string }
  | { name: 'share'; deckId: string }
  | { name: 'import'; code?: string }

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
