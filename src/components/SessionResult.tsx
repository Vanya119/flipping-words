import { motion } from 'motion/react'
import { IconParty } from './icons'
import { MainButton } from './MainButton'
import { Page } from './ui'

interface StatItem {
  value: string | number
  label: string
  tone?: 'success' | 'danger'
}

export function SessionResult({
  correct,
  wrong,
  items,
  onRepeat,
  onDone,
}: {
  correct: number
  wrong: number
  /** Свои плитки вместо «с первого раза / с ошибкой». */
  items?: StatItem[]
  onRepeat?: () => void
  onDone: () => void
}) {
  const total = correct + wrong
  const pct = total ? Math.round((correct / total) * 100) : 0
  const tiles: StatItem[] = items ?? [
    { value: correct, label: 'с первого раза', tone: 'success' },
    { value: wrong, label: 'с ошибкой', tone: 'danger' },
  ]
  return (
    <Page className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="mb-5 text-accent"
      >
        <IconParty size={72} />
      </motion.div>
      <div className="mb-1 text-[26px] font-bold">{pct >= 80 ? 'Отлично!' : pct >= 50 ? 'Хороший результат' : 'Продолжай тренироваться'}</div>
      <div className="mb-8 text-[15px] text-hint">Сессия завершена</div>
      <div className="flex w-full max-w-xs gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="flex-1 rounded-xl bg-section py-4">
            <div className={`text-[28px] font-bold tabular-nums ${t.tone === 'success' ? 'text-success' : t.tone === 'danger' ? 'text-danger' : ''}`}>
              {t.value}
            </div>
            <div className="text-[13px] text-hint">{t.label}</div>
          </div>
        ))}
      </div>
      {onRepeat && (
        <button className="pressable mt-6 text-[16px] text-link" onClick={onRepeat}>
          Ещё раз
        </button>
      )}
      <MainButton text="Готово" onClick={onDone} />
    </Page>
  )
}
