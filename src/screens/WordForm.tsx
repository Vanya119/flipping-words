import { useState } from 'react'
import { IconSpeaker } from '../components/icons'
import { MainButton } from '../components/MainButton'
import { toast } from '../components/Toast'
import { Cell, Field, Page, Section } from '../components/ui'
import { useRouter } from '../router'
import { speak, speechSupported } from '../speech'
import { actions, useData } from '../store'
import { confirmDialog, haptic } from '../telegram'
import { norm } from '../utils'

export function WordForm({ deckId, wordId }: { deckId: string; wordId?: string }) {
  const { decks } = useData()
  const { back } = useRouter()
  const deck = decks.find((d) => d.id === deckId)
  const word = wordId ? deck?.words.find((w) => w.id === wordId) : undefined

  const [en, setEn] = useState(word?.en ?? '')
  const [ru, setRu] = useState(word?.ru ?? '')
  const [example, setExample] = useState(word?.example ?? '')
  const [note, setNote] = useState(word?.note ?? '')
  // Счётчик для пересоздания полей (и автофокуса) после быстрого добавления
  const [formKey, setFormKey] = useState(0)

  if (!deck) return null

  const valid = en.trim() && ru.trim()
  const duplicate = en.trim() && deck.words.some((w) => w.id !== wordId && norm(w.en) === norm(en))

  const save = () => {
    if (!valid) return
    const fields = {
      en: en.trim(),
      ru: ru.trim(),
      example: example.trim() || undefined,
      note: note.trim() || undefined,
    }
    haptic.success()
    if (word) {
      actions.editWord(deckId, word.id, fields)
      back()
      return
    }
    // Новое слово: остаёмся на экране, чтобы быстро вводить следующие
    actions.addWord(deckId, fields)
    toast(`«${fields.en}» добавлено`)
    setEn('')
    setRu('')
    setExample('')
    setNote('')
    setFormKey((k) => k + 1)
  }

  const remove = async () => {
    if (!word) return
    if (!(await confirmDialog(`Удалить «${word.en}»?`))) return
    actions.deleteWord(deckId, word.id)
    back()
  }

  return (
    <Page>
      <h1 className="mb-4 px-1 text-[26px] font-bold">{word ? 'Слово' : 'Новое слово'}</h1>

      <Section
        key={formKey}
        footer={duplicate ? <span className="text-destructive">Такое слово уже есть в колоде</span> : undefined}
      >
        <div className="relative border-b border-separator">
          <Field label="English" value={en} onChange={setEn} placeholder="apple" autoFocus={!word} lang="en" />
          {speechSupported && en.trim() && (
            <button className="pressable absolute top-1/2 right-3 -translate-y-1/2 p-1 text-link" onClick={() => speak(en)} aria-label="Произнести">
              <IconSpeaker />
            </button>
          )}
        </div>
        <Field label="Перевод" value={ru} onChange={setRu} placeholder="яблоко" lang="ru" />
      </Section>

      <Section title="Необязательно" key={`opt${formKey}`}>
        <Field label="Пример" value={example} onChange={setExample} placeholder="An apple a day keeps the doctor away." multiline lang="en" />
        <Field label="Заметка" value={note} onChange={setNote} placeholder="Ассоциация, контекст…" multiline />
      </Section>

      {word && (
        <Section>
          <Cell title="Удалить слово" tone="destructive" onClick={remove} />
        </Section>
      )}

      <MainButton text={word ? 'Сохранить' : 'Добавить'} onClick={save} disabled={!valid} />
    </Page>
  )
}
