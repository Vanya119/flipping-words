import type { Word } from './types'

// Упрощённая система Лейтнера: каждая успешная проверка переводит слово
// на следующую ступень с более длинным интервалом, ошибка — обратно в начало.
const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60, 120, 240]
export const MAX_BOX = INTERVAL_DAYS.length - 1
/** С этой ступени (интервал ≥ 30 дней) считаем слово выученным. */
export const LEARNED_BOX = 5

const DAY = 24 * 60 * 60 * 1000

function startOfDay(ts: number) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function isDue(w: Word, now = Date.now()) {
  return w.due <= now
}

export function grade(w: Word, ok: boolean, now = Date.now()): Word {
  if (!ok) return { ...w, box: 0, due: now }
  const box = Math.min(w.box + 1, MAX_BOX)
  // Отсчитываем от начала дня, чтобы слово «на завтра» было доступно с утра
  return { ...w, box, due: startOfDay(now) + INTERVAL_DAYS[box] * DAY }
}

export function dueCount(words: Word[], now = Date.now()) {
  return words.reduce((n, w) => n + (isDue(w, now) ? 1 : 0), 0)
}
