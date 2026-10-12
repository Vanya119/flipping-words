import type { ReactNode } from 'react'
import { IconChart, IconDownload, IconLevels, IconPlus, IconTarget, IconTopics, IconVerbs } from '../components/icons'
import { MainButton } from '../components/MainButton'
import { Cell, Page, Section } from '../components/ui'
import { getSet } from '../library'
import { useRouter } from '../router'
import { dueCount, LEARNED_BOX } from '../srs'
import { useData } from '../store'
import { plural } from '../utils'

function BigTile({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="pressable flex flex-col items-start gap-2 rounded-xl bg-section p-3.5 text-left">
      <span className="text-accent">{icon}</span>
      <span>
        <span className="block text-[16px] font-semibold">{title}</span>
        <span className="block text-[13px] leading-snug text-hint">{subtitle}</span>
      </span>
    </button>
  )
}

export function Home() {
  const { decks, levelTests } = useData()
  const { push } = useRouter()
  const now = Date.now()
  const allWords = decks.flatMap((d) => d.words)
  const due = dueCount(allWords, now)
  const learned = allWords.filter((w) => w.box >= LEARNED_BOX).length
  const lastTest = levelTests[levelTests.length - 1]
  const lastLevel = lastTest ? (lastTest.level ? getSet(lastTest.level)?.badge : 'ниже A1') : null

  return (
    <Page>
      {decks.length > 0 ? (
        <div className="mb-6 rounded-2xl bg-section p-5">
          <div className="flex items-start justify-between">
            <div className="text-[15px] text-hint">К повторению сегодня</div>
            <button className="pressable -mt-1 -mr-1 flex items-center gap-1 p-1 text-[15px] text-link" onClick={() => push({ name: 'stats' })}>
              <IconChart size={18} />
              Статистика
            </button>
          </div>
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
      ) : (
        <div className="mb-6 px-1 pt-2">
          <h1 className="text-[28px] font-bold">Flipping Words</h1>
          <div className="mt-1 text-[15px] text-hint">Выбери готовый набор слов или создай свою колоду.</div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-2.5">
        <BigTile icon={<IconLevels />} title="Уровни" subtitle="A1 — C2" onClick={() => push({ name: 'library', kind: 'level' })} />
        <BigTile
          icon={<IconTarget />}
          title="Тест на уровень"
          subtitle={lastLevel ? `Последний: ${lastLevel}` : 'Узнай свой уровень'}
          onClick={() => push({ name: 'levelTest' })}
        />
        <BigTile icon={<IconTopics />} title="Темы" subtitle="Путешествия, еда, IT…" onClick={() => push({ name: 'library', kind: 'topic' })} />
        <BigTile icon={<IconVerbs />} title="Глаголы" subtitle="Неправильные и фразовые" onClick={() => push({ name: 'library', kind: 'verbs' })} />
      </div>

      {decks.length > 0 && (
        <Section title="Мои колоды">
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
      )}

      <Section title={decks.length ? undefined : 'Свои слова'}>
        <Cell before={<span className="text-link"><IconPlus /></span>} title="Новая колода" tone="link" onClick={() => push({ name: 'deckForm' })} />
        <Cell before={<span className="text-link"><IconDownload /></span>} title="Импортировать колоду" tone="link" onClick={() => push({ name: 'import' })} />
      </Section>

      {due > 0 && <MainButton text={`Повторить ${due} ${plural(due, 'слово', 'слова', 'слов')}`} onClick={() => push({ name: 'cards', mode: 'due' })} />}
    </Page>
  )
}
