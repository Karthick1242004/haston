import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { findUserById, updateUser, ExtendedUser } from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await findUserById(session.user.id)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove sensitive information before sending
    const { accounts, ...userProfile } = user
    
    return NextResponse.json({ user: userProfile })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { addresses, preferences, firstName, lastName, phone, dateOfBirth, gender } = body

    // The field list was already an allowlist; these checks stop unbounded or
    // wrong-typed values reaching the user document — notably an Invalid Date
    // from a garbage dateOfBirth, and arbitrarily large address/preference blobs.
    const text = (value: unknown, max: number): string | null =>
      typeof value === 'string' && value.length <= max ? value.trim() : null

    const updateData: Partial<ExtendedUser> = {}

    for (const [key, value] of [
      ['firstName', firstName], ['lastName', lastName], ['phone', phone], ['gender', gender],
    ] as const) {
      if (value === undefined) continue
      const clean = text(value, 100)
      if (clean === null) {
        return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 })
      }
      ;(updateData as any)[key] = clean
    }

    if (dateOfBirth !== undefined) {
      const parsed = new Date(dateOfBirth)
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 })
      }
      updateData.dateOfBirth = parsed
    }

    if (addresses !== undefined) {
      if (!Array.isArray(addresses) || addresses.length > 20) {
        return NextResponse.json({ error: 'Invalid addresses' }, { status: 400 })
      }
      updateData.addresses = addresses
    }

    if (preferences !== undefined) {
      if (typeof preferences !== 'object' || preferences === null || Array.isArray(preferences)) {
        return NextResponse.json({ error: 'Invalid preferences' }, { status: 400 })
      }
      updateData.preferences = preferences
    }

    const success = await updateUser(session.user.id, updateData)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 