import { useState } from 'react'
import { MainButton } from '../components/MainButton'
import { Cell, Field, Page, Section } from '../components/ui'
import { useRouter } from '../router'
import { actions, useData } from '../store'
import { confirmDialog, haptic } from '../telegram'

export function DeckForm({ deckId }: { deckId?: string }) {
  const { decks } = useData()
  const { back, replace, home } = useRouter()
  const deck = deckId ? decks.find((d) => d.id === deckId) : undefined
  const [name, setName] = useState(deck?.name ?? '')
  const valid = name.trim().length > 0

  const save = () => {
    if (!valid) return
    haptic.success()
    if (deck) {
      actions.renameDeck(deck.id, name.trim())
      back()
    } else {
      const id = actions.createDeck(name.trim())
      replace({ name: 'deck', deckId: id })
    }
  }

  const remove = async () => {
    if (!deck) return
    if (!(await confirmDialog(`Удалить колоду «${deck.name}» и все слова в ней?`))) return
    actions.deleteDeck(deck.id)
    home()
  }

  return (
    <Page>
      <h1 className="mb-4 px-1 text-[26px] font-bold">{deck ? 'Колода' : 'Новая колода'}</h1>
      <Section footer="Например: «Работа», «Сериалы», «Путешествия».">
        <Field value={name} onChange={setName} placeholder="Название колоды" autoFocus={!deck} />
      </Section>
      {deck && (
        <Section>
          <Cell title="Удалить колоду" tone="destructive" onClick={remove} />
        </Section>
      )}
      <MainButton text={deck ? 'Сохранить' : 'Создать'} onClick={save} disabled={!valid} />
    </Page>
  )
}
