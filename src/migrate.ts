import { librarySets } from './library'
import { actions, getData } from './store'
import { norm } from './utils'

/** Возвращает слова из старой колоды «На изучение» в колоды наборов, откуда они были взяты. */
export function migrateLegacyStudy() {
  const decks = getData().decks
  actions.migrateLegacyStudy((w) => {
    const set = librarySets.find((s) => s.words.some((x) => norm(x.en) === norm(w.en)) && decks.some((d) => d.source === s.id))
    return set ? decks.find((d) => d.source === set.id)!.id : null
  })
}
