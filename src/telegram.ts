// Тонкая обёртка над Telegram WebApp API с фолбэками для обычного браузера.

type Callback = () => void

interface BottomButton {
  setParams(p: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }): void
  onClick(cb: Callback): void
  offClick(cb: Callback): void
  show(): void
  hide(): void
  showProgress(leaveActive?: boolean): void
  hideProgress(): void
}

interface CloudStorage {
  setItem(key: string, value: string, cb?: (err: string | null, ok?: boolean) => void): void
  getItems(keys: string[], cb: (err: string | null, values?: Record<string, string>) => void): void
  removeItems(keys: string[], cb?: (err: string | null, ok?: boolean) => void): void
}

export interface WebApp {
  platform: string
  version: string
  colorScheme: 'light' | 'dark'
  initDataUnsafe: { user?: { id: number; first_name?: string }; start_param?: string }
  isVersionAtLeast(v: string): boolean
  ready(): void
  expand(): void
  disableVerticalSwipes?(): void
  setHeaderColor?(c: string): void
  setBackgroundColor?(c: string): void
  setBottomBarColor?(c: string): void
  onEvent(e: string, cb: Callback): void
  showConfirm(msg: string, cb: (ok: boolean) => void): void
  showAlert(msg: string, cb?: Callback): void
  openTelegramLink(url: string): void
  MainButton: BottomButton
  BackButton: { show(): void; hide(): void; onClick(cb: Callback): void; offClick(cb: Callback): void }
  HapticFeedback: {
    impactOccurred(s: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(t: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
  CloudStorage: CloudStorage
}

declare global {
  interface Window {
    Telegram?: { WebApp: WebApp }
  }
}

export const tg: WebApp | undefined = window.Telegram?.WebApp
/** true, если приложение открыто внутри Telegram (а не просто в браузере). */
export const inTelegram = !!tg && tg.platform !== 'unknown'

const atLeast = (v: string) => inTelegram && tg!.isVersionAtLeast(v)

export function initTelegram() {
  if (!inTelegram || !tg) return
  tg.ready()
  tg.expand()
  // Иначе свайп карточки вниз/вбок может закрыть мини-приложение
  if (atLeast('7.7')) tg.disableVerticalSwipes?.()
  const applyColors = () => {
    if (!atLeast('6.1')) return
    tg.setHeaderColor?.('secondary_bg_color')
    tg.setBackgroundColor?.('secondary_bg_color')
    if (atLeast('7.10')) tg.setBottomBarColor?.('secondary_bg_color')
  }
  applyColors()
  tg.onEvent('themeChanged', applyColors)
}

export const haptic = {
  tap() {
    if (atLeast('6.1')) tg!.HapticFeedback.impactOccurred('light')
  },
  select() {
    if (atLeast('6.1')) tg!.HapticFeedback.selectionChanged()
  },
  success() {
    if (atLeast('6.1')) tg!.HapticFeedback.notificationOccurred('success')
  },
  error() {
    if (atLeast('6.1')) tg!.HapticFeedback.notificationOccurred('error')
  },
}

export function confirmDialog(message: string): Promise<boolean> {
  if (atLeast('6.2')) return new Promise((resolve) => tg!.showConfirm(message, resolve))
  return Promise.resolve(window.confirm(message))
}

export function alertDialog(message: string): Promise<void> {
  if (atLeast('6.2')) return new Promise((resolve) => tg!.showAlert(message, resolve))
  window.alert(message)
  return Promise.resolve()
}

/** Открывает стандартный диалог Telegram «Переслать» со ссылкой и текстом. */
export function shareToChat(url: string, text: string) {
  const link = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  if (inTelegram) tg!.openTelegramLink(link)
  else window.open(link, '_blank')
}

export function startParam(): string | undefined {
  return tg?.initDataUnsafe?.start_param || new URLSearchParams(location.search).get('startapp') || undefined
}

export function userId(): number | undefined {
  return tg?.initDataUnsafe?.user?.id
}

export const cloudStorageAvailable = () => atLeast('6.9') && !!tg!.CloudStorage

export function cloudGet(keys: string[]): Promise<Record<string, string>> {
  return new Promise((resolve, reject) =>
    tg!.CloudStorage.getItems(keys, (err, values) => (err ? reject(new Error(err)) : resolve(values ?? {}))),
  )
}

export function cloudSet(key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) =>
    tg!.CloudStorage.setItem(key, value, (err) => (err ? reject(new Error(err)) : resolve())),
  )
}

export function cloudRemove(keys: string[]): Promise<void> {
  return new Promise((resolve, reject) =>
    tg!.CloudStorage.removeItems(keys, (err) => (err ? reject(new Error(err)) : resolve())),
  )
}
