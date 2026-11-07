import type { ReactNode } from 'react'
import { useRouter } from '../router'
import { dueCount } from '../srs'
import type { Word } from '../types'
import { IconCards, IconForms, IconKeyboard, IconPairs, IconQuiz } from './icons'
import { Tile } from './ui'

/** Сетка режимов тренировки — для колоды и для её стопки отложенных. */
export function PracticeTiles({ deckId, words, shelved, children }: { deckId?: string; words: Word[]; shelved?: boolean; children?: ReactNode }) {
  const { push } = useRouter()
  const due = dueCount(words)
  return (
    <div className="mb-3 grid grid-cols-3 gap-2.5">
      <Tile icon={<IconCards />} label="Карточки" badge={due} onClick={() => push({ name: 'cards', deckId, shelved, mode: due > 0 ? 'due' : 'all' })} />
      <Tile icon={<IconQuiz />} label="Тест" onClick={() => push({ name: 'quiz', deckId, shelved })} />
      <Tile icon={<IconKeyboard />} label="Ввод" onClick={() => push({ name: 'typing', deckId, shelved })} />
      <Tile icon={<IconPairs />} label="Пары" onClick={() => push({ name: 'match', deckId, shelved })} />
      {words.some((w) => w.forms) && <Tile icon={<IconForms />} label="Формы" onClick={() => push({ name: 'forms', deckId, shelved })} />}
      {children}
    </div>
  )
}
