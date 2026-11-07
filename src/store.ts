import { useSyncExternalStore } from 'react'
import { cloudLoad, cloudSave } from './cloud'
import { dayKey, grade, LEARNED_BOX } from './srs'
import { cloudStorageAvailable, userId } from './telegram'
import type { AppData, Deck, Settings, Word } from './types'
import { norm } from './utils'

const LOCAL_KEY = `fw_data_${userId() ?? 'guest'}`

const empty = (): AppData => ({ v: 1, decks: [], settings: { direction: 'en-ru' }, days: {}, levelTests: [], updatedAt: 0 })

function normalize(d: Partial<AppData>): AppData {
  const base = empty()
  return {
    ...base,
    ...d,
    settings: { ...base.settings, ...d.settings },
    decks: d.decks ?? [],
    days: d.days ?? {},
    levelTests: d.levelTests ?? [],
  }
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

/** source старой общей колоды «На изучение» (до появления стопок отложенных в колодах). */
const LEGACY_STUDY_SOURCE = 'study'

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

const mapDeck = (deckId: string, fn: (d: Deck) => Deck) =>
  update((s) => ({ ...s, decks: s.decks.map((d) => (d.id === deckId ? fn(d) : d)) }))

export const actions = {
  createDeck(name: string, words: Word[] = [], source?: string): string {
    const id = uid()
    update((s) => ({ ...s, decks: [...s.decks, { id, name, createdAt: Date.now(), words, source }] }))
    return id
  },
  /** Дописывает слова в конец колоды (например, новые слова обновлённого набора). */
  appendWords(deckId: string, words: Word[]) {
    mapDeck(deckId, (d) => ({ ...d, words: [...d.words, ...words] }))
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
  /**
   * Записывает ответ: обновляет статистику дня и, если grade, — интервал повторения слова.
   * Слово ищется во всех колодах.
   */
  review(wordId: string, ok: boolean, gradeWord: boolean) {
    update((s) => {
      const decks = gradeWord
        ? s.decks.map((d) =>
            d.words.some((w) => w.id === wordId)
              ? { ...d, words: d.words.map((w) => (w.id === wordId ? grade(w, ok) : w)) }
              : d,
          )
        : s.decks
      const key = dayKey()
      const day = s.days[key] ?? { r: 0, c: 0, l: 0 }
      const learned = decks.reduce((n, d) => n + d.words.filter((w) => w.box >= LEARNED_BOX).length, 0)
      return { ...s, decks, days: { ...s.days, [key]: { r: day.r + 1, c: day.c + (ok ? 1 : 0), l: learned } } }
    })
  },
  addLevelTest(level: string | null) {
    update((s) => ({ ...s, levelTests: [...s.levelTests, { at: Date.now(), level }] }))
  },
  /**
   * Откладывает слова в стопку их колоды. Прогресс сбрасывается — слово учится заново.
   * С on = false убирает пометку.
   */
  setShelved(wordIds: string[], on: boolean) {
    const ids = new Set(wordIds)
    const now = Date.now()
    update((s) => ({
      ...s,
      decks: s.decks.map((d) =>
        d.words.some((w) => ids.has(w.id))
          ? {
              ...d,
              words: d.words.map((w) => (ids.has(w.id) ? (on ? { ...w, shelved: true, box: 0, due: now } : { ...w, shelved: false }) : w)),
            }
          : d,
      ),
    }))
  },
  /**
   * Разбирает старую колоду «На изучение»: слова возвращаются в колоды, откуда пришли
   * (resolve возвращает id колоды или null), с пометкой «отложено». Нераспознанные слова
   * остаются в бывшей колоде «На изучение», которая становится обычной.
   */
  migrateLegacyStudy(resolve: (w: Word) => string | null) {
    const legacy = state.decks.find((d) => d.source === LEGACY_STUDY_SOURCE)
    if (!legacy) return
    update((s) => {
      const back = new Map<string, Word[]>()
      const rest: Word[] = []
      for (const w of legacy.words) {
        const target = resolve(w)
        const word = { ...w, shelved: true }
        if (target) back.set(target, [...(back.get(target) ?? []), word])
        else rest.push(word)
      }
      const decks = s.decks
        .map((d) => {
          if (d.id === legacy.id) return rest.length ? { ...d, source: undefined, words: rest } : null
          const add = back.get(d.id)?.filter((w) => !d.words.some((x) => norm(x.en) === norm(w.en)))
          return add?.length ? { ...d, words: [...d.words, ...add] } : d
        })
        .filter((d): d is Deck => d !== null)
      return { ...s, decks }
    })
  },
  setSettings(patch: Partial<Settings>) {
    update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  },
}
