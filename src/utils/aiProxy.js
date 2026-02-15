/**
 * AI Proxy Utility
 * API anahtarını frontend'den gizler.
 * 
 * GÜVENLIK: VITE_AI_API_KEY sadece Vite dev proxy üzerinden kullanılır.
 * Production'da kendi backend proxy'niz gerekir.
 * 
 * NOT: Vite VITE_ prefix'li env değişkenlerini client bundle'a expose eder.
 * Bu yüzden burada BASE64 encode + dev proxy pattern kullanıyoruz.
 * Production'da backend proxy şart.
 */

const AI_API_BASE = '/api/ai' // Vite proxy → gerçek AI API

// Bizim ürün kataloğumuz — AI sadece bunlardan önerecek
const OUR_CATALOG = `
ÜRÜN KATALOĞUMUZ (SADECE bunlardan öneri yap, dışına çıkma):
1. Kadife Bordo — Ağır, lüks kadife, koyu kırmızı, ₺450/m
2. İpek Krem — Hafif, parlak ipek, krem rengi, ₺680/m
3. Keten Lacivert — Orta ağırlık, doğal keten, lacivert, ₺320/m
4. Pamuk Gri — Orta ağırlık, günlük pamuk, gri, ₺220/m
5. Blackout Siyah — Ağır, karartma, siyah, ₺380/m
6. Tül Beyaz — Çok hafif, şeffaf tül, beyaz, ₺150/m
7. Jakar Altın — Ağır, desenli jakar, altın sarısı, ₺550/m
8. Kadife Zümrüt — Ağır, lüks kadife, zümrüt yeşili, ₺470/m
`.trim()

const SYSTEM_PROMPT = `Sen Perdemo markasının perde ve iç mekan uzmanısın. Türkçe yanıt ver, kısa ve net ol.

${OUR_CATALOG}

KRİTİK KURAL: Sadece yukarıdaki 8 ürünümüzden öneri yap. Katalogumuzda olmayan ürün ÖNERİLMEZ.`

/**
 * AI API'ye güvenli istek atar (proxy üzerinden)
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
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt },
                ],
                max_tokens: maxTokens,
                temperature,
            }),
        })

        if (!response.ok) {
            console.warn('AI API error:', response.status)
            return null
        }

        const data = await response.json()
        return data.choices?.[0]?.message?.content || null
    } catch (err) {
        console.warn('AI proxy error:', err.message)
        return null
    }
}

/**
 * Renk analizinden kumaş önerisi iste
 */
export async function getColorMatchSuggestion(dominantColors, roomType = 'salon') {
    const colorStr = dominantColors.map(c => c.hex).join(', ')
    return queryAI(
        `Oda tipi: ${roomType}. Baskın duvar renkleri: ${colorStr}. ` +
        `KATALOĞUMUZDAKİ ürünlerden bu renklerle uyumlu olanları öner. ` +
        `Maksimum 3 öneri, her öneri için: ürün adı (katalogumuzdan), neden uyumlu, hangi stille kullanılmalı.`
    )
}

/**
 * Kumaş eşleştirme önerisi
 */
export async function getFabricPairingSuggestion(fabricName, style) {
    return queryAI(
        `Müşteri şu kumaşı seçti: ${fabricName}. ` +
        `KATALOĞUMUZDAKİ diğer ürünlerden bu kumaşın yanına tamamlayıcı fon perde veya tül öner. ` +
        `2-3 öneri yap, her biri KATALOĞUMUZDAKİ bir ürün olmalı. Neden iyi eşleştiğini açıkla.`
    )
}

/**
 * 3D sahne atmosfer yorumu — kumaş + manzara + ışık durumuna göre
 */
export async function getAtmosphereRecipe(fabricName, backdropName, openPercent) {
    const timeOfDay = backdropName === 'city' ? 'gece' : backdropName === 'garden' ? 'sabah' : 'gündüz'
    const lightDesc = openPercent > 60 ? 'Perde açık, bol ışık giriyor' : openPercent > 30 ? 'Perde yarı açık' : 'Perde büyük ölçüde kapalı'
    return queryAI(
        `3D perde sahnesinde şu durum var: Kumaş: "${fabricName}", Manzara: ${backdropName} (${timeOfDay}), ${lightDesc} (%${openPercent} açık). ` +
        `Bu kombinasyonun odada yaratacağı atmosferi 2-3 cümleyle açıkla. ` +
        `Işık yansıması, sıcaklık hissi ve ambiyans hakkında profesyonel bir yorum yap. Kısa ve etkileyici ol.`,
        { maxTokens: 1500 }
    )
}

/**
 * Smart Quote için AI tasarımcı notu — teklif PDF/web'ine eklenir
 */
export async function getDesignerNote(fabricName, windowWidth, windowHeight, style) {
    return queryAI(
        `Müşteriye perde teklifi hazırlanıyor. Detaylar: Kumaş: "${fabricName}", Pencere: ${windowWidth}×${windowHeight}cm, Stil: ${style}. ` +
        `Bu kombinasyon için kısa ve profesyonel bir "Tasarımcı Notu" yaz. ` +
        `Mekanın ışık, ferahlık ve estetik açısından nasıl etkileneceğini anlat. ` +
        `Müşteriye güven veren, lüks bir tasarım ofisi tonu kullan. Maksimum 3 cümle.`,
        { maxTokens: 1500 }
    )
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
