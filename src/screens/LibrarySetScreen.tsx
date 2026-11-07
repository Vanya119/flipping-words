import { MainButton } from '../components/MainButton'
import { Cell, Page, Section } from '../components/ui'
import { getSet, setToWords } from '../library'
import { useRouter } from '../router'
import { speak, speechSupported } from '../speech'
import { actions, useData } from '../store'
import { haptic } from '../telegram'
import { norm, plural } from '../utils'
import { LevelBadge } from './LibraryScreen'

export function LibrarySetScreen({ setId }: { setId: string }) {
  const { decks } = useData()
  const { push, replace } = useRouter()
  const set = getSet(setId)
  if (!set) return null
  const existing = decks.find((d) => d.source === set.id)
  const n = set.words.length
  // Слова, появившиеся в наборе после того, как колоду добавили
  const missing = existing
    ? set.words.filter((w) => !existing.words.some((x) => norm(x.en) === norm(w.en)))
    : []

  const addMissing = () => {
    if (!existing) return
    actions.appendWords(existing.id, setToWords({ ...set, words: missing }))
    haptic.success()
    replace({ name: 'deck', deckId: existing.id })
  }

  const add = () => {
    const id = actions.createDeck(set.title, setToWords(set), set.id)
    haptic.success()
    replace({ name: 'deck', deckId: id })
  }

  return (
    <Page>
      <div className="mb-5 flex items-center gap-3.5 px-1">
        <LevelBadge badge={set.badge} size={56} />
        <div className="min-w-0">
          <h1 className="text-[24px] leading-tight font-bold">{set.title}</h1>
          <div className="text-[15px] text-hint">
            {n} {plural(n, 'слово', 'слова', 'слов')} · {set.subtitle}
          </div>
        </div>
      </div>

      <Section
        title="Слова в наборе"
        footer={
          existing
            ? missing.length
              ? `Набор уже в твоих колодах, но в нём появились новые слова: ${missing.length}.`
              : 'Набор уже в твоих колодах.'
            : 'Набор добавится как обычная колода: можно тренировать, редактировать и удалять слова.'
        }
      >
        {set.words.map((w) => (
          <Cell
            key={w.en}
            title={w.forms ? `${w.en} – ${w.forms.join(' – ')}` : w.en}
            subtitle={w.ru}
            onClick={speechSupported ? () => speak(w.en) : undefined}
          />
        ))}
      </Section>

      {existing ? (
        missing.length ? (
          <MainButton text={`Добавить новые слова: ${missing.length}`} onClick={addMissing} />
        ) : (
          <MainButton text="Открыть колоду" onClick={() => push({ name: 'deck', deckId: existing.id })} />
        )
      ) : (
        <MainButton text="Добавить в мои колоды" onClick={add} />
      )}
    </Page>
  )
}
