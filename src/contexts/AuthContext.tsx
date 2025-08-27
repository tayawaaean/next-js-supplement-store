'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Profile } from '@/types/database'

interface AuthContextType {
  user: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<{ message: string }>
  signOut: (redirectTo?: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing JWT token on page load
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      try {
        // Verify JWT token (basic check)
        const user = JSON.parse(userData)
        // In production, verify JWT signature here
        setUser(user)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('userData')
      }
    }
    
    setLoading(false)
  }, [])

  async function signIn(email: string, password: string) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store JWT token and user data
      localStorage.setItem('token', data.token)
      localStorage.setItem('userData', JSON.stringify(data.user))
      
      setUser(data.user)
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Don't automatically sign in - user needs admin approval
      return data
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  }

  async function signOut(redirectTo?: string) {
    try {
      // Clear JWT token and user data
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
      setUser(null)
      
      // If redirectTo is provided, redirect after clearing data
      if (redirectTo && typeof window !== 'undefined') {
        window.location.href = redirectTo
      }
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return

    try {
      // Update local state immediately for better UX
      setUser(prev => prev ? { ...prev, ...updates } : null)
      
      // Here you would typically make an API call to update the database
      // For now, we'll just update the local state
      
      // Update localStorage
      const updatedUser = { ...user, ...updates }
      localStorage.setItem('userData', JSON.stringify(updatedUser))
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
