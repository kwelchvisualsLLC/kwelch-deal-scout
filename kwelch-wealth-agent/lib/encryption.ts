import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (openssl rand -hex 32)')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(hash: string): string {
  const [ivHex, encryptedHex] = hash.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}
