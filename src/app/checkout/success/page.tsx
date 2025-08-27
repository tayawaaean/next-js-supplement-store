"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function CheckoutSuccessPage() {
	const [done, setDone] = useState(false)

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const sessionId = params.get('session_id')
		if (!sessionId) return

		// Optionally call API to verify the session; regardless, clear the cart on return
		fetch(`/api/checkout?verify=${encodeURIComponent(sessionId)}`).finally(() => {
			try {
				localStorage.setItem('cart', '[]')
				window.dispatchEvent(new StorageEvent('storage', { key: 'cart' }))
			} catch {}
			setDone(true)
		})
	}, [])

	return (
		<div className="min-h-screen bg-gray-50">
			<Navigation />
			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful</h1>
				<p className="text-gray-600 mb-6">Thank you for your purchase. Your order is being processed.</p>
				{done ? (
					<p className="text-green-700 mb-6">Cart cleared. You can continue shopping.</p>
				) : (
					<p className="text-gray-500 mb-6">Finalizing...</p>
				)}
				<Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">Go to Home</Link>
			</div>
		</div>
	)
}
