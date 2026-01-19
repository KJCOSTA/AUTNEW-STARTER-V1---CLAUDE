// ============================================
// PIXABAY API - Vídeos e Imagens Gratuitos (Fallback)
// https://pixabay.com/api/docs/
// ============================================

import { isTestMode } from './api'
import { mockDelay } from './mockData'

export interface PixabayVideo {
  id: number
  pageURL: string
  type: string
  tags: string
  duration: number
  picture_id: string
  videos: {
    large: { url: string; width: number; height: number; size: number }
    medium: { url: string; width: number; height: number; size: number }
    small: { url: string; width: number; height: number; size: number }
    tiny: { url: string; width: number; height: number; size: number }
  }
  views: number
  downloads: number
  likes: number
  user: string
  userImageURL: string
}

export interface PixabayImage {
  id: number
  pageURL: string
  type: string
  tags: string
  previewURL: string
  previewWidth: number
  previewHeight: number
  webformatURL: string
  webformatWidth: number
  webformatHeight: number
  largeImageURL: string
  fullHDURL?: string
  imageURL?: string
  imageWidth: number
  imageHeight: number
  views: number
  downloads: number
  likes: number
  user: string
  userImageURL: string
}

export interface PixabaySearchResult<T> {
  total: number
  totalHits: number
  hits: T[]
}

// Mock data for test mode
const MOCK_PIXABAY_VIDEOS: PixabayVideo[] = [
  {
    id: 101,
    pageURL: 'https://pixabay.com/videos/101',
    type: 'film',
    tags: 'nature, peaceful, sky',
    duration: 18,
    picture_id: '101',
    videos: {
      large: { url: 'https://example.com/pixabay1.mp4', width: 1920, height: 1080, size: 5000000 },
      medium: { url: 'https://example.com/pixabay1m.mp4', width: 1280, height: 720, size: 2500000 },
      small: { url: 'https://example.com/pixabay1s.mp4', width: 960, height: 540, size: 1000000 },
      tiny: { url: 'https://example.com/pixabay1t.mp4', width: 640, height: 360, size: 500000 },
    },
    views: 15000,
    downloads: 8000,
    likes: 500,
    user: 'TestUser',
    userImageURL: 'https://picsum.photos/seed/user1/50/50',
  },
  {
    id: 102,
    pageURL: 'https://pixabay.com/videos/102',
    type: 'film',
    tags: 'prayer, hands, spiritual',
    duration: 25,
    picture_id: '102',
    videos: {
      large: { url: 'https://example.com/pixabay2.mp4', width: 1920, height: 1080, size: 7000000 },
      medium: { url: 'https://example.com/pixabay2m.mp4', width: 1280, height: 720, size: 3500000 },
      small: { url: 'https://example.com/pixabay2s.mp4', width: 960, height: 540, size: 1500000 },
      tiny: { url: 'https://example.com/pixabay2t.mp4', width: 640, height: 360, size: 700000 },
    },
    views: 22000,
    downloads: 12000,
    likes: 800,
    user: 'TestUser2',
    userImageURL: 'https://picsum.photos/seed/user2/50/50',
  },
]

const MOCK_PIXABAY_IMAGES: PixabayImage[] = [
  {
    id: 201,
    pageURL: 'https://pixabay.com/photos/201',
    type: 'photo',
    tags: 'nature, landscape, peaceful',
    previewURL: 'https://picsum.photos/seed/pixabayimg1/150/100',
    previewWidth: 150,
    previewHeight: 100,
    webformatURL: 'https://picsum.photos/seed/pixabayimg1/640/426',
    webformatWidth: 640,
    webformatHeight: 426,
    largeImageURL: 'https://picsum.photos/seed/pixabayimg1/1280/853',
    fullHDURL: 'https://picsum.photos/seed/pixabayimg1/1920/1280',
    imageWidth: 5000,
    imageHeight: 3333,
    views: 50000,
    downloads: 25000,
    likes: 1500,
    user: 'TestPhotographer',
    userImageURL: 'https://picsum.photos/seed/user3/50/50',
  },
]

/**
 * Search for videos on Pixabay
 * @param query Search query
 * @param category Category filter: backgrounds, fashion, nature, science, education, feelings, health, people, religion, places, animals, industry, computer, food, sports, transportation, travel, buildings, business, music
 */
export async function searchPixabayVideos(
  query: string,
  category?: string,
  perPage: number = 15
): Promise<{ videos: PixabayVideo[]; total: number; source: 'pixabay'; cost: number }> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando busca de vídeos no Pixabay:', query)
    await mockDelay(700)
    return {
      videos: MOCK_PIXABAY_VIDEOS,
      total: MOCK_PIXABAY_VIDEOS.length,
      source: 'pixabay',
      cost: 0,
    }
  }

  const apiKey = import.meta.env.VITE_PIXABAY_API_KEY
  if (!apiKey) {
    console.warn('PIXABAY_API_KEY not configured')
    return { videos: [], total: 0, source: 'pixabay', cost: 0 }
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      per_page: perPage.toString(),
      safesearch: 'true',
      video_type: 'all',
    })

    if (category) {
      params.append('category', category)
    }

    const response = await fetch(`https://pixabay.com/api/videos/?${params}`)

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`)
    }

    const data: PixabaySearchResult<PixabayVideo> = await response.json()
    return {
      videos: data.hits || [],
      total: data.totalHits,
      source: 'pixabay',
      cost: 0, // Pixabay is FREE
    }
  } catch (error) {
    console.error('Pixabay video search error:', error)
    return { videos: [], total: 0, source: 'pixabay', cost: 0 }
  }
}

/**
 * Search for images on Pixabay
 */
export async function searchPixabayImages(
  query: string,
  category?: string,
  perPage: number = 15
): Promise<{ images: PixabayImage[]; total: number; source: 'pixabay'; cost: number }> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando busca de imagens no Pixabay:', query)
    await mockDelay(600)
    return {
      images: MOCK_PIXABAY_IMAGES,
      total: MOCK_PIXABAY_IMAGES.length,
      source: 'pixabay',
      cost: 0,
    }
  }

  const apiKey = import.meta.env.VITE_PIXABAY_API_KEY
  if (!apiKey) {
    console.warn('PIXABAY_API_KEY not configured')
    return { images: [], total: 0, source: 'pixabay', cost: 0 }
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      per_page: perPage.toString(),
      safesearch: 'true',
      image_type: 'photo',
    })

    if (category) {
      params.append('category', category)
    }

    const response = await fetch(`https://pixabay.com/api/?${params}`)

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`)
    }

    const data: PixabaySearchResult<PixabayImage> = await response.json()
    return {
      images: data.hits || [],
      total: data.totalHits,
      source: 'pixabay',
      cost: 0, // Pixabay is FREE
    }
  } catch (error) {
    console.error('Pixabay image search error:', error)
    return { images: [], total: 0, source: 'pixabay', cost: 0 }
  }
}

/**
 * Get the best video URL (large preferred)
 */
export function getBestPixabayVideoUrl(video: PixabayVideo): string {
  return video.videos.large?.url || video.videos.medium?.url || video.videos.small?.url || ''
}

/**
 * Get the best image URL (fullHD preferred)
 */
export function getBestPixabayImageUrl(image: PixabayImage): string {
  return image.fullHDURL || image.largeImageURL || image.webformatURL || ''
}
