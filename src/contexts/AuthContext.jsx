/**
 * Auth Context — Supabase Authentication
 * 
 * Provides: user, session, profile, loading, signIn, signUp, signOut
 * Wraps entire app to make auth state available everywhere.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    // Fetch user profile from profiles table
    const fetchProfile = useCallback(async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, companies(*)')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('Profile fetch error:', error.message)
                return null
            }
            return data
        } catch (err) {
            console.error('Profile fetch exception:', err)
            return null
        }
    }, [])

    // Initialize: check existing session
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session: existingSession } } = await supabase.auth.getSession()

                if (existingSession) {
                    setSession(existingSession)
                    setUser(existingSession.user)
                    const userProfile = await fetchProfile(existingSession.user.id)
                    setProfile(userProfile)
                }
            } catch (err) {
                console.error('Auth init error:', err)
            } finally {
                setLoading(false)
            }
        }

        initAuth()

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                setSession(newSession)
                setUser(newSession?.user ?? null)

                if (newSession?.user) {
                    const userProfile = await fetchProfile(newSession.user.id)
                    setProfile(userProfile)
                } else {
                    setProfile(null)
                }

                if (event === 'SIGNED_OUT') {
                    setProfile(null)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [fetchProfile])

    // Sign in with email/password
    const signIn = useCallback(async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    }, [])

    // Sign up with email/password + metadata
    const signUp = useCallback(async (email, password, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: metadata.fullName || '',
                    company_name: metadata.companyName || '',
                },
            },
        })
        if (error) throw error
        return data
    }, [])

    // Sign out
    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setUser(null)
        setSession(null)
        setProfile(null)
    }, [])

    // Reset password — sends reset link to email
    const resetPassword = useCallback(async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        })
        if (error) throw error
    }, [])

    const value = {
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        isAuthenticated: !!session,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
