import { useMemo } from 'react'
import { MainButton } from '../components/MainButton'
import { toast } from '../components/Toast'
import { Cell, Page, Section } from '../components/ui'
import { appLink, buildShare } from '../share'
import { useData } from '../store'
import { haptic, shareToChat } from '../telegram'
import { plural } from '../utils'

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Фолбэк для вебвью без Clipboard API
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

export function ShareScreen({ deckId }: { deckId: string }) {
  const { decks } = useData()
  const deck = decks.find((d) => d.id === deckId)
  const share = useMemo(() => (deck ? buildShare(deck) : null), [deck])
  if (!deck || !share) return null

  const n = deck.words.length
  const title = `Колода «${deck.name}» — ${n} ${plural(n, 'слово', 'слова', 'слов')}`

  const sendLink = () => {
    haptic.tap()
    if (share.link) shareToChat(share.link, `${title}. Открой, чтобы добавить себе в Flipping Words`)
  }

  const sendCode = () => {
    haptic.tap()
    shareToChat(appLink(), `${title}.\nОткрой Flipping Words → «Импортировать колоду» и вставь это сообщение:\n\n${share.code}`)
  }

  const copyCode = async () => {
    if (await copy(share.code)) {
      haptic.success()
      toast('Код скопирован')
    }
  }

  return (
    <Page>
      <h1 className="mb-1 px-1 text-[26px] font-bold">Поделиться</h1>
      <div className="mb-5 px-1 text-[15px] text-hint">{title}</div>

      {share.link ? (
        <Section footer="Друг откроет ссылку и сразу увидит колоду с кнопкой «Добавить себе». Прогресс изучения не передаётся.">
          <Cell title="Отправить ссылку в чат" tone="link" onClick={sendLink} />
        </Section>
      ) : (
        <Section footer="Колода слишком большая для ссылки (лимит Telegram — 512 символов), поэтому делимся кодом.">
          <Cell title="Отправить код в чат" tone="link" onClick={sendCode} />
        </Section>
      )}

      <Section title="Код колоды" footer="Друг вставит его на экране «Импортировать колоду».">
        <div className="max-h-40 overflow-auto px-4 py-3 font-mono text-[12px] break-all text-hint">{share.code}</div>
        <Cell title="Скопировать код" tone="link" onClick={copyCode} />
        {share.link && <Cell title="Отправить код в чат" tone="link" onClick={sendCode} />}
      </Section>

      <MainButton text={share.link ? 'Отправить ссылку' : 'Отправить код'} onClick={share.link ? sendLink : sendCode} />
    </Page>
  )
}
