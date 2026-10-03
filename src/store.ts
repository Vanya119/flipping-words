import { useSyncExternalStore } from 'react'
import { cloudLoad, cloudSave } from './cloud'
import { grade } from './srs'
import { cloudStorageAvailable, userId } from './telegram'
import type { AppData, Deck, Settings, Word } from './types'

const LOCAL_KEY = `fw_data_${userId() ?? 'guest'}`

const empty = (): AppData => ({ v: 1, decks: [], settings: { direction: 'en-ru' }, updatedAt: 0 })

function normalize(d: Partial<AppData>): AppData {
  const base = empty()
  return { ...base, ...d, settings: { ...base.settings, ...d.settings }, decks: d.decks ?? [] }
}

function loadLocal(): AppData | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? normalize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function saveLocal(d: AppData) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(d))
  } catch {
    /* приватный режим и т.п. — облако всё равно сохранит */
  }
}

let state: AppData = loadLocal() ?? empty()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

// До загрузки облака ничего туда не пишем, иначе пустой стейт затрёт данные с другого устройства
let cloudReady = false
let cloudTimer: ReturnType<typeof setTimeout> | undefined

function scheduleCloud() {
  if (!cloudReady) return
  clearTimeout(cloudTimer)
  cloudTimer = setTimeout(() => cloudSave(state), 800)
}

function update(fn: (d: AppData) => AppData) {
  state = { ...fn(state), updatedAt: Date.now() }
  saveLocal(state)
  scheduleCloud()
  emit()
}

/** true, если локально пусто и надо дождаться облака (первый запуск на устройстве). */
export const needsInitialSync = () => cloudStorageAvailable() && state.updatedAt === 0

export async function initStore() {
  if (!cloudStorageAvailable()) return
  try {
    const remote = await cloudLoad()
    if (remote && remote.updatedAt > state.updatedAt) {
      state = normalize(remote)
      saveLocal(state)
      emit()
    }
    cloudReady = true
    if (!remote || remote.updatedAt < state.updatedAt) scheduleCloud()
  } catch (e) {
    console.warn('CloudStorage load failed', e)
  }
}

// Дописываем изменения в облако, когда пользователь сворачивает приложение
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && cloudReady && cloudTimer) {
    clearTimeout(cloudTimer)
    cloudTimer = undefined
    cloudSave(state)
  }
})

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useData() {
  return useSyncExternalStore(subscribe, () => state)
}

export const getData = () => state

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

const mapDeck = (deckId: string, fn: (d: Deck) => Deck) =>
  update((s) => ({ ...s, decks: s.decks.map((d) => (d.id === deckId ? fn(d) : d)) }))

export const actions = {
  createDeck(name: string, words: Word[] = []): string {
    const id = uid()
    update((s) => ({ ...s, decks: [...s.decks, { id, name, createdAt: Date.now(), words }] }))
    return id
  },
  renameDeck(deckId: string, name: string) {
    mapDeck(deckId, (d) => ({ ...d, name }))
  },
  deleteDeck(deckId: string) {
    update((s) => ({ ...s, decks: s.decks.filter((d) => d.id !== deckId) }))
  },
  addWord(deckId: string, fields: Pick<Word, 'en' | 'ru' | 'example' | 'note'>) {
    const now = Date.now()
    const word: Word = { ...fields, id: uid(), createdAt: now, box: 0, due: now }
    mapDeck(deckId, (d) => ({ ...d, words: [word, ...d.words] }))
  },
  editWord(deckId: string, wordId: string, fields: Pick<Word, 'en' | 'ru' | 'example' | 'note'>) {
    mapDeck(deckId, (d) => ({ ...d, words: d.words.map((w) => (w.id === wordId ? { ...w, ...fields } : w)) }))
  },
  deleteWord(deckId: string, wordId: string) {
    mapDeck(deckId, (d) => ({ ...d, words: d.words.filter((w) => w.id !== wordId) }))
  },
  /** Записывает ответ по слову (ищет слово во всех колодах). */
  gradeWord(wordId: string, ok: boolean) {
    update((s) => ({
      ...s,
      decks: s.decks.map((d) =>
        d.words.some((w) => w.id === wordId)
          ? { ...d, words: d.words.map((w) => (w.id === wordId ? grade(w, ok) : w)) }
          : d,
      ),
    }))
  },
  setSettings(patch: Partial<Settings>) {
    update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  },
}
