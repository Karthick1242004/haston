"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface HeroSlide {
  id?: string
  _id?: string
  mainText: string
  subText: string
  image: string
  order: number
  isActive?: boolean
}

export function useHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  // Fetch public active slides
  const fetchSlides = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/hero-slides')
      const data = await response.json()
      
      if (data.success) {
        setSlides(data.slides)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch slides')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching slides:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSlides()
  }, [])

  return {
    slides,
    isLoading,
    error,
    refetch: fetchSlides
  }
}

// Admin hook for managing all slides
export function useAdminHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  // Fetch all slides (admin)
  const fetchAllSlides = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/hero-slides')
      const data = await response.json()
      
      if (data.success) {
        setSlides(data.slides)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch slides')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching admin slides:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Create new slide
  const createSlide = async (slideData: {
    mainText: string
    subText: string
    image: File
    order: number
    isActive: boolean
  }) => {
    try {
      const formData = new FormData()
      formData.append('mainText', slideData.mainText)
      formData.append('subText', slideData.subText)
      formData.append('image', slideData.image)
      formData.append('order', slideData.order.toString())
      formData.append('isActive', slideData.isActive.toString())

      const response = await fetch('/api/admin/hero-slides', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchAllSlides() // Refresh list
        return { success: true, slide: data.slide }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Error creating slide:', err)
      return { success: false, error: 'Network error' }
    }
  }

  // Update slide
  const updateSlide = async (slideData: {
    slideId: string
    mainText: string
    subText: string
    image?: File
    currentImageUrl: string
    order: number
    isActive: boolean
  }) => {
    try {
      const formData = new FormData()
      formData.append('slideId', slideData.slideId)
      formData.append('mainText', slideData.mainText)
      formData.append('subText', slideData.subText)
      if (slideData.image) {
        formData.append('image', slideData.image)
      }
      formData.append('currentImageUrl', slideData.currentImageUrl)
      formData.append('order', slideData.order.toString())
      formData.append('isActive', slideData.isActive.toString())

      const response = await fetch('/api/admin/hero-slides', {
        method: 'PUT',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchAllSlides() // Refresh list
        return { success: true, slide: data.slide }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Error updating slide:', err)
      return { success: false, error: 'Network error' }
    }
  }

  // Delete slide
  const deleteSlide = async (slideId: string) => {
    try {
      const response = await fetch(`/api/admin/hero-slides?id=${slideId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchAllSlides() // Refresh list
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Error deleting slide:', err)
      return { success: false, error: 'Network error' }
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchAllSlides()
    }
  }, [session])

  return {
    slides,
    isLoading,
    error,
    createSlide,
    updateSlide,
    deleteSlide,
    refetch: fetchAllSlides
  }
} 