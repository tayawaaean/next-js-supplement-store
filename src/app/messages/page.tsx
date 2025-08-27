'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface ChatMessage {
	id: string
	customer_id: string
	sender_id: string
	sender_role: 'customer' | 'admin'
	content: string
	created_at: string
}

export default function MessagesPage() {
	const { user, loading } = useAuth()
	const router = useRouter()
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [composer, setComposer] = useState('')
	const listRef = useRef<HTMLDivElement>(null)
	const [sendError, setSendError] = useState<string | null>(null)

	useEffect(() => {
		if (!loading) {
			if (!user) {
				router.push('/auth/signin')
				return
			}
			console.log('Setting up customer chat for user:', user.id)
			loadMessages()
			const cleanup = subscribeRealtime()
			return cleanup
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, loading])

	const scrollToBottom = () => {
		if (listRef.current) {
			listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
		}
	}

	const loadMessages = async () => {
		try {
			setIsLoading(true)
			const { data, error } = await supabase
				.from('chat_messages')
				.select('*')
				.eq('customer_id', user?.id)
				.order('created_at', { ascending: true })
			if (error) throw error
			setMessages(data || [])
		} catch (err) {
			console.error('Load chat error:', err)
		} finally {
			setIsLoading(false)
			setTimeout(scrollToBottom, 50)
		}
	}

	const subscribeRealtime = () => {
		console.log('Setting up real-time subscription for customer:', user?.id)
		
		const channel = supabase
			.channel(`chat-customer-${user?.id}`)
			.on('postgres_changes', {
				event: 'INSERT',
				schema: 'public',
				table: 'chat_messages',
				filter: `customer_id=eq.${user?.id}`,
			}, (payload) => {
				console.log('Real-time INSERT event received:', payload)
				// Add the new message
				setMessages(prev => {
					const exists = prev.some(m => m.id === payload.new.id)
					if (!exists) {
						console.log('Adding new message to state:', payload.new)
						return [...prev, payload.new as ChatMessage]
					} else {
						console.log('Message already exists, skipping:', payload.new.id)
					}
					return prev
				})
				setTimeout(scrollToBottom, 20)
			})
			.on('postgres_changes', {
				event: 'UPDATE',
				schema: 'public',
				table: 'chat_messages',
				filter: `customer_id=eq.${user?.id}`,
			}, (payload) => {
				console.log('Real-time UPDATE event received:', payload)
				setMessages(prev => 
					prev.map(m => m.id === payload.new.id ? payload.new as ChatMessage : m)
				)
			})
			.subscribe((status) => {
				console.log('Customer subscription status:', status)
				if (status === 'SUBSCRIBED') {
					console.log('✅ Customer real-time subscription active')
				} else if (status === 'CHANNEL_ERROR') {
					console.error('❌ Customer real-time subscription error')
				}
			})

		return () => {
			console.log('Cleaning up customer subscription for:', user?.id)
			supabase.removeChannel(channel)
		}
	}

	const sendMessage = async () => {
		const text = composer.trim()
		if (!text) return
		setSendError(null)
		setComposer('')
		
		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customer_id: user!.id,
					sender_id: user!.id,
					sender_role: 'customer',
					content: text,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error || 'Failed to send')
			
			console.log('Message sent successfully:', json)
			
			// Don't remove the message - let real-time handle it
			// The real-time event should update the message with the real ID
			
		} catch (err: unknown) {
			console.error('Send chat error:', err)
			setSendError(err instanceof Error ? err.message : 'Failed to send')
		}
	}

	if (loading || isLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Navigation />
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Loading messages...</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navigation />
			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900 flex items-center">
						<ChatBubbleLeftRightIcon className="h-7 w-7 text-blue-600 mr-2" />
						Messages
					</h1>
					<p className="text-gray-600">Chat with our support team in real-time.</p>
				</div>

				{sendError && (
					<div className="mb-3 p-3 rounded-md border border-red-200 bg-red-50 text-red-800 text-sm">
						{sendError}
					</div>
				)}

				<div className="bg-white shadow rounded-2xl border border-gray-100 flex flex-col h-[70vh]">
					<div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
						{messages.length === 0 ? (
							<div className="text-center text-gray-500 py-12">No messages yet. Start the conversation below.</div>
						) : (
							messages.map((m) => (
								<div key={m.id} className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
									<div className={`${m.sender_role === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} max-w-[70%] rounded-lg px-3 py-2 text-sm`}>
										{m.content}
										<div className={`text-[10px] mt-1 ${m.sender_role === 'customer' ? 'text-blue-100' : 'text-gray-500'}`}>{new Date(m.created_at).toLocaleString()}</div>
									</div>
								</div>
							))
						)}
					</div>

					<div className="border-t p-3">
						<div className="flex items-center space-x-2">
							<textarea
								value={composer}
								onChange={(e) => setComposer(e.target.value)}
								placeholder="Type your message..."
								rows={2}
								className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
							<button
								onClick={sendMessage}
								className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
							>
								<PaperAirplaneIcon className="h-4 w-4 mr-2" />
								Send
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
