import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

let show: ((text: string) => void) | null = null

export function toast(text: string) {
  show?.(text)
}

export function ToastHost() {
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null)

  useEffect(() => {
    show = (text) => setMsg({ text, id: Date.now() })
    return () => {
      show = null
    }
  }, [])

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 1800)
    return () => clearTimeout(t)
  }, [msg])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            className="rounded-xl bg-black/80 px-4 py-2.5 text-[15px] text-white shadow-lg backdrop-blur"
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
