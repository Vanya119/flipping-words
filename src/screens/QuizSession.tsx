import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { IconQuiz, IconSpeaker } from '../components/icons'
import { MainButton } from '../components/MainButton'
import { SessionResult } from '../components/SessionResult'
import { Empty, Page } from '../components/ui'
import { useRouter } from '../router'
import { poolWords, SESSION_LIMIT } from '../session'
import { speak, speechSupported } from '../speech'
import { isDue } from '../srs'
import { actions, getData } from '../store'
import { haptic } from '../telegram'
import type { Direction, Word } from '../types'
import { norm, shuffle } from '../utils'

const QUIZ_SIZE = Math.min(10, SESSION_LIMIT)

interface Question {
  word: Word
  prompt: string
  answer: string
  options: string[]
}

function buildQuiz(deckId: string | undefined, direction: Direction): Question[] | null {
  const data = getData()
  const pool = poolWords(data, deckId)
  const everything = poolWords(data)
  const answerOf = (w: Word) => (direction === 'en-ru' ? w.ru : w.en)

  // Варианты-обманки берём из колоды, а если её мало — из всех колод
  const distractorPool = [...shuffle(pool), ...shuffle(everything)]
  const uniqueAnswers = new Set(distractorPool.map((w) => norm(answerOf(w))))
  if (pool.length === 0 || uniqueAnswers.size < 4) return null

  // Сначала слова, которые пора повторить, потом остальные
  const due = shuffle(pool.filter((w) => isDue(w)))
  const rest = shuffle(pool.filter((w) => !isDue(w)))
  const picked = [...due, ...rest].slice(0, QUIZ_SIZE)

  return picked.map((word) => {
    const answer = answerOf(word)
    const seen = new Set([norm(answer)])
    const wrong: string[] = []
    for (const w of distractorPool) {
      const a = answerOf(w)
      if (seen.has(norm(a))) continue
      seen.add(norm(a))
      wrong.push(a)
      if (wrong.length === 3) break
    }
    return {
      word,
      prompt: direction === 'en-ru' ? word.en : word.ru,
      answer,
      options: shuffle([answer, ...wrong]),
    }
  })
}

export function QuizSession({ deckId }: { deckId?: string }) {
  const { back, replace } = useRouter()
  const [direction] = useState(() => getData().settings.direction)
  const [questions] = useState(() => buildQuiz(deckId, direction))
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  if (!questions) {
    return (
      <Page>
        <Empty icon={<IconQuiz size={56} />} title="Мало слов для теста" text="Для теста нужно минимум 4 слова с разными переводами." />
        <MainButton text="Назад" onClick={back} />
      </Page>
    )
  }

  if (idx >= questions.length) {
    return (
      <SessionResult correct={score} wrong={questions.length - score} onRepeat={() => replace({ name: 'quiz', deckId })} onDone={back} />
    )
  }

  const q = questions[idx]
  const isCorrect = chosen !== null && chosen === q.answer

  const next = () => {
    clearTimeout(timer.current)
    setChosen(null)
    setIdx((i) => i + 1)
  }

  const choose = (opt: string) => {
    if (chosen !== null) return
    const ok = opt === q.answer
    setChosen(opt)
    if (ok) {
      haptic.success()
      setScore((s) => s + 1)
      timer.current = setTimeout(next, 750)
    } else {
      haptic.error()
    }
    // Ошибка всегда сбрасывает слово; верный ответ двигает его, только если пора было повторять
    if (!ok || isDue(q.word)) actions.gradeWord(q.word.id, ok)
  }

  return (
    <Page className="flex min-h-screen flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-section">
          <motion.div className="h-full rounded-full bg-button" animate={{ width: `${(idx / questions.length) * 100}%` }} />
        </div>
        <div className="text-[13px] text-hint tabular-nums">
          {idx + 1}/{questions.length}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.18 }}
        >
          <div className="mb-8 flex min-h-40 flex-col items-center justify-center rounded-3xl bg-section px-6 py-8 text-center">
            <div className="mb-2 text-[14px] text-hint">{direction === 'en-ru' ? 'Как переводится?' : 'Как по-английски?'}</div>
            <div className="text-[32px] leading-tight font-bold break-words">{q.prompt}</div>
            {direction === 'en-ru' && speechSupported && (
              <button className="pressable mt-3 text-link" onClick={() => speak(q.word.en)} aria-label="Произнести">
                <IconSpeaker />
              </button>
            )}
          </div>

          <div className="grid gap-2.5">
            {q.options.map((opt) => {
              const state =
                chosen === null ? 'idle' : opt === q.answer ? 'correct' : opt === chosen ? 'wrong' : 'dim'
              return (
                <motion.button
                  key={opt}
                  onClick={() => choose(opt)}
                  animate={state === 'wrong' ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                  transition={{ duration: 0.35 }}
                  className={`min-h-14 rounded-xl px-4 py-3 text-left text-[17px] font-medium transition-colors ${
                    state === 'correct'
                      ? 'bg-success text-white'
                      : state === 'wrong'
                        ? 'bg-danger text-white'
                        : state === 'dim'
                          ? 'bg-section opacity-50'
                          : 'pressable bg-section'
                  }`}
                >
                  {opt}
                </motion.button>
              )
            })}
          </div>
          {chosen !== null && !isCorrect && q.word.example && (
            <div className="mt-5 px-1 text-center text-[15px] text-hint italic">{q.word.example}</div>
          )}
        </motion.div>
      </AnimatePresence>

      {chosen !== null && !isCorrect && <MainButton text="Дальше" onClick={next} />}
    </Page>
  )
}
