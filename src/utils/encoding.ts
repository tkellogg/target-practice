export function utf8ToBase64(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64')
}

export function base64ToUtf8(str: string): string {
  return Buffer.from(str, 'base64').toString('utf-8')
} 