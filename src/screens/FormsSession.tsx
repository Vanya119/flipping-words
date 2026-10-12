import { useState } from 'react'
import { IconForms } from '../components/icons'
import { MainButton } from '../components/MainButton'
import { type TypedTask, TypedSession } from '../components/TypedSession'
import { Empty, Page } from '../components/ui'
import { useRouter } from '../router'
import { pickForPractice, poolWords } from '../session'
import { getData } from '../store'

const SIZE = 15

function buildTasks(deckId?: string): TypedTask[] {
  const verbs = poolWords(getData(), deckId).filter((w) => w.forms)
  return pickForPractice(verbs, SIZE).map((word) => ({
    word,
    hint: word.forms![0].split('/')[0],
    prompt: (
      <>
        <div className="mb-2 text-[14px] text-hint">Напиши две формы глагола</div>
        <div className="text-[32px] leading-tight font-bold break-words">{word.en}</div>
        <div className="mt-1 text-[16px] text-hint">{word.ru}</div>
      </>
    ),
    fields: [
      { label: 'Past Simple (V2)', answer: word.forms![0] },
      { label: 'Past Participle (V3)', answer: word.forms![1] },
    ],
  }))
}

export function FormsSession({ deckId }: { deckId?: string }) {
  const { back, replace } = useRouter()
  const [tasks] = useState(() => buildTasks(deckId))

  if (tasks.length === 0) {
    return (
      <Page>
        <Empty icon={<IconForms size={56} />} title="Нет неправильных глаголов" text="Добавь набор «Неправильные глаголы» из раздела «Глаголы»." />
        <MainButton text="Назад" onClick={back} />
      </Page>
    )
  }

  return <TypedSession tasks={tasks} onRepeat={() => replace({ name: 'forms', deckId })} onDone={back} />
}
