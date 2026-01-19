// ============================================
// UNSPLASH API - Fotos Artísticas Gratuitas para Thumbnails
// https://unsplash.com/developers
// ============================================

import { isTestMode } from './api'
import { mockDelay } from './mockData'

export interface UnsplashPhoto {
  id: string
  width: number
  height: number
  color: string
  blur_hash: string
  description: string | null
  alt_description: string | null
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  links: {
    self: string
    html: string
    download: string
    download_location: string
  }
  user: {
    id: string
    username: string
    name: string
    portfolio_url: string | null
  }
}

export interface UnsplashSearchResult {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

// Mock data for test mode
const MOCK_UNSPLASH_PHOTOS: UnsplashPhoto[] = [
  {
    id: 'unsplash1',
    width: 4000,
    height: 2667,
    color: '#f5d5c8',
    blur_hash: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.',
    description: 'Peaceful sunset over mountains',
    alt_description: 'golden hour photography of mountains',
    urls: {
      raw: 'https://picsum.photos/seed/unsplash1/4000/2667',
      full: 'https://picsum.photos/seed/unsplash1/4000/2667',
      regular: 'https://picsum.photos/seed/unsplash1/1080/720',
      small: 'https://picsum.photos/seed/unsplash1/400/267',
      thumb: 'https://picsum.photos/seed/unsplash1/200/133',
    },
    links: {
      self: 'https://api.unsplash.com/photos/unsplash1',
      html: 'https://unsplash.com/photos/unsplash1',
      download: 'https://unsplash.com/photos/unsplash1/download',
      download_location: 'https://api.unsplash.com/photos/unsplash1/download',
    },
    user: {
      id: 'user1',
      username: 'testuser',
      name: 'Test User',
      portfolio_url: null,
    },
  },
  {
    id: 'unsplash2',
    width: 5000,
    height: 3333,
    color: '#262626',
    blur_hash: 'L02rs+WB00of~qofj[j[00j[Rjay',
    description: 'Hands in prayer position',
    alt_description: 'person with hands clasped in prayer',
    urls: {
      raw: 'https://picsum.photos/seed/unsplash2/5000/3333',
      full: 'https://picsum.photos/seed/unsplash2/5000/3333',
      regular: 'https://picsum.photos/seed/unsplash2/1080/720',
      small: 'https://picsum.photos/seed/unsplash2/400/267',
      thumb: 'https://picsum.photos/seed/unsplash2/200/133',
    },
    links: {
      self: 'https://api.unsplash.com/photos/unsplash2',
      html: 'https://unsplash.com/photos/unsplash2',
      download: 'https://unsplash.com/photos/unsplash2/download',
      download_location: 'https://api.unsplash.com/photos/unsplash2/download',
    },
    user: {
      id: 'user2',
      username: 'photographer2',
      name: 'Photographer Two',
      portfolio_url: null,
    },
  },
  {
    id: 'unsplash3',
    width: 4500,
    height: 3000,
    color: '#d9c8a5',
    blur_hash: 'LKO2?V%2Tw=w]~RBVZRi};RPxuwH',
    description: 'Open Bible with warm light',
    alt_description: 'open book on brown wooden table',
    urls: {
      raw: 'https://picsum.photos/seed/unsplash3/4500/3000',
      full: 'https://picsum.photos/seed/unsplash3/4500/3000',
      regular: 'https://picsum.photos/seed/unsplash3/1080/720',
      small: 'https://picsum.photos/seed/unsplash3/400/267',
      thumb: 'https://picsum.photos/seed/unsplash3/200/133',
    },
    links: {
      self: 'https://api.unsplash.com/photos/unsplash3',
      html: 'https://unsplash.com/photos/unsplash3',
      download: 'https://unsplash.com/photos/unsplash3/download',
      download_location: 'https://api.unsplash.com/photos/unsplash3/download',
    },
    user: {
      id: 'user3',
      username: 'spiritualshots',
      name: 'Spiritual Shots',
      portfolio_url: null,
    },
  },
]

/**
 * Search for photos on Unsplash
 * @param query Search query (e.g., "prayer", "peaceful nature", "hope")
 * @param orientation Photo orientation: 'landscape' | 'portrait' | 'squarish'
 * @param perPage Number of results per page (max 30)
 */
export async function searchUnsplashPhotos(
  query: string,
  orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape',
  perPage: number = 15
): Promise<{ photos: UnsplashPhoto[]; total: number; source: 'unsplash'; cost: number }> {
  if (isTestMode()) {
    console.log('[TEST MODE] Simulando busca de fotos no Unsplash:', query)
    await mockDelay(600)
    return {
      photos: MOCK_UNSPLASH_PHOTOS,
      total: MOCK_UNSPLASH_PHOTOS.length,
      source: 'unsplash',
      cost: 0,
    }
  }

  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    console.warn('UNSPLASH_ACCESS_KEY not configured')
    return { photos: [], total: 0, source: 'unsplash', cost: 0 }
  }

  try {
    const params = new URLSearchParams({
      query,
      orientation,
      per_page: perPage.toString(),
    })

    const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data: UnsplashSearchResult = await response.json()
    return {
      photos: data.results || [],
      total: data.total,
      source: 'unsplash',
      cost: 0, // Unsplash is FREE
    }
  } catch (error) {
    console.error('Unsplash search error:', error)
    return { photos: [], total: 0, source: 'unsplash', cost: 0 }
  }
}

/**
 * Track download (required by Unsplash API guidelines)
 */
export async function trackUnsplashDownload(downloadLocation: string): Promise<void> {
  if (isTestMode()) return

  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
  if (!accessKey) return

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    })
  } catch (error) {
    console.error('Unsplash download tracking error:', error)
  }
}

/**
 * Get the best photo URL for thumbnails (regular size is 1080px)
 */
export function getBestUnsplashUrl(photo: UnsplashPhoto, size: 'full' | 'regular' | 'small' = 'regular'): string {
  return photo.urls[size] || photo.urls.regular
}

/**
 * Get attribution text for Unsplash (required by guidelines)
 */
export function getUnsplashAttribution(photo: UnsplashPhoto): string {
  return `Photo by ${photo.user.name} on Unsplash`
}
