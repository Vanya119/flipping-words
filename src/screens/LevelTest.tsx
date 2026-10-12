import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { IconTarget } from '../components/icons'
import { MainButton } from '../components/MainButton'
import { Cell, Page, Section } from '../components/ui'
import { getSet, LEVEL_IDS, type LibraryEntry } from '../library'
import { useRouter } from '../router'
import { actions, useData } from '../store'
import { haptic } from '../telegram'
import { shuffle } from '../utils'
import { LevelBadge } from './LibraryScreen'

/** Вопросов на уровень и сколько верных нужно, чтобы перейти дальше. */
const PER_LEVEL = 5
const PASS = 4

interface Question {
  word: LibraryEntry
  options: string[]
}

function buildLevel(levelId: string): Question[] {
  const words = getSet(levelId)!.words
  return shuffle(words)
    .slice(0, PER_LEVEL)
    .map((word) => {
      const wrong = shuffle(words.filter((w) => w.ru !== word.ru))
        .slice(0, 3)
        .map((w) => w.ru)
      return { word, options: shuffle([word.ru, ...wrong]) }
    })
}

const LEVEL_TEXT: Record<string, string> = {
  none: 'Начни с основ — набор A1 поможет быстро набрать базовый словарь.',
  a1: 'Ты знаешь самые базовые слова. Дальше — повседневная лексика A2.',
  a2: 'Хватает для бытовых ситуаций. Следующий шаг — B1.',
  b1: 'Уверенный средний уровень: можно общаться на большинство тем.',
  b2: 'Выше среднего: справляешься с абстрактными и рабочими темами.',
  c1: 'Продвинутый уровень: богатый словарь, академическая лексика.',
  c2: 'Почти как носитель: знаешь даже редкие книжные слова.',
}

