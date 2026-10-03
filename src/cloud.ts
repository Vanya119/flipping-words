// Синхронизация через Telegram CloudStorage.
// Лимиты: 1024 ключа на пользователя, до 4096 символов на значение.
// Поэтому всё состояние сжимается и режется на куски по CHUNK символов.
import { pack, unpack } from './codec'
import { cloudGet, cloudRemove, cloudSet } from './telegram'
import type { AppData } from './types'

const CHUNK = 4000
const META_KEY = 'fw_meta'
const chunkKey = (i: number) => `fw_c${i}`

interface Meta {
  n: number
  u: number
}

/** Что сейчас лежит в облаке — чтобы перезаписывать только изменившиеся куски. */
let written: string[] = []

async function getMany(keys: string[]) {
  const out: Record<string, string> = {}
  for (let i = 0; i < keys.length; i += 20) Object.assign(out, await cloudGet(keys.slice(i, i + 20)))
  return out
}

export async function cloudLoad(): Promise<AppData | null> {
  const raw = (await cloudGet([META_KEY]))[META_KEY]
  if (!raw) return null
  const meta: Meta = JSON.parse(raw)
  const keys = Array.from({ length: meta.n }, (_, i) => chunkKey(i))
  const values = await getMany(keys)
  const chunks = keys.map((k) => values[k] ?? '')
  const data = JSON.parse(unpack(chunks.join(''))) as AppData
  written = chunks
  return data
}

let saving: Promise<void> | null = null
let pending: AppData | null = null

async function doSave(data: AppData) {
  const encoded = pack(JSON.stringify(data))
  const chunks: string[] = []
  for (let i = 0; i < encoded.length; i += CHUNK) chunks.push(encoded.slice(i, i + CHUNK))

  for (let i = 0; i < chunks.length; i++) {
    if (written[i] !== chunks[i]) await cloudSet(chunkKey(i), chunks[i])
  }
  const meta: Meta = { n: chunks.length, u: data.updatedAt }
  await cloudSet(META_KEY, JSON.stringify(meta))
  if (written.length > chunks.length) {
    await cloudRemove(Array.from({ length: written.length - chunks.length }, (_, i) => chunkKey(chunks.length + i)))
  }
  written = chunks
}

/** Сохраняет последнюю версию; параллельные вызовы схлопываются в один. */
export function cloudSave(data: AppData) {
  pending = data
  if (saving) return
  saving = (async () => {
    while (pending) {
      const next = pending
      pending = null
      try {
        await doSave(next)
      } catch (e) {
        console.warn('CloudStorage save failed', e)
      }
    }
    saving = null
  })()
}
