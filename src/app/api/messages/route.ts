import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
	try {
		const { customer_id, content } = await req.json()
		if (!customer_id || !content) {
			return NextResponse.json({ error: 'Missing customer_id or content' }, { status: 400 })
		}

		const { data, error } = await supabaseAdmin
			.from('customer_messages')
			.insert({ customer_id, content })
			.select('*')
			.single()

		if (error) throw error
		return NextResponse.json({ message: data })
	} catch (err: unknown) {
		console.error('Message insert error:', err)
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
	}
}

