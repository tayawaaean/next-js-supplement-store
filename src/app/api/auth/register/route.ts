import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password using our custom hash_password function
    const { data: hashedPassword, error: hashError } = await supabase
      .rpc('hash_password', {
        password_input: password
      })

    if (hashError) {
      console.error('Password hash error:', hashError)
      return NextResponse.json(
        { error: 'Error processing password' },
        { status: 500 }
      )
    }

    // Create new user with pending status
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          full_name: fullName,
          role: 'customer',
          status: 'pending'
        }
      ])
      .select('*')
      .single()

    if (insertError) {
      console.error('User creation error:', insertError)
      return NextResponse.json(
        { error: 'Error creating user account' },
        { status: 500 }
      )
    }

    // Return success message (user needs admin approval)
    return NextResponse.json({
      message: 'Account created successfully! Please wait for admin approval.',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        status: newUser.status
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
