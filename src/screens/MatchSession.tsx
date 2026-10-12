import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { IconPairs } from '../components/icons'
import { MainButton } from '../components/MainButton'
import { SessionResult } from '../components/SessionResult'
import { Empty, Page } from '../components/ui'
import { useRouter } from '../router'
import { pickForPractice, poolWords } from '../session'
import { actions, getData } from '../store'
import { haptic } from '../telegram'
import type { Word } from '../types'
import { norm, shuffle } from '../utils'

const ROUND_SIZE = 5
const ROUNDS = 3
const MIN_WORDS = 3

/** Раунды по 5 пар; внутри раунда английские и русские слова не должны повторяться. */
function buildRounds(deckId?: string): Word[][] {
  const seenEn = new Set<string>()
  const seenRu = new Set<string>()
  const unique = pickForPractice(poolWords(getData(), deckId), ROUND_SIZE * ROUNDS * 2).filter((w) => {
    if (seenEn.has(norm(w.en)) || seenRu.has(norm(w.ru))) return false
    seenEn.add(norm(w.en))
    seenRu.add(norm(w.ru))
    return true
  })
  const words = unique.slice(0, ROUND_SIZE * ROUNDS)
  if (words.length < MIN_WORDS) return []
  const rounds: Word[][] = []
  for (let i = 0; i < words.length; i += ROUND_SIZE) rounds.push(words.slice(i, i + ROUND_SIZE))
  // Слишком короткий хвост приклеиваем к предыдущему раунду
  if (rounds.length > 1 && rounds[rounds.length - 1].length < MIN_WORDS) rounds[rounds.length - 2].push(...rounds.pop()!)
  return rounds
}

const formatTime = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function MatchSession({ deckId }: { deckId?: string }) {
  const { back, replace } = useRouter()
  const [rounds] = useState(() => buildRounds(deckId))
  const [round, setRound] = useState(0)
  const [right, setRight] = useState<Word[]>(() => shuffle(rounds[0] ?? []))
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [selLeft, setSelLeft] = useState<string | null>(null)
  const [selRight, setSelRight] = useState<string | null>(null)
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (finishedAt) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [finishedAt])
  useEffect(() => () => clearTimeout(timer.current), [])

  if (rounds.length === 0) {
    return (
      <Page>
        <Empty icon={<IconPairs size={56} />} title="Мало слов" text={`Для игры нужно хотя бы ${MIN_WORDS} слова с разными переводами.`} />
        <MainButton text="Назад" onClick={back} />
      </Page>
    )
  }

  if (finishedAt) {
    const total = rounds.flat().length
    return (
      <SessionResult
        correct={total}
        wrong={mistakes}
        items={[
          { value: formatTime(finishedAt - startedAt), label: 'время' },
          { value: mistakes, label: 'ошибок', tone: mistakes ? 'danger' : 'success' },
        ]}
        onRepeat={() => replace({ name: 'match', deckId })}
        onDone={back}
      />
    )
  }

  const left = rounds[round]

  const tryMatch = (l: string, r: string) => {
    if (l === r) {
      haptic.success()
      actions.review(l, true, false)
      const nextMatched = new Set(matched).add(l)
      setMatched(nextMatched)
      setSelLeft(null)
      setSelRight(null)
      if (nextMatched.size === left.length) {
        timer.current = setTimeout(() => {
          if (round + 1 >= rounds.length) {
            setFinishedAt(Date.now())
            return
          }
          setRound(round + 1)
          setRight(shuffle(rounds[round + 1]))
          setMatched(new Set())
        }, 350)
      }
    } else {
      haptic.error()
      actions.review(l, false, false)
      setMistakes((m) => m + 1)
      setWrongPair([l, r])
      timer.current = setTimeout(() => {
        setWrongPair(null)
        setSelLeft(null)
        setSelRight(null)
      }, 450)
    }
  }

  const pick = (side: 'l' | 'r', id: string) => {
    if (matched.has(id) || wrongPair) return
    haptic.select()
    if (side === 'l') {
      setSelLeft(id)
      if (selRight) tryMatch(id, selRight)
    } else {
      setSelRight(id)
      if (selLeft) tryMatch(selLeft, id)
    }
  }

  const cardClass = (side: 'l' | 'r', id: string) => {
    const selected = side === 'l' ? selLeft === id : selRight === id
    const wrong = wrongPair && (side === 'l' ? wrongPair[0] === id : wrongPair[1] === id)
    if (matched.has(id)) return 'bg-success/15 text-success opacity-0 scale-95 pointer-events-none'
    if (wrong) return 'bg-danger text-white'
    if (selected) return 'bg-button text-button-text'
    return 'bg-section'
  }

  return (
    <Page className="flex min-h-screen flex-col">
      <div className="mb-5 flex items-center justify-between px-1 text-[15px]">
        <span className="text-hint">
          Раунд {round + 1} из {rounds.length}
        </span>
        <span className="font-semibold tabular-nums">{formatTime(now - startedAt)}</span>
        <span className="text-hint">Ошибок: {mistakes}</span>
      </div>
      <div className="mb-4 text-center text-[15px] text-hint">Соедини слово с переводом</div>

      <motion.div key={round} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-2.5">
        <div className="grid gap-2.5">
          {left.map((w) => (
            <button
              key={w.id}
              onClick={() => pick('l', w.id)}
              className={`min-h-16 rounded-xl px-3 py-2 text-[16px] font-medium break-words transition-all duration-300 ${cardClass('l', w.id)}`}
            >
              {w.en}
            </button>
          ))}
        </div>
        <div className="grid gap-2.5">
          {right.map((w) => (
            <button
              key={w.id}
              onClick={() => pick('r', w.id)}
              className={`min-h-16 rounded-xl px-3 py-2 text-[15px] break-words transition-all duration-300 ${cardClass('r', w.id)}`}
            >
              {w.ru}
            </button>
          ))}
        </div>
      </motion.div>
    </Page>
  )
}
