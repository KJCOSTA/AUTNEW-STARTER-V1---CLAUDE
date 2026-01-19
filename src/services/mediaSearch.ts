// ============================================
// MOTOR HÍBRIDO DE ECONOMIA INTELIGENTE
// Orquestrador que busca recursos gratuitos primeiro
// ============================================

import { searchPexelsVideos, searchPexelsPhotos, getBestVideoUrl, type PexelsVideo, type PexelsPhoto } from './pexels'
import { searchPixabayVideos, searchPixabayImages, getBestPixabayVideoUrl, getBestPixabayImageUrl, type PixabayVideo, type PixabayImage } from './pixabay'
import { searchUnsplashPhotos, getBestUnsplashUrl, type UnsplashPhoto } from './unsplash'
import { generateEdgeTTS, getRecommendedVoice } from './edgeTts'
import { generateThumbnail, generateNarration } from './api'

// ============================================
// TYPES
// ============================================

export type MediaSource = 'pexels' | 'pixabay' | 'unsplash' | 'dalle' | 'runway' | 'edge-tts' | 'elevenlabs' | 'manual'

export interface MediaResult {
  found: boolean
  source: MediaSource
  cost: number
  url?: string
  thumbnailUrl?: string
  duration?: number
  attribution?: string
  metadata?: Record<string, unknown>
}

export interface SceneMediaOptions {
  query: string
  duration?: number
  allowPaidAI?: boolean // Allow expensive AI generation as fallback
  preferVideo?: boolean // Prefer video over static image
}

export interface ThumbnailOptions {
  query: string
  style?: 'photo' | 'artistic' | 'generated'
  allowPaidAI?: boolean
}

export interface NarrationOptions {
  text: string
  voice?: 'female' | 'male'
  premium?: boolean // Use ElevenLabs instead of Edge TTS
}

export interface CostBreakdown {
  scenes: { source: MediaSource; cost: number; query: string }[]
  narration: { source: MediaSource; cost: number }
  thumbnail: { source: MediaSource; cost: number }
  rendering: { source: string; cost: number }
  total: number
}

// Cost constants
export const COSTS = {
  pexels: 0,
  pixabay: 0,
  unsplash: 0,
  'dalle-standard': 0.04,
  'dalle-hd': 0.08,
  runway: 3.00, // Per ~5 second clip
  'edge-tts': 0,
  'elevenlabs-turbo': 0.02, // per 1000 chars
  'elevenlabs-multilingual': 0.05, // per 1000 chars
  json2video: 0.40, // per minute
}

// ============================================
// SCENE VIDEO/IMAGE SEARCH (Hierarchy)
// ============================================

/**
 * Find the best media for a scene using intelligent hierarchy
 * 1. Pexels (free, best quality)
 * 2. Pixabay (free, fallback)
 * 3. DALL-E image (cheap, $0.04)
 * 4. Runway video (expensive, $3.00) - only if allowed
 */
export async function findSceneMedia(options: SceneMediaOptions): Promise<MediaResult> {
  const { query, allowPaidAI = false, preferVideo = true } = options

  console.log(`[HYBRID ENGINE] Searching for: "${query}"`)

  // 1. Try Pexels first (FREE, high quality)
  if (preferVideo) {
    const pexelsResult = await searchPexelsVideos(query)
    if (pexelsResult.videos.length > 0) {
      const video = pexelsResult.videos[0]
      console.log(`[HYBRID ENGINE] ✓ Found on Pexels (FREE)`)
      return {
        found: true,
        source: 'pexels',
        cost: 0,
        url: getBestVideoUrl(video),
        thumbnailUrl: video.image,
        duration: video.duration,
        metadata: { videoId: video.id },
      }
    }
  }

  // Try Pexels photos
  const pexelsPhotos = await searchPexelsPhotos(query)
  if (pexelsPhotos.photos.length > 0) {
    const photo = pexelsPhotos.photos[0]
    console.log(`[HYBRID ENGINE] ✓ Found photo on Pexels (FREE)`)
    return {
      found: true,
      source: 'pexels',
      cost: 0,
      url: photo.src.large2x,
      thumbnailUrl: photo.src.medium,
      attribution: `Photo by ${photo.photographer} on Pexels`,
      metadata: { photoId: photo.id },
    }
  }

  // 2. Try Pixabay (FREE, fallback)
  if (preferVideo) {
    const pixabayResult = await searchPixabayVideos(query)
    if (pixabayResult.videos.length > 0) {
      const video = pixabayResult.videos[0]
      console.log(`[HYBRID ENGINE] ✓ Found on Pixabay (FREE)`)
      return {
        found: true,
        source: 'pixabay',
        cost: 0,
        url: getBestPixabayVideoUrl(video),
        thumbnailUrl: `https://i.vimeocdn.com/video/${video.picture_id}_640x360.jpg`,
        duration: video.duration,
        attribution: `Video by ${video.user} on Pixabay`,
        metadata: { videoId: video.id },
      }
    }
  }

  // Try Pixabay images
  const pixabayImages = await searchPixabayImages(query)
  if (pixabayImages.images.length > 0) {
    const image = pixabayImages.images[0]
    console.log(`[HYBRID ENGINE] ✓ Found image on Pixabay (FREE)`)
    return {
      found: true,
      source: 'pixabay',
      cost: 0,
      url: getBestPixabayImageUrl(image),
      thumbnailUrl: image.previewURL,
      attribution: `Image by ${image.user} on Pixabay`,
      metadata: { imageId: image.id },
    }
  }

  // 3. Generate with DALL-E (cheap, $0.04)
  if (allowPaidAI) {
    try {
      console.log(`[HYBRID ENGINE] Generating with DALL-E ($0.04)`)
      const imageUrl = await generateThumbnail(query + ', cinematic, 16:9 aspect ratio')
      return {
        found: true,
        source: 'dalle',
        cost: COSTS['dalle-standard'],
        url: imageUrl,
        thumbnailUrl: imageUrl,
        metadata: { prompt: query },
      }
    } catch (error) {
      console.error('[HYBRID ENGINE] DALL-E generation failed:', error)
    }
  }

  // 4. Return "needs AI" if no free options found and AI not allowed
  console.log(`[HYBRID ENGINE] ✗ No free media found for: "${query}"`)
  return {
    found: false,
    source: 'manual',
    cost: 0,
    metadata: { query, suggestion: 'Try a different search term or enable AI generation' },
  }
}

