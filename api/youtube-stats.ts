export default async function handler(req, res) {
  try {
    // Validate authentication token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.warn('[YOUTUBE API] No authentication token provided');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token required'
      });
    }

    // 1. ATTEMPT REAL YOUTUBE API CONNECTION
    if (process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${process.env.YOUTUBE_CHANNEL_ID}&key=${process.env.YOUTUBE_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`YouTube API responded with status ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          console.error('[YOUTUBE API ERROR]', data.error);
          throw new Error(data.error.message || 'YouTube API error');
        }

        if (data.items && data.items[0]) {
          console.log('[YOUTUBE API] Real data fetched successfully');
          return res.status(200).json({
            ...data.items[0],
            _source: 'youtube_api',
            _cached: false
          });
        }
      } catch (err) {
        console.error('[YOUTUBE API] Failed to fetch real data:', err.message);
        // Fall through to fallback
      }
    } else {
      console.warn('[YOUTUBE API] Missing YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID - using fallback');
    }

    // 2. FALLBACK DATA (when API unavailable or fails)
    console.log('⚠️ [YOUTUBE API] Serving fallback data');
    return res.status(200).json({
      id: 'mock-channel-id',
      snippet: {
        title: 'Canal Demo (Modo Seguro)',
        description: 'YouTube API keys not configured. This is demo data.',
        thumbnails: {
          default: { url: 'https://placehold.co/100x100' },
          medium: { url: 'https://placehold.co/240x240' },
          high: { url: 'https://placehold.co/800x800' }
        }
      },
      statistics: {
        viewCount: '15430',
        subscriberCount: '1250',
        videoCount: '45'
      },
      _source: 'fallback',
      _warning: 'Using mock data - configure YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID for real stats'
    });

  } catch (error) {
    console.error('[YOUTUBE API] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch YouTube statistics',
      statistics: {
        viewCount: '0',
        subscriberCount: '0',
        videoCount: '0'
      },
      _source: 'error_fallback'
    });
  }
}
