"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'

export interface HeroSlide {
  id?: string
  _id?: string
  mainText: string
  subText: string
  image: string
  order: number
  isActive?: boolean
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    // Remove cache busting and no-cache headers for better performance
    headers: {
      'Accept': 'application/json',
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch slides')
  }
  
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch slides')
  }
  
  return data.slides
}

export function useHeroSlides() {
  // Use SWR for optimized data fetching with caching
  const { data: slides, error, isLoading, mutate } = useSWR<HeroSlide[]>(
    '/api/hero-slides',
    fetcher,
    {
      // Optimization settings for better performance
      revalidateOnFocus: false,          // Don't refetch when window regains focus
      revalidateOnReconnect: true,       // Refetch when reconnecting to internet
      refreshInterval: 300000,           // Refresh every 5 minutes (300 seconds)
      dedupingInterval: 60000,           // Dedupe requests within 1 minute
      errorRetryInterval: 5000,          // Retry failed requests after 5 seconds
      errorRetryCount: 3,                // Maximum 3 retry attempts
      loadingTimeout: 10000,             // 10 second timeout for requests
      
      // Optimistic updates and better UX
      fallbackData: [],                  // Show empty array while loading
      keepPreviousData: true,            // Keep previous data while revalidating
      
      // Error handling
      onError: (error) => {
        console.error('Hero slides fetch error:', error)
      },
      
      // Success callback for debugging (only in development)
      onSuccess: (data) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Hero slides loaded successfully:', data?.length, 'slides')
        }
      }
    }
  )

  return {
    slides: slides || [],
    isLoading,
    error: error?.message || null,
    refetch: mutate  // SWR's mutate function for manual refetch
  }
}

// Admin fetcher function
const adminFetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch admin slides')
  }
  
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch admin slides')
  }
  
  return data.slides
}

// Admin hook for managing all slides
export function useAdminHeroSlides() {
  const { data: session } = useSession()
  
  // Use SWR for admin slides with different caching strategy
  const { data: slides, error, isLoading, mutate } = useSWR<HeroSlide[]>(
    // Only fetch if user is authenticated
    session?.user ? '/api/admin/hero-slides' : null,
    adminFetcher,
    {
      // Admin needs fresh data more often
      revalidateOnFocus: true,           // Refetch when window regains focus
      revalidateOnReconnect: true,       // Refetch when reconnecting
      refreshInterval: 60000,            // Refresh every minute for admin
      dedupingInterval: 5000,            // Shorter deduping for admin operations
      errorRetryInterval: 3000,          // Faster retry for admin
      errorRetryCount: 2,                // Fewer retries for admin
      
      // No fallback data for admin - show loading state
      keepPreviousData: false,           // Don't keep previous data for admin
      
      onError: (error) => {
        console.error('Admin hero slides fetch error:', error)
      }
    }
  )

  // Keep the fetchAllSlides function for backward compatibility
  const fetchAllSlides = async () => {
    await mutate()  // Use SWR's mutate to refetch
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
        await mutate() // Use SWR mutate to refresh list
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
        await mutate() // Use SWR mutate to refresh list
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
        await mutate() // Use SWR mutate to refresh list
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Error deleting slide:', err)
      return { success: false, error: 'Network error' }
    }
  }

  return {
    slides: slides || [],
    isLoading,
    error: error?.message || null,
    createSlide,
    updateSlide,
    deleteSlide,
    refetch: fetchAllSlides
  }
} 