export function LevelTest() {
  const { levelTests } = useData()
  const { back, replace, push } = useRouter()
  const [phase, setPhase] = useState<'intro' | 'test' | 'result'>('intro')
  const [levelIdx, setLevelIdx] = useState(0)
  const [questions, setQuestions] = useState<Question[]>(() => buildLevel(LEVEL_IDS[0]))
  const [qIdx, setQIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  /** Индекс самого высокого пройденного уровня (-1 — ни одного). */
  const [passed, setPassed] = useState(-1)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const finish = (passedIdx: number) => {
    setPassed(passedIdx)
    actions.addLevelTest(passedIdx >= 0 ? LEVEL_IDS[passedIdx] : null)
    haptic.success()
    setPhase('result')
  }

  const answer = (opt: string | null) => {
    if (chosen !== null) return
    const q = questions[qIdx]
    const ok = opt === q.word.ru
    setChosen(opt ?? '')
    if (ok) haptic.tap()
    else haptic.error()
    const total = correct + (ok ? 1 : 0)
    timer.current = setTimeout(() => {
      setChosen(null)
      if (qIdx + 1 < PER_LEVEL) {
        setCorrect(total)
        setQIdx(qIdx + 1)
        return
      }
      // Уровень закончен
      if (total < PASS) return finish(levelIdx - 1)
      if (levelIdx + 1 >= LEVEL_IDS.length) return finish(levelIdx)
      setLevelIdx(levelIdx + 1)
      setQuestions(buildLevel(LEVEL_IDS[levelIdx + 1]))
      setQIdx(0)
      setCorrect(0)
    }, ok ? 450 : 900)
  }

  if (phase === 'intro') {
    const history = [...levelTests].reverse().slice(0, 10)
    return (
      <Page>
        <div className="flex flex-col items-center px-4 pt-6 pb-8 text-center">
          <div className="mb-4 text-accent">
            <IconTarget size={64} />
          </div>
          <h1 className="mb-2 text-[26px] font-bold">Тест на уровень</h1>
          <div className="text-[15px] text-hint">
            По {PER_LEVEL} слов на каждый уровень, начиная с A1. Ответишь верно на {PASS} из {PER_LEVEL} — переходишь на следующий.
            Если не знаешь слово, жми «Не знаю», чтобы не угадывать. Проходить можно сколько угодно раз — слова каждый раз новые.
          </div>
        </div>
        {history.length > 0 && (
          <Section title="Прошлые результаты">
            {history.map((t) => (
              <Cell
                key={t.at}
                before={<div className="py-1.5"><LevelBadge badge={t.level ? getSet(t.level)!.badge : '—'} size={34} /></div>}
                title={t.level ? getSet(t.level)!.title : 'Ниже A1'}
                after={new Date(t.at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              />
            ))}
          </Section>
        )}
        <MainButton text="Начать тест" onClick={() => setPhase('test')} />
      </Page>
    )
  }

  if (phase === 'result') {
    const levelId = passed >= 0 ? LEVEL_IDS[passed] : null
    const next = LEVEL_IDS[Math.min(passed + 1, LEVEL_IDS.length - 1)]
    const nextSet = getSet(next)!
    return (
      <Page>
        <div className="flex flex-col items-center px-4 pt-8 pb-8 text-center">
          <div className="mb-3 text-[15px] text-hint">Твой уровень</div>
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 15 }}>
            <LevelBadge badge={levelId ? getSet(levelId)!.badge : '—'} size={96} />
          </motion.div>
          <h1 className="mt-4 mb-2 text-[26px] font-bold">{levelId ? getSet(levelId)!.title.split(' — ')[1] : 'Ниже A1'}</h1>
          <div className="text-[15px] text-hint">{LEVEL_TEXT[levelId ?? 'none']}</div>
        </div>
        <Section title="Что дальше">
          <Cell
            before={<div className="py-1.5"><LevelBadge badge={nextSet.badge} size={34} /></div>}
            title={`Учить набор ${nextSet.badge}`}
            subtitle={nextSet.subtitle}
            chevron
            onClick={() => push({ name: 'librarySet', setId: next })}
          />
          <Cell title="Пройти тест ещё раз" tone="link" onClick={() => replace({ name: 'levelTest' })} />
        </Section>
        <MainButton text="Готово" onClick={back} />
      </Page>
    )
  }

  const q = questions[qIdx]
  const level = getSet(LEVEL_IDS[levelIdx])!
  return (
    <Page className="flex min-h-screen flex-col">
      <div className="mb-5 flex items-center justify-center gap-1.5">
        {LEVEL_IDS.map((id, i) => (
          <div
            key={id}
            className={`rounded-md px-2 py-0.5 text-[12px] font-bold ${
              i < levelIdx ? 'bg-success text-white' : i === levelIdx ? 'bg-button text-button-text' : 'bg-section text-hint'
            }`}
          >
            {getSet(id)!.badge}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${levelIdx}-${qIdx}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.16 }}
        >
          <div className="mb-6 flex min-h-36 flex-col items-center justify-center rounded-3xl bg-section px-6 py-7 text-center">
            <div className="mb-2 text-[14px] text-hint">
              Уровень {level.badge} · {qIdx + 1} из {PER_LEVEL}
            </div>
            <div className="text-[32px] leading-tight font-bold break-words">{q.word.en}</div>
          </div>

          <div className="grid gap-2.5">
            {q.options.map((opt) => {
              const state = chosen === null ? 'idle' : opt === q.word.ru ? 'correct' : opt === chosen ? 'wrong' : 'dim'
              return (
                <button
                  key={opt}
                  onClick={() => answer(opt)}
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
                </button>
              )
            })}
          </div>
          <button
            className="pressable mx-auto mt-5 block px-4 py-2 text-[16px] text-link disabled:opacity-40"
            disabled={chosen !== null}
            onClick={() => answer(null)}
          >
            Не знаю
          </button>
        </motion.div>
      </AnimatePresence>
    </Page>
  )
}
