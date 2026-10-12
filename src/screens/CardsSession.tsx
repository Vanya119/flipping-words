import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { type ReactNode, type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { IconCards, IconCheck, IconFlip, IconSpeaker, IconX } from '../components/icons'
import { MainButton } from '../components/MainButton'
import { SessionResult } from '../components/SessionResult'
import { Empty, Page } from '../components/ui'
import { useRouter } from '../router'
import { poolWords, SESSION_LIMIT } from '../session'
import { speak, speechSupported } from '../speech'
import { isDue } from '../srs'
import { actions, getData, useData } from '../store'
import { haptic } from '../telegram'
import type { Direction, Word } from '../types'
import { shuffle } from '../utils'

const SWIPE_DISTANCE = 100
const SWIPE_VELOCITY = 500

function buildQueue(deckId: string | undefined, mode: 'due' | 'all') {
  const pool = poolWords(getData(), deckId)
  const list = mode === 'due' ? pool.filter((w) => isDue(w)) : pool
  return shuffle(list)
    .slice(0, SESSION_LIMIT)
    .map((w) => w.id)
}

export function CardsSession({ deckId, mode }: { deckId?: string; mode: 'due' | 'all' }) {
  const data = useData()
  const { back, replace } = useRouter()
  const direction = data.settings.direction

  const [queue, setQueue] = useState(() => buildQueue(deckId, mode))
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  /** Результат первой попытки по каждому слову. */
  const [results, setResults] = useState<Record<string, boolean>>({})
  /** Улетающая анимация текущей карточки — её регистрирует SwipeCard. */
  const flyRef = useRef<((ok: boolean) => void) | null>(null)

  const byId = useMemo(() => new Map(poolWords(data, deckId).map((w) => [w.id, w] as const)), [data, deckId])
  const current = byId.get(queue[pos])
  const next = byId.get(queue[pos + 1])
  const done = pos >= queue.length

  // Слово удалили во время сессии — пропускаем
  useEffect(() => {
    if (!done && !current) setPos((p) => p + 1)
  }, [done, current])

  const answer = (ok: boolean) => flyRef.current?.(ok)

  /** Карточка улетела — записываем ответ и показываем следующую. */
  const commit = (ok: boolean) => {
    if (!current) return
    const id = current.id
    const first = !(id in results)
    // В режиме повторения: оцениваем первую попытку, а также успешное повторение после ошибки
    actions.review(id, ok, mode === 'due' && (first || ok))
    if (first) setResults((r) => ({ ...r, [id]: ok }))
    if (!ok) setQueue((q) => [...q, id])
    setFlipped(false)
    setPos((p) => p + 1)
  }

  const flip = () => {
    haptic.select()
    setFlipped((f) => !f)
  }

  // Управление с клавиатуры для десктопа
  const handlers = useRef({ answer, flip })
  handlers.current = { answer, flip }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handlers.current.answer(true)
      else if (e.key === 'ArrowLeft') handlers.current.answer(false)
      else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        handlers.current.flip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (queue.length === 0) {
    return (
      <Page>
        {mode === 'due' ? (
          <Empty icon={<IconCards size={56} />} title="Всё повторено" text="Слов к повторению сейчас нет. Можно потренировать все слова — это не повлияет на расписание." />
        ) : (
          <Empty icon={<IconCards size={56} />} title="Нет слов" text="Добавь слова в колоду, чтобы тренироваться." />
        )}
        {mode === 'due' && poolWords(data, deckId).length > 0 ? (
          <MainButton text="Тренировать все слова" onClick={() => replace({ name: 'cards', deckId, mode: 'all' })} />
        ) : (
          <MainButton text="Назад" onClick={back} />
        )}
      </Page>
    )
  }

  if (done) {
    const values = Object.values(results)
    const correct = values.filter(Boolean).length
    return (
      <SessionResult
        correct={correct}
        wrong={values.length - correct}
        onRepeat={() => replace({ name: 'cards', deckId, mode: 'all' })}
        onDone={back}
      />
    )
  }

  const uniqueTotal = new Set(queue).size
  const progress = Object.keys(results).length / uniqueTotal
  return (
    <Page className="flex min-h-screen flex-col pb-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-section">
          <motion.div className="h-full rounded-full bg-button" animate={{ width: `${progress * 100}%` }} />
        </div>
        <div className="text-[13px] text-hint tabular-nums">
          {Object.keys(results).length}/{uniqueTotal}
        </div>
      </div>
      {mode === 'all' && <div className="mb-3 text-center text-[13px] text-hint">Свободная тренировка — интервалы не меняются</div>}

      <div className="relative flex-1" style={{ perspective: 1200, minHeight: 360, maxHeight: 520 }}>
        {next && next.id !== current?.id && (
          <div className="absolute inset-0 translate-y-3 scale-[0.94] opacity-60">
            <Face text={direction === 'en-ru' ? next.en : next.ru} />
          </div>
        )}
        {current && (
          <SwipeCard
            key={pos}
            word={current}
            direction={direction}
            flipped={flipped}
            onFlip={flip}
            onSwiped={commit}
            flyRef={flyRef}
          />
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-8">
        <RoundButton tone="danger" label="Не знаю" onClick={() => answer(false)}>
          <IconX />
        </RoundButton>
        <button className="pressable flex flex-col items-center gap-1 text-hint" onClick={flip}>
          <IconFlip size={22} />
          <span className="text-[12px]">Перевернуть</span>
        </button>
        <RoundButton tone="success" label="Знаю" onClick={() => answer(true)}>
          <IconCheck />
        </RoundButton>
      </div>
    </Page>
  )
}

function SwipeCard({
  word,
  direction,
  flipped,
  onFlip,
  onSwiped,
  flyRef,
}: {
  word: Word
  direction: Direction
  flipped: boolean
  onFlip: () => void
  onSwiped: (ok: boolean) => void
  flyRef: RefObject<((ok: boolean) => void) | null>
}) {
  // Своё значение x у каждой карточки: новая всегда появляется в центре
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-250, 250], [-14, 14])
  const knowOpacity = useTransform(x, [20, SWIPE_DISTANCE], [0, 1])
  const dontOpacity = useTransform(x, [-SWIPE_DISTANCE, -20], [1, 0])
  const dragged = useRef(false)
  const flying = useRef(false)

  const fly = (ok: boolean) => {
    if (flying.current) return
    flying.current = true
    if (ok) haptic.success()
    else haptic.tap()
    animate(x, ok ? 600 : -600, { duration: 0.22, ease: 'easeIn' }).then(() => onSwiped(ok))
  }

  const flyLatest = useRef(fly)
  flyLatest.current = fly
  useEffect(() => {
    flyRef.current = (ok) => flyLatest.current(ok)
    return () => {
      flyRef.current = null
    }
  }, [flyRef])

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      onPointerDown={() => (dragged.current = false)}
      onDragStart={() => (dragged.current = true)}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) fly(true)
        else if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) fly(false)
        else animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
      }}
      onClick={() => !dragged.current && onFlip()}
      initial={{ scale: 0.94, opacity: 0.6, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <Front word={word} direction={direction} />
        </div>
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <Back word={word} direction={direction} />
        </div>
      </motion.div>

      <motion.div
        style={{ opacity: knowOpacity }}
        className="pointer-events-none absolute top-6 left-6 -rotate-12 rounded-lg border-[3px] border-success px-3 py-1 text-[20px] font-extrabold text-success"
      >
        ЗНАЮ
      </motion.div>
      <motion.div
        style={{ opacity: dontOpacity }}
        className="pointer-events-none absolute top-6 right-6 rotate-12 rounded-lg border-[3px] border-danger px-3 py-1 text-[20px] font-extrabold text-danger"
      >
        НЕ ЗНАЮ
      </motion.div>
    </motion.div>
  )
}

