/**
 * Vercel Serverless Function — AI Backend Proxy
 * 
 * Frontend → /api/ai/chat/completions → Bu fonksiyon → AI Backend
 * 
 * ENV VARS (Vercel Dashboard'da ayarla, VITE_ prefix'siz):
 *   AI_BACKEND_URL  = AI sunucu adresi (ör: http://SENIN-VPS-IP:8045/v1)
 *   AI_API_KEY      = API anahtarı
 */

export default async function handler(req, res) {
    // Sadece POST kabul et
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const backendUrl = process.env.AI_BACKEND_URL
    const apiKey = process.env.AI_API_KEY

    if (!backendUrl) {
        return res.status(500).json({
            error: 'AI_BACKEND_URL is not configured. Set it in Vercel Environment Variables.'
        })
    }

    try {
        const response = await fetch(`${backendUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify(req.body),
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            console.error(`AI Backend error: ${response.status} ${errorText}`)
            return res.status(response.status).json({
                error: `AI backend returned ${response.status}`,
                details: errorText.substring(0, 200)
            })
        }

        const data = await response.json()
        return res.status(200).json(data)

    } catch (err) {
        console.error('AI proxy fetch error:', err.message)
        return res.status(502).json({
            error: 'Could not reach AI backend',
            message: err.message
        })
    }
}
