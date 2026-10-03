/** Username бота без @. Задаётся через VITE_BOT_USERNAME (локально — в .env.local, в CI — переменная репозитория BOT_USERNAME). */
export const BOT_USERNAME: string = import.meta.env.VITE_BOT_USERNAME || 'flipping_words_bot'
