import { useMemo, useState } from 'react'
import { MainButton } from '../components/MainButton'
import { Cell, Field, Page, Section } from '../components/ui'
import { useRouter } from '../router'
import { parseShared } from '../share'
import { actions, uid, useData } from '../store'
import { haptic } from '../telegram'
import type { Word } from '../types'
import { plural } from '../utils'

export function ImportScreen({ code }: { code?: string }) {
  const { decks } = useData()
  const { replace } = useRouter()
  const [input, setInput] = useState(code ?? '')
  const shared = useMemo(() => parseShared(input), [input])
  const fromLink = !!code

  const importDeck = () => {
    if (!shared) return
    const names = new Set(decks.map((d) => d.name))
    let name = shared.name
    for (let i = 2; names.has(name); i++) name = `${shared.name} (${i})`
    const now = Date.now()
    const words: Word[] = shared.words.map((w) => ({ ...w, id: uid() + Math.random().toString(36).slice(2, 5), createdAt: now, box: 0, due: now }))
    const id = actions.createDeck(name, words)
    haptic.success()
    replace({ name: 'deck', deckId: id })
  }

  return (
    <Page>
      <h1 className="mb-4 px-1 text-[26px] font-bold">{fromLink ? 'Колода от друга' : 'Импорт колоды'}</h1>

      {!fromLink && (
        <Section footer="Вставь сообщение с кодом (начинается с FW1:) или ссылку на колоду.">
          <Field value={input} onChange={setInput} placeholder="FW1:…" multiline autoFocus />
        </Section>
      )}

      {shared ? (
        <Section title={`${shared.name} · ${shared.words.length} ${plural(shared.words.length, 'слово', 'слова', 'слов')}`}>
          {shared.words.slice(0, 50).map((w, i) => (
            <Cell key={i} title={w.en} subtitle={w.ru} />
          ))}
          {shared.words.length > 50 && <div className="px-4 py-3 text-hint">и ещё {shared.words.length - 50}…</div>}
        </Section>
      ) : (
        input.trim() && <div className="px-4 text-[14px] text-destructive">Не удалось распознать колоду. Проверь, что код скопирован полностью.</div>
      )}

      <MainButton text={shared ? 'Добавить себе' : 'Добавить'} onClick={importDeck} disabled={!shared} />
    </Page>
  )
}
