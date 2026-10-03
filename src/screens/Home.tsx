import { IconBook, IconDownload, IconPlus } from '../components/icons'
import { MainButton } from '../components/MainButton'
import { Cell, Empty, Page, Section } from '../components/ui'
import { useRouter } from '../router'
import { dueCount, LEARNED_BOX } from '../srs'
import { useData } from '../store'
import { plural } from '../utils'

export function Home() {
  const { decks } = useData()
  const { push } = useRouter()
  const now = Date.now()
  const allWords = decks.flatMap((d) => d.words)
  const due = dueCount(allWords, now)
  const learned = allWords.filter((w) => w.box >= LEARNED_BOX).length

  if (decks.length === 0) {
    return (
      <Page>
        <Empty
          icon={<IconBook />}
          title="Flipping Words"
          text="Создай колоду, добавь слова, которые хочешь выучить, и тренируй их карточками и тестами."
        />
        <Section>
          <Cell before={<span className="text-link"><IconDownload /></span>} title="Импортировать колоду друга" tone="link" onClick={() => push({ name: 'import' })} />
        </Section>
        <MainButton text="Создать колоду" onClick={() => push({ name: 'deckForm' })} />
      </Page>
    )
  }

  return (
    <Page>
      <div className="mb-6 rounded-2xl bg-section p-5">
        <div className="text-[15px] text-hint">К повторению сегодня</div>
        <div className="mt-1 text-[40px] leading-none font-bold tracking-tight">{due}</div>
        <div className="mt-4 flex gap-6 text-[14px]">
          <div>
            <div className="font-semibold">{allWords.length}</div>
            <div className="text-hint">{plural(allWords.length, 'слово', 'слова', 'слов')}</div>
          </div>
          <div>
            <div className="font-semibold">{learned}</div>
            <div className="text-hint">выучено</div>
          </div>
          <div>
            <div className="font-semibold">{decks.length}</div>
            <div className="text-hint">{plural(decks.length, 'колода', 'колоды', 'колод')}</div>
          </div>
        </div>
      </div>

      <Section title="Колоды">
        {decks.map((d) => {
          const n = dueCount(d.words, now)
          return (
            <Cell
              key={d.id}
              title={d.name}
              subtitle={`${d.words.length} ${plural(d.words.length, 'слово', 'слова', 'слов')}`}
              after={n > 0 ? <span className="rounded-full bg-button px-2 py-0.5 text-[13px] font-semibold text-button-text">{n}</span> : undefined}
              chevron
              onClick={() => push({ name: 'deck', deckId: d.id })}
            />
          )
        })}
      </Section>

      <Section>
        <Cell before={<span className="text-link"><IconPlus /></span>} title="Новая колода" tone="link" onClick={() => push({ name: 'deckForm' })} />
        <Cell before={<span className="text-link"><IconDownload /></span>} title="Импортировать колоду" tone="link" onClick={() => push({ name: 'import' })} />
      </Section>

      {due > 0 && <MainButton text={`Повторить ${due} ${plural(due, 'слово', 'слова', 'слов')}`} onClick={() => push({ name: 'cards', mode: 'due' })} />}
    </Page>
  )
}
