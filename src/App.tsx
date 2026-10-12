import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ToastHost } from './components/Toast'
import { type Route, type Router, RouterContext } from './router'
import { CardsSession } from './screens/CardsSession'
import { DeckForm } from './screens/DeckForm'
import { DeckScreen } from './screens/DeckScreen'
import { Home } from './screens/Home'
import { FormsSession } from './screens/FormsSession'
import { ImportScreen } from './screens/ImportScreen'
import { LevelTest } from './screens/LevelTest'
import { LibraryScreen } from './screens/LibraryScreen'
import { LibrarySetScreen } from './screens/LibrarySetScreen'
import { MatchSession } from './screens/MatchSession'
import { QuizSession } from './screens/QuizSession'
import { ShareScreen } from './screens/ShareScreen'
import { StatsScreen } from './screens/StatsScreen'
import { TypingSession } from './screens/TypingSession'
import { WordForm } from './screens/WordForm'
import { initStore, needsInitialSync } from './store'
import { inTelegram, startParam, tg } from './telegram'

interface Entry {
  route: Route
  key: number
}

let nextKey = 0
const entry = (route: Route): Entry => ({ route, key: nextKey++ })

function initialStack(): Entry[] {
  const param = startParam()
  // Открыли по ссылке «поделиться колодой» — сразу показываем импорт
  if (param?.startsWith('d')) return [entry({ name: 'home' }), entry({ name: 'import', code: param })]
  return [entry({ name: 'home' })]
}

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home />
    case 'deck':
      return <DeckScreen deckId={route.deckId} />
    case 'deckForm':
      return <DeckForm deckId={route.deckId} />
    case 'word':
      return <WordForm deckId={route.deckId} wordId={route.wordId} />
    case 'cards':
      return <CardsSession deckId={route.deckId} mode={route.mode} />
    case 'quiz':
      return <QuizSession deckId={route.deckId} />
    case 'share':
      return <ShareScreen deckId={route.deckId} />
    case 'import':
      return <ImportScreen code={route.code} />
    case 'library':
      return <LibraryScreen kind={route.kind} />
    case 'librarySet':
      return <LibrarySetScreen setId={route.setId} />
    case 'levelTest':
      return <LevelTest />
    case 'stats':
      return <StatsScreen />
    case 'typing':
      return <TypingSession deckId={route.deckId} />
    case 'match':
      return <MatchSession deckId={route.deckId} />
    case 'forms':
      return <FormsSession deckId={route.deckId} />
  }
}

export function App() {
  const [stack, setStack] = useState<Entry[]>(initialStack)
  const [syncing, setSyncing] = useState(needsInitialSync)
  const direction = useRef<1 | -1>(1)

  useEffect(() => {
    // Не держим пользователя дольше пары секунд, даже если облако тормозит
    const timeout = setTimeout(() => setSyncing(false), 3000)
    initStore().finally(() => {
      clearTimeout(timeout)
      setSyncing(false)
    })
  }, [])

  const router = useMemo<Router>(
    () => ({
      route: stack[stack.length - 1].route,
      depth: stack.length,
      push: (r) => {
        direction.current = 1
        setStack((s) => [...s, entry(r)])
      },
      replace: (r) => {
        direction.current = 1
        setStack((s) => [...s.slice(0, -1), entry(r)])
      },
      back: () => {
        direction.current = -1
        setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
      },
      home: () => {
        direction.current = -1
        setStack([entry({ name: 'home' })])
      },
    }),
    [stack],
  )

  // Нативная кнопка «Назад» Telegram
  const canGoBack = stack.length > 1
  const backRef = useRef(router.back)
  backRef.current = router.back
  useEffect(() => {
    if (!inTelegram) return
    const cb = () => backRef.current()
    tg!.BackButton.onClick(cb)
    return () => tg!.BackButton.offClick(cb)
  }, [])
  useEffect(() => {
    if (!inTelegram) return
    if (canGoBack) tg!.BackButton.show()
    else tg!.BackButton.hide()
  }, [canGoBack])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [stack.length])

  if (syncing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-button border-t-transparent" />
      </div>
    )
  }

  return (
    <RouterContext.Provider value={router}>
      {!inTelegram && canGoBack && (
        <button onClick={router.back} className="pressable sticky top-0 z-10 w-full bg-bg/90 px-4 py-2.5 text-left text-[16px] text-link backdrop-blur">
          ‹ Назад
        </button>
      )}
      <AnimatePresence mode="popLayout" initial={false} custom={direction.current}>
        <motion.div
          key={stack[stack.length - 1].key}
          custom={direction.current}
          variants={{
            enter: (d: number) => ({ x: d * 40, opacity: 0 }),
            center: { x: 0, opacity: 1, pointerEvents: 'auto' },
            exit: (d: number) => ({ x: d * -40, opacity: 0, pointerEvents: 'none' }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Screen route={router.route} />
        </motion.div>
      </AnimatePresence>
      <ToastHost />
    </RouterContext.Provider>
  )
}