function RoundButton({ tone, label, onClick, children }: { tone: 'success' | 'danger'; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="pressable flex flex-col items-center gap-1.5" aria-label={label}>
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full bg-section shadow-sm ${tone === 'success' ? 'text-success' : 'text-danger'}`}
      >
        {children}
      </span>
      <span className="text-[12px] text-hint">{label}</span>
    </button>
  )
}

function Face({ text, children }: { text?: string; children?: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl bg-section p-6 text-center shadow-[0_8px_30px_rgba(0,0,0,0.08)] select-none">
      {text && <div className="text-[34px] leading-tight font-bold break-words">{text}</div>}
      {children}
    </div>
  )
}

function SpeakButton({ text }: { text: string }) {
  if (!speechSupported) return null
  return (
    <button
      className="pressable mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-bg text-link"
      onClick={(e) => {
        e.stopPropagation()
        speak(text)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label="Произнести"
    >
      <IconSpeaker />
    </button>
  )
}

function Front({ word, direction }: { word: Word; direction: Direction }) {
  const isEn = direction === 'en-ru'
  return (
    <Face text={isEn ? word.en : word.ru}>
      {isEn && <SpeakButton text={word.en} />}
      <div className="absolute bottom-5 text-[13px] text-hint">Нажми, чтобы перевернуть</div>
    </Face>
  )
}

function Back({ word, direction }: { word: Word; direction: Direction }) {
  const isEn = direction === 'en-ru'
  return (
    <Face>
      <div className="mb-1 text-[16px] text-hint">{isEn ? word.en : word.ru}</div>
      <div className="text-[34px] leading-tight font-bold break-words">{isEn ? word.ru : word.en}</div>
      {word.forms && (
        <div className="mt-2 text-[18px] font-medium text-accent">
          {word.en} – {word.forms.join(' – ')}
        </div>
      )}
      <SpeakButton text={word.en} />
      {word.example && <div className="mt-5 text-[15px] text-hint italic">{word.example}</div>}
      {word.note && <div className="mt-3 rounded-xl bg-bg px-3 py-2 text-[14px]">{word.note}</div>}
    </Face>
  )
}
