import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { speak, speechSupported } from '../speech'
import { isDue } from '../srs'
import { actions } from '../store'
import { haptic } from '../telegram'
import type { Word } from '../types'
import { checkAnswer } from '../utils'
import { IconSpeaker } from './icons'
import { MainButton } from './MainButton'
import { SessionResult } from './SessionResult'
import { Page } from './ui'

export interface TypedTask {
  word: Word
  prompt: ReactNode
  hint: string
  fields: { label?: string; answer: string }[]
}

type Verdict = ReturnType<typeof checkAnswer>

/** Общая механика упражнений с вводом с клавиатуры (перевод, формы глагола). */
export function TypedSession({ tasks, onRepeat, onDone }: { tasks: TypedTask[]; onRepeat: () => void; onDone: () => void }) {
  const [idx, setIdx] = useState(0)
  const [values, setValues] = useState<string[]>([])
  const [verdicts, setVerdicts] = useState<Verdict[] | null>(null)
  const [hintLen, setHintLen] = useState(0)
  const [score, setScore] = useState(0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  if (idx >= tasks.length) {
    return <SessionResult correct={score} wrong={tasks.length - score} onRepeat={onRepeat} onDone={onDone} />
  }

  const task = tasks[idx]
  const checked = verdicts !== null
  const allExact = checked && verdicts.every((v) => v === 'exact')

  const next = () => {
    clearTimeout(timer.current)
    setIdx((i) => i + 1)
    setValues([])
    setVerdicts(null)
    setHintLen(0)
  }

  const check = () => {
    if (checked) return next()
    const v = task.fields.map((f, i) => checkAnswer(values[i] ?? '', f.answer))
    const ok = v.every((x) => x !== 'wrong')
    setVerdicts(v)
    if (ok) {
      haptic.success()
      setScore((s) => s + 1)
    } else {
      haptic.error()
    }
    if (speechSupported) speak(task.word.en)
    // С подсказкой верный ответ не продвигает слово по интервалам
    const grade = ok ? isDue(task.word) && hintLen === 0 : true
    actions.review(task.word.id, ok, grade)
    if (v.every((x) => x === 'exact')) timer.current = setTimeout(next, 900)
  }

  const showHint = () => {
    haptic.select()
    setHintLen((n) => Math.min(n + 1, task.hint.length))
    inputs.current[0]?.focus()
  }

  return (
    <Page className="flex min-h-screen flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-section">
          <motion.div className="h-full rounded-full bg-button" animate={{ width: `${(idx / tasks.length) * 100}%` }} />
        </div>
        <div className="text-[13px] text-hint tabular-nums">
          {idx + 1}/{tasks.length}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.16 }}
        >
          <div className="mb-5 flex min-h-36 flex-col items-center justify-center rounded-3xl bg-section px-6 py-7 text-center">
            {task.prompt}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              check()
            }}
            className="grid gap-2.5"
          >
            {task.fields.map((f, i) => {
              const v = verdicts?.[i]
              const ring = v === 'exact' ? 'ring-2 ring-success' : v === 'typo' ? 'ring-2 ring-[#f0a020]' : v === 'wrong' ? 'ring-2 ring-danger' : ''
              return (
                <div key={i}>
                  {f.label && <div className="mb-1 px-1 text-[13px] text-hint">{f.label}</div>}
                  <input
                    ref={(el) => {
                      inputs.current[i] = el
                    }}
                    onKeyDown={(e) => {
                      // Enter в непоследнем поле переводит фокус на следующее
                      if (e.key === 'Enter' && !checked && i < task.fields.length - 1) {
                        e.preventDefault()
                        inputs.current[i + 1]?.focus()
                      }
                    }}
                    autoFocus={i === 0}
                    value={values[i] ?? ''}
                    readOnly={checked}
                    onChange={(e) => setValues((vals) => Object.assign([...vals], { [i]: e.target.value }))}
                    placeholder={i === 0 && hintLen > 0 ? task.hint.slice(0, hintLen) + '…' : 'Введи ответ'}
                    lang="en"
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    enterKeyHint={checked || i === task.fields.length - 1 ? 'done' : 'next'}
                    className={`h-13 w-full rounded-xl bg-section px-4 text-[18px] outline-none placeholder:text-hint ${ring}`}
                  />
                  {v && v !== 'exact' && (
                    <div className={`mt-1.5 px-1 text-[15px] ${v === 'typo' ? 'text-[#f0a020]' : 'text-danger'}`}>
                      {v === 'typo' ? 'Почти! Правильно: ' : 'Правильно: '}
                      <b>{f.answer}</b>
                    </div>
                  )}
                </div>
              )
            })}
            {/* Enter в поле отправляет форму */}
            <button type="submit" className="hidden" />
          </form>

          <div className="mt-5 flex justify-center gap-6">
            {!checked && task.fields.length === 1 && (
              <button className="pressable text-[16px] text-link" onClick={showHint}>
                Подсказка
              </button>
            )}
            {checked && speechSupported && (
              <button className="pressable flex items-center gap-1.5 text-[16px] text-link" onClick={() => speak(task.word.en)}>
                <IconSpeaker size={20} /> Произнести
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <MainButton text={checked ? (allExact ? 'Дальше' : 'Понятно, дальше') : 'Проверить'} onClick={check} />
    </Page>
  )
}
