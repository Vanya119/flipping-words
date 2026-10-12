/** Русское склонение: plural(5, 'слово', 'слова', 'слов') → 'слов'. */
export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const norm = (s: string) => s.trim().toLowerCase()

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

const clean = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[.,!?;:"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^to /, '')

/**
 * Сравнивает введённый ответ с правильным. Варианты через «/» (learnt/learned) равноправны.
 * Одна опечатка в слове от 4 букв засчитывается, но помечается как 'typo'.
 */
export function checkAnswer(input: string, expected: string): 'exact' | 'typo' | 'wrong' {
  const given = clean(input)
  if (!given) return 'wrong'
  const variants = expected.split('/').map(clean)
  if (variants.includes(given)) return 'exact'
  if (variants.some((v) => v.length >= 4 && levenshtein(given, v) <= 1)) return 'typo'
  return 'wrong'
}
