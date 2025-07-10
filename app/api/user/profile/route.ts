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

    // Validate the data (basic validation)
    const updateData: Partial<ExtendedUser> = {}
    
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth)
    if (gender !== undefined) updateData.gender = gender
    if (addresses !== undefined) updateData.addresses = addresses
    if (preferences !== undefined) updateData.preferences = preferences

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