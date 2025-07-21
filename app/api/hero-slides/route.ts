import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function GET() {
  try {
    const db = await getDatabase()
    const slides = await db.collection('heroSlides')
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray()
    
    return NextResponse.json({ 
      success: true, 
      slides: slides.map((slide: any) => ({
        id: slide._id.toString(),
        mainText: slide.mainText,
        subText: slide.subText,
        image: slide.image,
        order: slide.order
      }))
    })
  } catch (error) {
    console.error('Error fetching hero slides:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch slides' }, { status: 500 })
  }
} 