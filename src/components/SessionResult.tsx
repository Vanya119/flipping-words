import { motion } from 'motion/react'
import { IconParty } from './icons'
import { MainButton } from './MainButton'
import { Page } from './ui'

export function SessionResult({
  correct,
  wrong,
  onRepeat,
  onDone,
}: {
  correct: number
  wrong: number
  onRepeat?: () => void
  onDone: () => void
}) {
  const total = correct + wrong
  const pct = total ? Math.round((correct / total) * 100) : 0
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
        <div className="flex-1 rounded-xl bg-section py-4">
          <div className="text-[28px] font-bold text-success">{correct}</div>
          <div className="text-[13px] text-hint">с первого раза</div>
        </div>
        <div className="flex-1 rounded-xl bg-section py-4">
          <div className="text-[28px] font-bold text-danger">{wrong}</div>
          <div className="text-[13px] text-hint">с ошибкой</div>
        </div>
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
