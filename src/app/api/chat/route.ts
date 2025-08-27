import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
	try {
		const { customer_id, sender_id, sender_role, content } = await req.json()
		if (!customer_id || !sender_id || !sender_role || !content) {
			return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
		}
		
		console.log('Inserting chat message:', { customer_id, sender_id, sender_role, content })
		
		// Use regular client to ensure RLS triggers real-time events
		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		)
		
		const { data, error } = await supabase
			.from('chat_messages')
			.insert({ customer_id, sender_id, sender_role, content })
			.select('*')
			.single()
			
		if (error) {
			console.error('Database insert error:', error)
			throw error
		}
		
		console.log('Message inserted successfully:', data)
		
		// Return the message data directly for real-time handling
		return NextResponse.json(data)
		
	} catch (err: unknown) {
		console.error('chat POST error', err)
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
	}
}
