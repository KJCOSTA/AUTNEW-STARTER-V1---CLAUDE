import type { VercelRequest, VercelResponse } from '@vercel/node'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/youtube/callback`
    : 'http://localhost:3000/api/youtube/callback'

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Google OAuth not configured' })
  }

  // Test endpoint
  if (req.method === 'POST' && req.body?.action === 'test') {
    return res.status(200).json({ ok: true })
  }

  // Initiate OAuth flow
  if (req.method === 'GET') {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ]

    const authUrl = new URL(GOOGLE_AUTH_URL)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')

    return res.redirect(authUrl.toString())
  }

  // Exchange code for tokens
  if (req.method === 'POST' && req.body?.code) {
    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: req.body.code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return res.status(400).json({ error: error.error_description || 'Token exchange failed' })
      }

      const tokens = await response.json()

      // Get channel info
      const channelResponse = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      )

      let channelName = 'Canal Conectado'
      if (channelResponse.ok) {
        const channelData = await channelResponse.json()
        channelName = channelData.items?.[0]?.snippet?.title || channelName
      }

      return res.status(200).json({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        channelName,
      })
    } catch (error) {
      console.error('OAuth error:', error)
      return res.status(500).json({ error: 'Authentication failed' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