/**
 * Search all free sources in parallel and return combined results
 */
export async function searchAllFreeSources(query: string): Promise<{
  pexelsVideos: PexelsVideo[]
  pexelsPhotos: PexelsPhoto[]
  pixabayVideos: PixabayVideo[]
  pixabayImages: PixabayImage[]
  unsplashPhotos: UnsplashPhoto[]
  totalFree: number
}> {
  console.log(`[HYBRID ENGINE] Searching all free sources for: "${query}"`)

  const [pexelsVideos, pexelsPhotos, pixabayVideos, pixabayImages, unsplashPhotos] = await Promise.all([
    searchPexelsVideos(query),
    searchPexelsPhotos(query),
    searchPixabayVideos(query),
    searchPixabayImages(query),
    searchUnsplashPhotos(query),
  ])

  const totalFree =
    pexelsVideos.videos.length +
    pexelsPhotos.photos.length +
    pixabayVideos.videos.length +
    pixabayImages.images.length +
    unsplashPhotos.photos.length

  console.log(`[HYBRID ENGINE] Found ${totalFree} free media items`)

  return {
    pexelsVideos: pexelsVideos.videos,
    pexelsPhotos: pexelsPhotos.photos,
    pixabayVideos: pixabayVideos.videos,
    pixabayImages: pixabayImages.images,
    unsplashPhotos: unsplashPhotos.photos,
    totalFree,
  }
}

// ============================================
// THUMBNAIL SEARCH (Hierarchy)
// ============================================

/**
 * Find the best image for a thumbnail
 * 1. Unsplash (free, artistic quality)
 * 2. Pexels photos (free)
 * 3. DALL-E (paid, $0.04-$0.08)
 */
export async function findThumbnailBase(options: ThumbnailOptions): Promise<MediaResult> {
  const { query, allowPaidAI = true } = options

  console.log(`[HYBRID ENGINE] Searching thumbnail for: "${query}"`)

  // 1. Try Unsplash first (FREE, artistic quality)
  const unsplashResult = await searchUnsplashPhotos(query, 'landscape')
  if (unsplashResult.photos.length > 0) {
    const photo = unsplashResult.photos[0]
    console.log(`[HYBRID ENGINE] ✓ Found thumbnail on Unsplash (FREE)`)
    return {
      found: true,
      source: 'unsplash',
      cost: 0,
      url: getBestUnsplashUrl(photo, 'regular'),
      thumbnailUrl: photo.urls.small,
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      metadata: { photoId: photo.id, downloadLocation: photo.links.download_location },
    }
  }

  // 2. Try Pexels photos (FREE)
  const pexelsResult = await searchPexelsPhotos(query, 'landscape')
  if (pexelsResult.photos.length > 0) {
    const photo = pexelsResult.photos[0]
    console.log(`[HYBRID ENGINE] ✓ Found thumbnail on Pexels (FREE)`)
    return {
      found: true,
      source: 'pexels',
      cost: 0,
      url: photo.src.large2x,
      thumbnailUrl: photo.src.medium,
      attribution: `Photo by ${photo.photographer} on Pexels`,
      metadata: { photoId: photo.id },
    }
  }

  // 3. Generate with DALL-E
  if (allowPaidAI) {
    try {
      console.log(`[HYBRID ENGINE] Generating thumbnail with DALL-E ($0.04)`)
      const imageUrl = await generateThumbnail(query + ', YouTube thumbnail style, vibrant colors, high contrast')
      return {
        found: true,
        source: 'dalle',
        cost: COSTS['dalle-standard'],
        url: imageUrl,
        thumbnailUrl: imageUrl,
        metadata: { prompt: query },
      }
    } catch (error) {
      console.error('[HYBRID ENGINE] DALL-E generation failed:', error)
    }
  }

  return {
    found: false,
    source: 'manual',
    cost: 0,
    metadata: { query },
  }
}

