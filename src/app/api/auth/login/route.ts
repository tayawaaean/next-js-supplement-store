import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { validateEnv } from '@/lib/env'

// Validate environment variables
const env = validateEnv()

const supabase = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      return NextResponse.json(
        { error: 'Account is pending approval. Please contact an administrator.' },
        { status: 403 }
      )
    }

    // Verify password (using the crypt function from PostgreSQL)
    const { data: passwordCheck, error: passwordError } = await supabase
      .rpc('verify_password', {
        input_password: password,
        stored_hash: user.password_hash
      })

    if (passwordError || !passwordCheck) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create secure JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        status: user.status 
      },
      env.jwt.secret,
      { expiresIn: '24h' }
    )

    // Return user data (without password)
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

