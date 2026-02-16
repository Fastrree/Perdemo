import { useState, useEffect } from 'react'

/**
 * Returns true on mobile-width devices (≤768px).
 * Listens for viewport changes (resize / rotation).
 * Consistent with the 768px CSS breakpoint used across the app.
 */
export default function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia('(max-width: 1024px)').matches
    })

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1024px)')
        const handler = (e) => setIsMobile(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    return isMobile
}
