/**
 * AI Proxy Utility
 * 
 * ROUTING:
 * - Dev  (npm run dev):  Vite proxy /api/ai → localhost:8045/v1
 * - Prod (Vercel):       Serverless fn /api/ai/chat/completions → AI_BACKEND_URL
 * 
 * API key ASLA frontend'e gömülmez. Her iki modda da sunucu tarafında kalır.
 */
import i18next from 'i18next'

const AI_API_BASE = '/api/ai'

// Bizim ürün kataloğumuz — AI sadece bunlardan önerecek
const CATALOG = {
    tr: `
ÜRÜN KATALOĞUMUZ (SADECE bunlardan öneri yap, dışına çıkma):
1. Kadife Bordo — Ağır, lüks kadife, koyu kırmızı, ₺450/m
2. İpek Krem — Hafif, parlak ipek, krem rengi, ₺680/m
3. Keten Lacivert — Orta ağırlık, doğal keten, lacivert, ₺320/m
4. Pamuk Gri — Orta ağırlık, günlük pamuk, gri, ₺220/m
5. Blackout Siyah — Ağır, karartma, siyah, ₺380/m
6. Tül Beyaz — Çok hafif, şeffaf tül, beyaz, ₺150/m
7. Jakar Altın — Ağır, desenli jakar, altın sarısı, ₺550/m
8. Kadife Zümrüt — Ağır, lüks kadife, zümrüt yeşili, ₺470/m`.trim(),

    en: `
OUR PRODUCT CATALOG (ONLY suggest from these, do NOT go outside):
1. Velvet Burgundy — Heavy, luxury velvet, dark red, ₺450/m
2. Silk Cream — Light, shiny silk, cream, ₺680/m
3. Linen Navy — Medium weight, natural linen, navy blue, ₺320/m
4. Cotton Gray — Medium weight, everyday cotton, gray, ₺220/m
5. Blackout Black — Heavy, blackout, black, ₺380/m
6. Tulle White — Very light, sheer tulle, white, ₺150/m
7. Jacquard Gold — Heavy, patterned jacquard, gold, ₺550/m
8. Velvet Emerald — Heavy, luxury velvet, emerald green, ₺470/m`.trim(),
}

const SYSTEM_PROMPTS = {
    tr: (catalog) => `Sen Perdemo markasının perde ve iç mekan uzmanısın. Türkçe yanıt ver, kısa ve net ol.

${catalog}

KRİTİK KURAL: Sadece yukarıdaki 8 ürünümüzden öneri yap. Katalogumuzda olmayan ürün ÖNERİLMEZ.`,

    en: (catalog) => `You are Perdemo brand's curtain and interior design expert. Reply in English, be concise and clear.

${catalog}

CRITICAL RULE: Only suggest from our 8 products above. Products outside our catalog MUST NOT be suggested.`,
}

/** Returns current language key ('tr' or 'en') */
function getLang() {
    const lang = i18next.language || 'tr'
    return lang.startsWith('en') ? 'en' : 'tr'
}

/** Builds the system prompt for the current language */
function getSystemPrompt() {
    const lang = getLang()
    return SYSTEM_PROMPTS[lang](CATALOG[lang])
}

/**
 * AI API'ye istek atar.
 * Dev: Vite proxy → localhost:8045/v1
 * Prod: Vercel serverless fn → AI_BACKEND_URL
 * Her iki modda da auth sunucu tarafında eklenir.
 */
export async function queryAI(prompt, options = {}) {
    const { maxTokens = 1500, temperature = 0.7 } = options

    try {
        const response = await fetch(AI_API_BASE + '/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: options.model || 'gemini-3-flash',
                messages: [
                    { role: 'system', content: getSystemPrompt() },
                    { role: 'user', content: prompt },
                ],
                max_tokens: maxTokens,
                temperature,
            }),
        })

        if (!response.ok) {
            console.warn('AI API error:', response.status, await response.text().catch(() => ''))
            return null
        }

        const data = await response.json()
        return data.choices?.[0]?.message?.content || null
    } catch (err) {
        console.warn('AI connection error:', err.message)
        return null
    }
}

