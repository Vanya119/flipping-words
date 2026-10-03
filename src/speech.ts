// Озвучка встроенным синтезатором речи устройства — бесплатно и без сети.
export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

let voice: SpeechSynthesisVoice | undefined

function pickVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'))
  voice = voices.find((v) => /en[-_]US/i.test(v.lang) && v.localService) ?? voices.find((v) => /en[-_]US/i.test(v.lang)) ?? voices[0]
}

if (speechSupported) {
  pickVoice()
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
}

export function speak(text: string) {
  if (!speechSupported) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  if (voice) u.voice = voice
  u.rate = 0.9
  speechSynthesis.speak(u)
}