// ============================================
// NARRATION (Hierarchy)
// ============================================

/**
 * Generate narration using the cheapest option first
 * 1. Edge TTS (free, good quality)
 * 2. ElevenLabs (premium, best quality)
 */
export async function generateSmartNarration(options: NarrationOptions): Promise<{
  audioUrl: string
  source: MediaSource
  cost: number
  duration: number
}> {
  const { text, voice = 'female', premium = false } = options

  if (!premium) {
    // Use Edge TTS (FREE)
    console.log(`[HYBRID ENGINE] Generating narration with Edge TTS (FREE)`)
    const edgeVoice = getRecommendedVoice(voice)
    const result = await generateEdgeTTS(text, { voice: edgeVoice })
    return {
      audioUrl: result.audioUrl,
      source: 'edge-tts',
      cost: 0,
      duration: result.duration,
    }
  } else {
    // Use ElevenLabs (PREMIUM)
    console.log(`[HYBRID ENGINE] Generating narration with ElevenLabs (PREMIUM)`)
    const audioUrl = await generateNarration(text)
    const charCount = text.length
    const cost = (charCount / 1000) * COSTS['elevenlabs-multilingual']
    return {
      audioUrl,
      source: 'elevenlabs',
      cost: parseFloat(cost.toFixed(2)),
      duration: Math.ceil(charCount / 15), // ~15 chars per second
    }
  }
}

// ============================================
// COST CALCULATOR
// ============================================

/**
 * Calculate total cost breakdown for a video
 */
export function calculateCostBreakdown(
  scenes: { source: MediaSource; cost: number; query: string }[],
  narration: { source: MediaSource; cost: number },
  thumbnail: { source: MediaSource; cost: number },
  videoDurationMinutes: number = 6
): CostBreakdown {
  const renderingCost = videoDurationMinutes * COSTS.json2video

  const total =
    scenes.reduce((sum, s) => sum + s.cost, 0) +
    narration.cost +
    thumbnail.cost +
    renderingCost

  return {
    scenes,
    narration,
    thumbnail,
    rendering: { source: 'json2video', cost: parseFloat(renderingCost.toFixed(2)) },
    total: parseFloat(total.toFixed(2)),
  }
}

/**
 * Calculate potential savings compared to all-AI approach
 */
export function calculateSavings(costBreakdown: CostBreakdown, sceneCount: number): {
  currentCost: number
  allAICost: number
  savings: number
  savingsPercent: number
} {
  // All-AI approach costs
  const allAIScenesCost = sceneCount * COSTS.runway // $3 per scene
  const allAINarrationCost = 5.00 // ~$5 for 10 min narration on ElevenLabs
  const allAIThumbnailCost = COSTS['dalle-hd']
  const allAIRenderingCost = costBreakdown.rendering.cost

  const allAICost = allAIScenesCost + allAINarrationCost + allAIThumbnailCost + allAIRenderingCost
  const savings = allAICost - costBreakdown.total

  return {
    currentCost: costBreakdown.total,
    allAICost: parseFloat(allAICost.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
    savingsPercent: Math.round((savings / allAICost) * 100),
  }
}

// ============================================
// OPTIMIZATION
// ============================================

/**
 * Optimize costs by replacing paid options with free alternatives
 */
export async function optimizeSceneCosts(
  scenes: { query: string; currentSource: MediaSource; currentCost: number }[]
): Promise<{
  optimizedScenes: { query: string; source: MediaSource; cost: number; url?: string }[]
  totalSaved: number
}> {
  console.log(`[HYBRID ENGINE] Optimizing ${scenes.length} scenes...`)

  const optimizedScenes = []
  let totalSaved = 0

  for (const scene of scenes) {
    if (scene.currentCost > 0) {
      // Try to find free alternative
      const freeResult = await findSceneMedia({
        query: scene.query,
        allowPaidAI: false,
      })

      if (freeResult.found && freeResult.cost === 0) {
        totalSaved += scene.currentCost
        optimizedScenes.push({
          query: scene.query,
          source: freeResult.source,
          cost: 0,
          url: freeResult.url,
        })
        console.log(`[HYBRID ENGINE] ✓ Replaced paid scene with free: "${scene.query}"`)
      } else {
        optimizedScenes.push({
          query: scene.query,
          source: scene.currentSource,
          cost: scene.currentCost,
        })
      }
    } else {
      optimizedScenes.push({
        query: scene.query,
        source: scene.currentSource,
        cost: scene.currentCost,
      })
    }
  }

  console.log(`[HYBRID ENGINE] Optimization complete. Saved: $${totalSaved.toFixed(2)}`)

  return {
    optimizedScenes,
    totalSaved: parseFloat(totalSaved.toFixed(2)),
  }
}