/**
 * Renk analizinden kumaş önerisi iste / Color match suggestion
 */
export async function getColorMatchSuggestion(dominantColors, roomType = 'salon') {
    const colorStr = dominantColors.map(c => c.hex).join(', ')
    const lang = getLang()
    const prompts = {
        tr: `Oda tipi: ${roomType}. Baskın duvar renkleri: ${colorStr}. ` +
            `KATALOĞUMUZDAKİ ürünlerden bu renklerle uyumlu olanları öner. ` +
            `Maksimum 3 öneri, her öneri için: ürün adı (katalogumuzdan), neden uyumlu, hangi stille kullanılmalı.`,
        en: `Room type: ${roomType}. Dominant wall colors: ${colorStr}. ` +
            `Suggest products from OUR CATALOG that match these colors. ` +
            `Maximum 3 suggestions, for each: product name (from our catalog), why it matches, which style to use.`,
    }
    return queryAI(prompts[lang])
}

/**
 * Kumaş eşleştirme önerisi / Fabric pairing suggestion
 */
export async function getFabricPairingSuggestion(fabricName, style) {
    const lang = getLang()
    const prompts = {
        tr: `Müşteri şu kumaşı seçti: ${fabricName}. ` +
            `KATALOĞUMUZDAKİ diğer ürünlerden bu kumaşın yanına tamamlayıcı fon perde veya tül öner. ` +
            `2-3 öneri yap, her biri KATALOĞUMUZDAKİ bir ürün olmalı. Neden iyi eşleştiğini açıkla.`,
        en: `Customer selected this fabric: ${fabricName}. ` +
            `Suggest complementary curtain or tulle from OUR CATALOG to pair with this fabric. ` +
            `Make 2-3 suggestions, each must be a product from OUR CATALOG. Explain why they pair well.`,
    }
    return queryAI(prompts[lang])
}

/**
 * 3D sahne atmosfer yorumu / 3D scene atmosphere recipe
 */
export async function getAtmosphereRecipe(fabricName, backdropName, openPercent) {
    const lang = getLang()
    const timeLabels = {
        tr: { city: 'gece', garden: 'sabah', _default: 'gündüz' },
        en: { city: 'night', garden: 'morning', _default: 'daytime' },
    }
    const t = timeLabels[lang]
    const timeOfDay = t[backdropName] || t._default

    const lightDescs = {
        tr: openPercent > 60 ? 'Perde açık, bol ışık giriyor' : openPercent > 30 ? 'Perde yarı açık' : 'Perde büyük ölçüde kapalı',
        en: openPercent > 60 ? 'Curtain open, lots of light coming in' : openPercent > 30 ? 'Curtain half open' : 'Curtain mostly closed',
    }

    const prompts = {
        tr: `3D perde sahnesinde şu durum var: Kumaş: "${fabricName}", Manzara: ${backdropName} (${timeOfDay}), ${lightDescs.tr} (%${openPercent} açık). ` +
            `Bu kombinasyonun odada yaratacağı atmosferi 2-3 cümleyle açıkla. ` +
            `Işık yansıması, sıcaklık hissi ve ambiyans hakkında profesyonel bir yorum yap. Kısa ve etkileyici ol.`,
        en: `In the 3D curtain scene: Fabric: "${fabricName}", Backdrop: ${backdropName} (${timeOfDay}), ${lightDescs.en} (${openPercent}% open). ` +
            `Describe the atmosphere this combination creates in 2-3 sentences. ` +
            `Comment professionally on light reflection, warmth, and ambiance. Be brief and impactful.`,
    }
    return queryAI(prompts[lang], { maxTokens: 1500 })
}

