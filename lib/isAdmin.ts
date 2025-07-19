import { getAdminsCollection } from '@/lib/mongodb'

export async function isAdminEmail(email: string | undefined | null): Promise<boolean> {
  if (!email) return false
  const superAdmin = process.env.ADMIN_MAILID
  if (email === superAdmin) return true
  const collection = await getAdminsCollection()
  const doc = await collection.findOne({ email })
  return !!doc
} 