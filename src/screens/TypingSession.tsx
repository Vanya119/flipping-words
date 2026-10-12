import { useState } from 'react'
import { IconKeyboard } from '../components/icons'
import { MainButton } from '../components/MainButton'
import { type TypedTask, TypedSession } from '../components/TypedSession'
import { Empty, Page } from '../components/ui'
import { useRouter } from '../router'
import { pickForPractice, poolWords } from '../session'
import { getData } from '../store'

const SIZE = 15

function buildTasks(deckId?: string): TypedTask[] {
  return pickForPractice(poolWords(getData(), deckId), SIZE).map((word) => ({
    word,
    hint: word.en.split('/')[0],
    prompt: (
      <>
        <div className="mb-2 text-[14px] text-hint">Напиши по-английски</div>
        <div className="text-[30px] leading-tight font-bold break-words">{word.ru}</div>
      </>
    ),
    fields: [{ answer: word.en }],
  }))
}

export function TypingSession({ deckId }: { deckId?: string }) {
  const { back, replace } = useRouter()
  const [tasks] = useState(() => buildTasks(deckId))

  if (tasks.length === 0) {
    return (
      <Page>
        <Empty icon={<IconKeyboard size={56} />} title="Нет слов" text="Добавь слова в колоду, чтобы тренироваться." />
        <MainButton text="Назад" onClick={back} />
      </Page>
    )
  }

  return <TypedSession tasks={tasks} onRepeat={() => replace({ name: 'typing', deckId })} onDone={back} />
}
