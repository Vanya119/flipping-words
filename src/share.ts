// Обмен колодами без сервера: колода сжимается прямо в ссылку или текстовый код.
import { pack, unpack } from './codec'
import { BOT_USERNAME } from './config'
import type { Deck } from './types'

type SharedWord = [en: string, ru: string, example?: string, note?: string]

export interface SharedDeck {
  name: string
  words: { en: string; ru: string; example?: string; note?: string }[]
}

/** Лимит Telegram на параметр startapp. */
const START_PARAM_MAX = 512
const CODE_PREFIX = 'FW1:'

function encode(deck: Deck): string {
  const words: SharedWord[] = deck.words.map((w) => {
    const row: SharedWord = [w.en, w.ru, w.example ?? '', w.note ?? '']
    while (row.length > 2 && !row[row.length - 1]) row.pop()
    return row
  })
  return pack(JSON.stringify({ n: deck.name, w: words }))
}

function decode(encoded: string): SharedDeck | null {
  try {
    const raw = JSON.parse(unpack(encoded)) as { n: string; w: SharedWord[] }
    if (typeof raw.n !== 'string' || !Array.isArray(raw.w)) return null
    const words = raw.w
      .filter((r) => Array.isArray(r) && typeof r[0] === 'string' && typeof r[1] === 'string')
      .map(([en, ru, example, note]) => ({ en, ru, example: example || undefined, note: note || undefined }))
    return { name: raw.n, words }
  } catch {
    return null
  }
}

export function appLink(startParam?: string) {
  return `https://t.me/${BOT_USERNAME}${startParam ? `?startapp=${startParam}` : ''}`
}

export function buildShare(deck: Deck) {
  const encoded = encode(deck)
  const startParam = 'd' + encoded
  return {
    /** Ссылка, открывающая импорт сразу — только если колода влезает в лимит. */
    link: startParam.length <= START_PARAM_MAX ? appLink(startParam) : null,
    code: CODE_PREFIX + encoded,
  }
}

/** Достаёт колоду из start_param, ссылки или текста с кодом. */
export function parseShared(input: string): SharedDeck | null {
  const text = input.trim()
  if (!text) return null
  const code = text.match(/FW1:([A-Za-z0-9_-]+)/)
  if (code) return decode(code[1])
  const param = text.match(/startapp=d([A-Za-z0-9_-]+)/)
  if (param) return decode(param[1])
  if (/^d[A-Za-z0-9_-]+$/.test(text)) return decode(text.slice(1))
  return null
}
