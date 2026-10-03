import { useEffect, useId, useRef } from 'react'
import { inTelegram, tg } from '../telegram'

interface Props {
  text: string
  onClick: () => void
  disabled?: boolean
}

// Во время анимации перехода старый и новый экран смонтированы одновременно,
// поэтому нативной кнопкой управляет самый свежий экземпляр из стека.
interface Instance {
  id: string
  props: { current: Props }
}
const instances: Instance[] = []
let listening = false

function apply() {
  const mb = tg!.MainButton
  const top = instances[instances.length - 1]
  if (!top) {
    mb.hide()
    return
  }
  const { text, disabled } = top.props.current
  const css = getComputedStyle(document.documentElement)
  const color = css.getPropertyValue(disabled ? '--tg-theme-hint-color' : '--tg-theme-button-color').trim()
  mb.setParams({ text, is_visible: true, is_active: !disabled, ...(color ? { color } : {}) })
}

function onNativeClick() {
  const top = instances[instances.length - 1]
  if (top && !top.props.current.disabled) top.props.current.onClick()
}

/** Нативная MainButton в Telegram, обычная прилипающая кнопка в браузере. */
export function MainButton(props: Props) {
  const id = useId()
  const ref = useRef(props)
  ref.current = props

  useEffect(() => {
    if (!inTelegram) return
    if (!listening) {
      tg!.MainButton.onClick(onNativeClick)
      listening = true
    }
    instances.push({ id, props: ref })
    apply()
    return () => {
      const i = instances.findIndex((x) => x.id === id)
      if (i >= 0) instances.splice(i, 1)
      apply()
    }
  }, [id])

  useEffect(() => {
    if (inTelegram && instances[instances.length - 1]?.id === id) apply()
  }, [id, props.text, props.disabled])

  if (inTelegram) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 bg-bg/90 px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
      <button
        onClick={props.onClick}
        disabled={props.disabled}
        className="pressable mx-auto block h-12 w-full max-w-xl rounded-xl bg-button text-[16px] font-semibold text-button-text disabled:opacity-40"
      >
        {props.text}
      </button>
    </div>
  )
}
