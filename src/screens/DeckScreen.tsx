import { useState } from 'react'
import { IconBookmark, IconSearch, IconShare } from '../components/icons'
import { PracticeTiles } from '../components/PracticeTiles'
import { MainButton } from '../components/MainButton'
import { Cell, Empty, LevelDots, Page, Section, Segmented, Tile } from '../components/ui'
import { IconBook } from '../components/icons'
import { useRouter } from '../router'
import { dueCount } from '../srs'
import { actions, useData } from '../store'
import { haptic } from '../telegram'
import type { Direction } from '../types'
import { norm, plural } from '../utils'

export function DeckScreen({ deckId }: { deckId: string }) {
  const { decks, settings } = useData()
  const { push } = useRouter()
  const [query, setQuery] = useState('')
  const deck = decks.find((d) => d.id === deckId)
  if (!deck) return null

  const due = dueCount(deck.words)
  const q = norm(query)
  const words = q ? deck.words.filter((w) => norm(w.en).includes(q) || norm(w.ru).includes(q)) : deck.words
  const hasWords = deck.words.length > 0
  const shelvedWords = deck.words.filter((w) => w.shelved)
  const shelvedDue = dueCount(shelvedWords)

  return (
    <Page>
      <div className="mb-4 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h1 className="truncate text-[26px] leading-tight font-bold">{deck.name}</h1>
          <div className="text-[15px] text-hint">
            {deck.words.length} {plural(deck.words.length, 'слово', 'слова', 'слов')}
            {due > 0 && ` · ${due} к повторению`}
          </div>
        </div>
        <button className="pressable shrink-0 pt-1.5 text-[16px] text-link" onClick={() => push({ name: 'deckForm', deckId })}>
          Изменить
        </button>
      </div>

      {hasWords ? (
        <>
          <PracticeTiles deckId={deckId} words={deck.words}>
            <Tile icon={<IconShare />} label="Поделиться" onClick={() => push({ name: 'share', deckId })} />
          </PracticeTiles>
          <Section>
            <Cell
              before={<span className="text-link"><IconBookmark filled={shelvedWords.length > 0} /></span>}
              title="Отложенные"
              subtitle={
                shelvedWords.length
                  ? `${shelvedWords.length} ${plural(shelvedWords.length, 'слово', 'слова', 'слов')} · тренируй отдельно`
                  : 'Отложи незнакомое слово в карточках'
              }
              after={
                shelvedDue > 0 ? (
                  <span className="rounded-full bg-button px-2 py-0.5 text-[13px] font-semibold text-button-text">{shelvedDue}</span>
                ) : undefined
              }
              chevron
              onClick={() => push({ name: 'shelved', deckId })}
            />
          </Section>
          <div className="mb-6">
            <Segmented<Direction>
              value={settings.direction}
              onChange={(direction) => {
                haptic.select()
                actions.setSettings({ direction })
              }}
              options={[
                { value: 'en-ru', label: 'EN → RU' },
                { value: 'ru-en', label: 'RU → EN' },
              ]}
            />
          </div>

          {deck.words.length > 8 && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-section px-3 text-hint">
              <IconSearch />
              <input
                className="h-10 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-hint"
                placeholder="Поиск"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}

          <Section title="Слова">
            {words.map((w) => (
              <Cell
                key={w.id}
                title={w.forms ? `${w.en} – ${w.forms.join(' – ')}` : w.en}
                subtitle={w.ru}
                after={
                  <span className="flex items-center gap-2">
                    {w.shelved && <span className="text-link"><IconBookmark size={16} filled /></span>}
                    <LevelDots box={w.box} />
                  </span>
                }
                onClick={() => push({ name: 'word', deckId, wordId: w.id })}
              />
            ))}
            {words.length === 0 && <div className="px-4 py-3 text-hint">Ничего не найдено</div>}
          </Section>
        </>
      ) : (
        <Empty
          icon={<IconBook />}
          title="Пока пусто"
          text="Добавь первые слова — и можно начинать тренировку."
        />
      )}

      <MainButton text="Добавить слово" onClick={() => push({ name: 'word', deckId })} />
    </Page>
  )
}
