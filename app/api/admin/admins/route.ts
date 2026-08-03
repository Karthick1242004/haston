import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAdminsCollection } from '@/lib/mongodb'
import { isAdminEmail } from '@/lib/isAdmin'

export const dynamic = 'force-dynamic'

// Rejects anything that is not a plain email string. A raw body value would let
// `{"$ne": null}` through as a Mongo operator, matching every admin document and
// sliding past the `=== ADMIN_MAILID` superadmin guard (an object never equals a
// string).
function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (email.length === 0 || email.length > 254) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!(await isAdminEmail(session?.user?.email))) {
      return NextResponse.json({ error:'Unauthorized' }, { status:401 })
    }
    const collection = await getAdminsCollection()
    const docs = await collection.find({}).toArray()
    return NextResponse.json({ admins: docs.map(d=>d.email) })
  } catch(err) {
    console.error(err)
    return NextResponse.json({ error:'Internal server error' }, { status:500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await isAdminEmail(session?.user?.email))) {
      return NextResponse.json({ error:'Unauthorized' }, { status:401 })
    }
    const body = await request.json().catch(() => ({}))
    const email = normalizeEmail(body?.email)
    if (!email) return NextResponse.json({ error:'A valid email is required' }, { status:400 })
    const collection = await getAdminsCollection()
    await collection.updateOne({ email }, { $set:{ email } }, { upsert:true })
    return NextResponse.json({ success:true })
  } catch(err){ console.error(err); return NextResponse.json({ error:'Internal' }, { status:500 }) }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await isAdminEmail(session?.user?.email))) {
      return NextResponse.json({ error:'Unauthorized' }, { status:401 })
    }
    const body = await request.json().catch(() => ({}))
    const email = normalizeEmail(body?.email)
    if (!email) return NextResponse.json({ error:'A valid email is required' }, { status:400 })
    if (email === process.env.ADMIN_MAILID) return NextResponse.json({ error:'Cannot delete superadmin' }, { status:400 })
    const collection = await getAdminsCollection()
    await collection.deleteOne({ email })
    return NextResponse.json({ success:true })
  } catch(err){ console.error(err); return NextResponse.json({ error:'Internal' }, { status:500 }) }
} 