/**
 * Smart Quote için AI tasarımcı notu / Designer note for Smart Quote
 */
export async function getDesignerNote(fabricName, windowWidth, windowHeight, style) {
    const lang = getLang()
    const prompts = {
        tr: `Müşteriye perde teklifi hazırlanıyor. Detaylar: Kumaş: "${fabricName}", Pencere: ${windowWidth}×${windowHeight}cm, Stil: ${style}. ` +
            `Bu kombinasyon için kısa ve profesyonel bir "Tasarımcı Notu" yaz. ` +
            `Mekanın ışık, ferahlık ve estetik açısından nasıl etkileneceğini anlat. ` +
            `Müşteriye güven veren, lüks bir tasarım ofisi tonu kullan. Maksimum 3 cümle.`,
        en: `A curtain quote is being prepared for the customer. Details: Fabric: "${fabricName}", Window: ${windowWidth}×${windowHeight}cm, Style: ${style}. ` +
            `Write a short, professional "Designer Note" for this combination. ` +
            `Explain how the space will be affected in terms of light, spaciousness, and aesthetics. ` +
            `Use a tone that inspires confidence, like a luxury design studio. Maximum 3 sentences.`,
    }
    return queryAI(prompts[lang], { maxTokens: 1500 })
}


/**
 * Canvas'tan dominant renk çıkar (client-side, AI gerektirmez)
 */
export function extractDominantColors(imageData, count = 5) {
    const { data, width, height } = imageData
    const colorMap = {}
    const step = 4 // her 4. pikseli örnekle (perf)

    for (let i = 0; i < data.length; i += 4 * step) {
        // Quantize: 32'lik bloklar
        const r = Math.round(data[i] / 32) * 32
        const g = Math.round(data[i + 1] / 32) * 32
        const b = Math.round(data[i + 2] / 32) * 32
        const key = `${r},${g},${b}`
        colorMap[key] = (colorMap[key] || 0) + 1
    }

    return Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([key, count]) => {
            const [r, g, b] = key.split(',').map(Number)
            return {
                hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
                rgb: { r, g, b },
                frequency: count,
            }
        })
}

/**
 * Fire ve maliyet hesaplama (saf matematik)
 */
export function calculateFabricCost({
    windowWidth,    // cm
    windowHeight,   // cm
    fabricWidth,    // cm (kumaş rulosu eni, genellikle 280 veya 300)
    gatherRatio,    // 1.5, 2.0, veya 2.5
    pricePerMeter,  // TL/metretül
    hemAllowance = 15,   // cm (alt+üst dikiş payı)
    sideAllowance = 5,   // cm (yan dikiş payı)
}) {
    // Gereken kumaş genişliği (büzgü dahil)
    const requiredWidth = (windowWidth + sideAllowance * 2) * gatherRatio
    // Kaç panel kesilecek
    const panelCount = Math.ceil(requiredWidth / fabricWidth)
    // Her panelin boyu
    const panelHeight = (windowHeight + hemAllowance * 2) / 100 // metreye çevir
    // Toplam metretül
    const totalMeters = panelCount * panelHeight
    // Fire = kesilen toplam kare - kullanılan kare
    const usedWidth = requiredWidth / 100
    const cutWidth = (panelCount * fabricWidth) / 100
    const fireWidth = cutWidth - usedWidth
    const fireCm = Math.round(fireWidth * 100)

    return {
        panelCount,
        panelHeight: Math.round(panelHeight * 100) / 100,
        totalMeters: Math.round(totalMeters * 100) / 100,
        fireCm,
        firePercent: Math.round((fireCm / (cutWidth * 100)) * 100),
        totalCost: Math.round(totalMeters * pricePerMeter * 100) / 100,
        breakdown: {
            requiredWidthCm: Math.round(requiredWidth),
            fabricWidthCm: fabricWidth,
            heightWithAllowanceCm: windowHeight + hemAllowance * 2,
        }
    }
}
