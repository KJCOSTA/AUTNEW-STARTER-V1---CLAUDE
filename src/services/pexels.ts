// ============================================
// PEXELS API - Vídeos e Fotos Gratuitos
// https://www.pexels.com/api/
// ============================================

import { isTestMode } from './api'
import { mockDelay } from './mockData'

export interface PexelsVideo {
  id: number
  width: number
  height: number
  duration: number
  url: string
  image: string // preview thumbnail
  video_files: {
    id: number
    quality: string
    file_type: string
    width: number
    height: number
    link: string
  }[]
}

export interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
  }
}

export interface PexelsSearchResult {
  videos?: PexelsVideo[]
  photos?: PexelsPhoto[]
  total_results: number
  page: number
  per_page: number
}

// Mock data for test mode
const MOCK_PEXELS_VIDEOS: PexelsVideo[] = [
  {
    id: 1,
    width: 1920,
    height: 1080,
    duration: 15,
    url: 'https://www.pexels.com/video/1',
    image: 'https://picsum.photos/seed/pexels1/400/225',
    video_files: [
      { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://example.com/video1.mp4' }
    ]
  },
  {
    id: 2,
    width: 1920,
    height: 1080,
    duration: 20,
    url: 'https://www.pexels.com/video/2',
    image: 'https://picsum.photos/seed/pexels2/400/225',
    video_files: [
      { id: 2, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://example.com/video2.mp4' }
    ]
  },
  {
    id: 3,
    width: 1920,
    height: 1080,
    duration: 12,
    url: 'https://www.pexels.com/video/3',
    image: 'https://picsum.photos/seed/pexels3/400/225',
    video_files: [
      { id: 3, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://example.com/video3.mp4' }
    ]
  },
]

const MOCK_PEXELS_PHOTOS: PexelsPhoto[] = [
  {
    id: 1,
    width: 1920,
    height: 1280,
    url: 'https://www.pexels.com/photo/1',
    photographer: 'Test Photographer',
    src: {
      original: 'https://picsum.photos/seed/pexelsphoto1/1920/1280',
      large2x: 'https://picsum.photos/seed/pexelsphoto1/1920/1280',
      large: 'https://picsum.photos/seed/pexelsphoto1/940/627',
      medium: 'https://picsum.photos/seed/pexelsphoto1/350/233',
      small: 'https://picsum.photos/seed/pexelsphoto1/130/87',
    }
  },
]

/**
 * Search for videos on Pexels
 * @param query Search query (e.g., "peaceful nature", "praying hands")
 * @param orientation Video orientation: 'landscape' | 'portrait' | 'square'
 * @param size Minimum size: 'large' | 'medium' | 'small'
 * @param perPage Number of results per page (max 80)
 */
export async function searchPexelsVideos(
  query: string,
  orientation: 'landscape' | 'portrait' | 'square' = 'landscape',
  perPage: number = 15
): Promise<{ videos: PexelsVideo[]; total: number; source: 'pexels'; cost: number }> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando busca de vídeos no Pexels:', query)
    await mockDelay(800)
    return {
      videos: MOCK_PEXELS_VIDEOS,
      total: MOCK_PEXELS_VIDEOS.length,
      source: 'pexels',
      cost: 0,
    }
  }

  const apiKey = import.meta.env.VITE_PEXELS_API_KEY
  if (!apiKey) {
    console.warn('PEXELS_API_KEY not configured')
    return { videos: [], total: 0, source: 'pexels', cost: 0 }
  }

  try {
    const params = new URLSearchParams({
      query,
      orientation,
      per_page: perPage.toString(),
    })

    const response = await fetch(`https://api.pexels.com/videos/search?${params}`, {
      headers: {
        Authorization: apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data: PexelsSearchResult = await response.json()
    return {
      videos: data.videos || [],
      total: data.total_results,
      source: 'pexels',
      cost: 0, // Pexels is FREE
    }
  } catch (error) {
    console.error('Pexels search error:', error)
    return { videos: [], total: 0, source: 'pexels', cost: 0 }
  }
}

/**
 * Search for photos on Pexels
 */
export async function searchPexelsPhotos(
  query: string,
  orientation: 'landscape' | 'portrait' | 'square' = 'landscape',
  perPage: number = 15
): Promise<{ photos: PexelsPhoto[]; total: number; source: 'pexels'; cost: number }> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando busca de fotos no Pexels:', query)
    await mockDelay(600)
    return {
      photos: MOCK_PEXELS_PHOTOS,
      total: MOCK_PEXELS_PHOTOS.length,
      source: 'pexels',
      cost: 0,
    }
  }

  const apiKey = import.meta.env.VITE_PEXELS_API_KEY
  if (!apiKey) {
    console.warn('PEXELS_API_KEY not configured')
    return { photos: [], total: 0, source: 'pexels', cost: 0 }
  }

  try {
    const params = new URLSearchParams({
      query,
      orientation,
      per_page: perPage.toString(),
    })

    const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: {
        Authorization: apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data: PexelsSearchResult = await response.json()
    return {
      photos: data.photos || [],
      total: data.total_results,
      source: 'pexels',
      cost: 0, // Pexels is FREE
    }
  } catch (error) {
    console.error('Pexels photo search error:', error)
    return { photos: [], total: 0, source: 'pexels', cost: 0 }
  }
}

/**
 * Get the best video file URL (HD preferred)
 */
export function getBestVideoUrl(video: PexelsVideo): string {
  const hdFile = video.video_files.find(f => f.quality === 'hd' && f.width >= 1920)
  const sdFile = video.video_files.find(f => f.quality === 'sd' && f.width >= 1280)
  return hdFile?.link || sdFile?.link || video.video_files[0]?.link || ''
}
