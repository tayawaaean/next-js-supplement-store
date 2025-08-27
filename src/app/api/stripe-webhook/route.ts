import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

export const config = {
	api: {
		bodyParser: false,
	},
}

import { validateEnv } from '@/lib/env'

// Validate environment variables
const env = validateEnv()

const stripe = new Stripe(env.stripe.secretKey, { apiVersion: '2025-07-30.basil' })
const endpointSecret = env.stripe.webhookSecret

export async function POST(req: NextRequest) {
	try {
		const rawBody = await req.text()
		const sig = req.headers.get('stripe-signature') || ''

		let event: Stripe.Event
		try {
			event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)
		} catch (err: unknown) {
			console.error('Webhook signature verification failed:', err instanceof Error ? err.message : String(err))
			return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
		}

		if (event.type === 'checkout.session.completed') {
			const session = event.data.object as Stripe.Checkout.Session
			const orderId = session.metadata?.order_id
			const amountTotal = session.amount_total || 0
			const paymentStatus = session.payment_status
			const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id

			if (orderId) {
				// Mark order as paid
				await supabase
					.from('orders')
					.update({ status: 'processing' })
					.eq('id', orderId)

				// Record payment - match the actual table schema
				await supabase.from('payments').insert({
					order_id: orderId,
					amount: (amountTotal || 0) / 100,
					status: paymentStatus === 'paid' ? 'completed' : 'pending',
					payment_method: 'stripe',
					transaction_id: paymentIntentId || session.id,
				})
			}
		}

		return NextResponse.json({ received: true })
	} catch (error: unknown) {
		console.error('Webhook error:', error)
		return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 })
	}
}

