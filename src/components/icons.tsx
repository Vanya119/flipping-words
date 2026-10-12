// Набор иконок в духе SF Symbols / Telegram, stroke = currentColor.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const IconCards = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="7" y="3" width="13" height="16" rx="2.5" />
    <path d="M4 7.5v10A2.5 2.5 0 0 0 6.5 20H15" />
  </svg>
)

export const IconQuiz = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M7 9h2M7 13h2M12 9h5M12 13h5M7 17h10" />
  </svg>
)

export const IconShare = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 15V3M7 8l5-5 5 5" />
    <path d="M5 12v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6" />
  </svg>
)

export const IconPlus = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconDownload = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
)

export const IconSpeaker = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M11 5 6 9H3v6h3l5 4z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
)

export const IconCheck = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.5}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

export const IconX = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.5}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconBook = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={1.5}>
    <path d="M4 5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2z" />
    <path d="M4 19a2 2 0 0 0 2 2h14v-3" />
    <path d="M9 7h6M9 11h4" />
  </svg>
)

export const IconParty = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={1.5}>
    <path d="M3 21 8 8l8 8z" />
    <path d="M14 4l.5 2M19 5l-2 1.5M20 10h-2M11 3c1 2 0 3 0 3M17 13c2-1 3 0 3 0" />
  </svg>
)

export const IconSearch = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const IconFlip = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5" />
  </svg>
)

export const IconLevels = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 20h4v-5H4zM10 20h4V10h-4zM16 20h4V4h-4z" />
  </svg>
)

export const IconTopics = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
  </svg>
)

export const IconVerbs = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 7h13l-3-3M20 17H7l3 3" />
  </svg>
)

export const IconTarget = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
)

export const IconChart = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 3v18h18" />
    <path d="m7 15 4-4 3 3 6-7" />
  </svg>
)

export const IconKeyboard = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8" />
  </svg>
)

export const IconPairs = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="3" y="4" width="7" height="6" rx="1.5" />
    <rect x="14" y="14" width="7" height="6" rx="1.5" />
    <path d="M10 7h3a2 2 0 0 1 2 2v5" />
  </svg>
)

export const IconForms = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 6h4M10 6h4M16 6h4M4 12h4M10 12h4M16 12h4M4 18h4M10 18h4M16 18h4" />
  </svg>
)
