import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'

function toBase64(bytes: Uint8Array) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

function fromBase64(s: string) {
  const bin = atob(s)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** Сжимает строку и кодирует в base64url (только A-Z a-z 0-9 _ -). */
export function pack(text: string): string {
  return toBase64(deflateSync(strToU8(text), { level: 9 }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function unpack(encoded: string): string {
  let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  return strFromU8(inflateSync(fromBase64(b64)))
}
