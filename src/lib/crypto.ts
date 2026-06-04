export async function hashText(password: string, saltHex?: string) {
  const encoder = new TextEncoder()
  const salt = saltHex ? hexToBuf(saltHex) : crypto.getRandomValues(new Uint8Array(16))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  const finalSaltHex =
    saltHex ||
    Array.from(salt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

  return `${finalSaltHex}:${hashHex}`
}

export async function verifyText(password: string, storedHash: string) {
  if (!storedHash.includes(':')) {
    // Fallback for old SHA-256 plaintext hashes
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const oldHashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    if (oldHashHex === storedHash) return true
    return false
  }

  const [saltHex] = storedHash.split(':')
  const newHash = await hashText(password, saltHex)
  return newHash === storedHash
}

function hexToBuf(hex: string) {
  const view = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return view
}

export function generateRecoveryKey() {
  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase()
  return `NV-${segment()}-${segment()}-${segment()}-${segment()}`
}
