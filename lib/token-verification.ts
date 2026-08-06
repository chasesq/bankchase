import jwt, { type JwtPayload } from 'jsonwebtoken'

export function verifyToken(token: string): JwtPayload | null {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET
  if (!secret) return null

  try {
    const payload = jwt.verify(token, secret)
    return typeof payload === 'string' ? null : payload
  } catch {
    return null
  }
}
