/**
 * Auth Context — Clerk Authentication
 * 
 * Provides: user, session, profile, loading, signIn, signUp, signOut, resetPassword
 * Wraps Clerk hooks to maintain the same API as the old Supabase auth.
 * 
 * Important: ClerkProvider must wrap this in App.jsx
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { apiFetch } from '../lib/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const { user: clerkUser, isLoaded: userLoaded } = useUser()
    const { getToken, isSignedIn } = useClerkAuth()
    const clerk = useClerk()

    const [profile, setProfile] = useState(null)
    const [profileLoading, setProfileLoading] = useState(false)

    // Build a session-like object for apiClient compatibility
    const [sessionObj, setSessionObj] = useState(null)

    // Refresh the session token
    const refreshSession = useCallback(async () => {
        if (!isSignedIn) {
            setSessionObj(null)
            return null
        }
        try {
            const token = await getToken()
            const session = { access_token: token }
            setSessionObj(session)
            return session
        } catch {
            setSessionObj(null)
            return null
        }
    }, [isSignedIn, getToken])

    // Load profile from our DB when user signs in
    useEffect(() => {
        if (!userLoaded) return

        if (clerkUser) {
            refreshSession()
            // Profile will be fetched from our own API after first sign-in
            // For now, build a basic profile from Clerk user data
            setProfile({
                id: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress,
                full_name: clerkUser.fullName || clerkUser.firstName || '',
                company_id: clerkUser.publicMetadata?.company_id || null,
                companies: clerkUser.publicMetadata?.company_name
                    ? { name: clerkUser.publicMetadata.company_name }
                    : null,
            })
        } else {
            setSessionObj(null)
            setProfile(null)
        }
    }, [clerkUser, userLoaded, refreshSession])

    // Sign in with email/password
    const signIn = useCallback(async (email, password) => {
        const result = await clerk.client.signIn.create({
            identifier: email,
            password,
        })

        if (result.status === 'complete') {
            await clerk.setActive({ session: result.createdSessionId })
        } else {
            throw new Error('Sign in failed')
        }
    }, [clerk])

    // Sign up with email/password + metadata
    const signUp = useCallback(async (email, password, metadata = {}) => {
        const result = await clerk.client.signUp.create({
            emailAddress: email,
            password,
            firstName: metadata.fullName?.split(' ')[0] || '',
            lastName: metadata.fullName?.split(' ').slice(1).join(' ') || '',
            unsafeMetadata: {
                company_name: metadata.companyName || '',
            },
        })

        if (result.status === 'complete') {
            await clerk.setActive({ session: result.createdSessionId })
        } else {
            // May need email verification depending on Clerk settings
            throw new Error('Please verify your email to continue')
        }
    }, [clerk])

    // Sign out
    const signOut = useCallback(async () => {
        await clerk.signOut()
        setProfile(null)
        setSessionObj(null)
    }, [clerk])

    // Reset password — Clerk handles this via their UI or we use the API
    const resetPassword = useCallback(async (email) => {
        await clerk.client.signIn.create({
            strategy: 'reset_password_email_code',
            identifier: email,
        })
    }, [clerk])

    const loading = !userLoaded
    const user = clerkUser ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
    } : null

    const value = {
        user,
        session: sessionObj,
        getToken,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        isAuthenticated: !!isSignedIn,
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
