// Маркерные слова для теста на уровень: типичные для своего уровня, частотные и без двусмысленного перевода.
// Каждое должно быть в соответствующем src/data/levels/<уровень>.txt — это проверяет library.ts.
export const LEVEL_TEST_WORDS: Record<string, string[]> = {
  a1: [
    'family', 'kitchen', 'breakfast', 'yesterday', 'tomorrow', 'beautiful', 'difficult', 'sleep', 'buy', 'help',
    'weather', 'clothes', 'birthday', 'shop', 'ask', 'cook', 'wash', 'weekend', 'hair', 'homework',
    'boss', 'near', 'far', 'watch', 'swim', 'young', 'favourite', 'together', 'everything', 'money',
  ],
  a2: [
    'borrow', 'cheap', 'expensive', 'invite', 'remember', 'forget', 'neighbour', 'hungry', 'tired', 'dangerous',
    'noisy', 'mistake', 'already', 'suddenly', 'ago', 'hurry', 'worry', 'happen', 'receipt', 'discount',
    'umbrella', 'wallet', 'traffic jam', 'accident', 'crowded', 'comfortable', 'terrible', 'delicious', 'ready', 'important',
  ],
  b1: [
    'afford', 'avoid', 'complain', 'convince', 'earn', 'encourage', 'habit', 'knowledge', 'opportunity', 'persuade',
    'pretend', 'prevent', 'rely on', 'remind', 'although', 'unfortunately', 'by the way', 'make sense', 'get used to', 'admit',
    'blame', 'doubt', 'regret', 'careful', 'lonely', 'available', 'useful', 'debt', 'behaviour', 'reputation',
  ],
  b2: [
    'appreciate', 'attend', 'bargain', 'cancel', 'cope', 'decent', 'desperate', 'exhausted', 'fed up', 'guilty',
    'hassle', 'hardly', 'likely', 'postpone', 'reasonable', 'refund', 'reluctant', 'rumour', 'sensible', 'slightly',
    'temporary', 'tough', 'urgent', 'weird', 'willing', 'insurance', 'commute', 'feedback', 'queue', 'lately',
  ],
  c1: [
    'adamant', 'backlash', 'bewildered', 'brag', 'clumsy', 'crave', 'daunting', 'downside', 'drastic', 'dwell on',
    'flaw', 'gullible', 'hectic', 'hindsight', 'in a nutshell', 'indifferent', 'let alone', 'mindset', 'nag', 'nonetheless',
    'overlook', 'pitfall', 'procrastinate', 'reckless', 'resent', 'resourceful', 'ruthless', 'succinct', 'unwind', 'vivid',
  ],
  c2: [
    'abrasive', 'acumen', 'affluent', 'aloof', 'ambivalent', 'apprehensive', 'banter', 'bleak', 'callous', 'contrived',
    'convoluted', 'debacle', 'dubious', 'embellish', 'epitome', 'fickle', 'frivolous', 'gaffe', 'gloat', 'hone',
    'impromptu', 'inept', 'jaded', 'mediocre', 'misgivings', 'nitpick', 'ominous', 'preposterous', 'smug', 'squander',
  ],
}
