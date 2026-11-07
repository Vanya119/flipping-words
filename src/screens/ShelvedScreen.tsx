import { IconBookmark } from '../components/icons'
import { PracticeTiles } from '../components/PracticeTiles'
import { toast } from '../components/Toast'
import { Cell, Empty, LevelDots, Page, Section } from '../components/ui'
import { actions, useData } from '../store'
import { confirmDialog, haptic } from '../telegram'
import { plural } from '../utils'

/** Стопка отложенных слов одной колоды или всех колод сразу (без deckId). */
export function ShelvedScreen({ deckId }: { deckId?: string }) {
  const { decks } = useData()
  const deck = deckId ? decks.find((d) => d.id === deckId) : undefined
  if (deckId && !deck) return null

  const items = (deck ? [deck] : decks).flatMap((d) => d.words.filter((w) => w.shelved).map((w) => ({ word: w, deck: d })))
  const words = items.map((i) => i.word)
  const n = words.length

  const unshelve = (id: string, en: string) => {
    actions.setShelved([id], false)
    haptic.select()
    toast(`«${en}» убрано из отложенных`)
  }

  const unshelveAll = async () => {
    if (!(await confirmDialog(`Убрать из отложенных все слова (${n})? Сами слова останутся в колодах.`))) return
    actions.setShelved(
      words.map((w) => w.id),
      false,
    )
    haptic.success()
  }

  return (
    <Page>
      <div className="mb-4 px-1">
        <h1 className="text-[26px] leading-tight font-bold">Отложенные</h1>
        <div className="text-[15px] text-hint">
          {deck ? deck.name : 'Из всех колод'} · {n} {plural(n, 'слово', 'слова', 'слов')}
        </div>
      </div>

      {n === 0 ? (
        <Empty
          icon={<IconBookmark size={56} />}
          title="Пока пусто"
          text="В карточках нажми «Отложить» на незнакомом слове — оно появится здесь, и его можно будет тренировать отдельно."
        />
      ) : (
        <>
          <PracticeTiles deckId={deckId} words={words} shelved />
          <Section title="Слова" footer="Нажми «Убрать», когда слово выучено. Из колоды оно не удаляется.">
            {items.map(({ word: w, deck: d }) => (
              <Cell
                key={w.id}
                title={w.forms ? `${w.en} – ${w.forms.join(' – ')}` : w.en}
                subtitle={deck ? w.ru : `${w.ru} · ${d.name}`}
                before={<LevelDots box={w.box} />}
                after={
                  <button className="pressable px-1 text-[15px] text-link" onClick={() => unshelve(w.id, w.en)}>
                    Убрать
                  </button>
                }
              />
            ))}
          </Section>
          <Section>
            <Cell title="Убрать все из отложенных" tone="destructive" onClick={unshelveAll} />
          </Section>
        </>
      )}
    </Page>
  )
}
