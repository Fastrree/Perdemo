import { useState, useEffect } from 'react'

/**
 * Returns true only on devices with real hover capability (mouse/trackpad).
 * Returns false on touch-only devices.
 * Used to conditionally attach onMouseEnter/onMouseLeave for performance.
 */
export default function useCanHover() {
    const [canHover, setCanHover] = useState(() => {
        if (typeof window === 'undefined') return true
        return window.matchMedia('(hover: hover)').matches
    })

    useEffect(() => {
        const mq = window.matchMedia('(hover: hover)')
        const handler = (e) => setCanHover(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    return canHover
}
