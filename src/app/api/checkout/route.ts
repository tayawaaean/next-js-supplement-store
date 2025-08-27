import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { validateEnv } from '@/lib/env'

// Validate environment variables
const env = validateEnv()

const stripe = new Stripe(env.stripe.secretKey, { apiVersion: '2025-07-30.basil' })

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const { cartItems, userId, shippingAddress } = body
		const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

		if (!Array.isArray(cartItems) || cartItems.length === 0) {
			return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
		}
		if (!userId) {
			return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
		}

		// Calculate totals
		const totalAmount = cartItems.reduce((sum: number, item: { product?: { price: number }; quantity?: number }) => sum + (item.product?.price || 0) * (item.quantity || 1), 0)

		// 1) Create pending order
		const { data: order, error: orderError } = await supabase
			.from('orders')
			.insert({
				customer_id: userId,
				status: 'pending',
				total_amount: totalAmount,
				shipping_address: shippingAddress || '',
			})
			.select('*')
			.single()
		if (orderError || !order) {
			console.error('Order insert error', orderError)
			return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
		}

		// 2) Insert order items
		const itemsPayload = cartItems.map((item: { product?: { id: string; price: number }; quantity?: number }) => ({
			order_id: order.id,
			product_id: item.product?.id,
			quantity: item.quantity || 1,
			unit_price: item.product?.price || 0,
		}))
		const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload)
		if (itemsError) {
			console.error('Order items insert error', itemsError)
			return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
		}

		// 3) Build Stripe line_items
		const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item: { product?: { name: string; image_url?: string; price: number }; quantity?: number }) => ({
			price_data: {
				currency: 'usd',
				product_data: {
					name: item.product?.name || 'Product',
					images: item.product?.image_url ? [item.product.image_url] : [],
				},
				unit_amount: Math.round((item.product?.price || 0) * 100),
			},
			quantity: item.quantity || 1,
		}))

		// 4) Create Stripe Checkout Session with order_id metadata
		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			line_items,
			success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${appUrl}/cart`,
			metadata: {
				order_id: order.id,
				user_id: userId,
			},
		})
		return NextResponse.json({ id: session.id, url: session.url })
	} catch (err: unknown) {
		console.error('Checkout error', err)
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Checkout error' }, { status: 500 })
	}
}

export async function GET(req: NextRequest) {
	// Optional verification endpoint
	const { searchParams } = new URL(req.url)
	const verify = searchParams.get('verify')
	if (!verify) return NextResponse.json({ ok: true })
	try {
		const session = await stripe.checkout.sessions.retrieve(verify)
		return NextResponse.json({ paid: session.payment_status === 'paid' })
	} catch (err: unknown) {
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Verify error' }, { status: 500 })
	}
}

