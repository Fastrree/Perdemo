/**
 * Supabase Client — Singleton
 * 
 * Tüm uygulama boyunca tek bir Supabase client kullanılır.
 * VITE_ prefix'li env var'lar client-side'da da erişilebilir.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        '⚠️ Supabase credentials missing!\n' +
        'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
    )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: window.localStorage,
        storageKey: 'perdemo-auth',
        detectSessionInUrl: true,
    },
})
