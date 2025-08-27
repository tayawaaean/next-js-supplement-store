"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface ChatMessage {
	id: string
	customer_id: string
	sender_id: string
	sender_role: 'customer' | 'admin'
	content: string
	created_at: string
}

interface UserLite { id: string; full_name: string; email: string }

export default function AdminMessagesPage() {
	const { user, loading } = useAuth()
	const router = useRouter()
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [composer, setComposer] = useState('')
	const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
	const [userMap, setUserMap] = useState<Record<string, UserLite>>({})
	const [threadIds, setThreadIds] = useState<string[]>([])
	const [threadPage, setThreadPage] = useState(0)
	const THREAD_PAGE_SIZE = 20
	const listRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!loading) {
			if (!user || user.role !== 'admin') { router.push('/auth/signin'); return }
			loadThreads(0)
		}
	}, [user, loading])

	useEffect(() => {
		if (!selectedCustomerId) return
		loadConversation(selectedCustomerId)
		const unsub = subscribeRealtime(selectedCustomerId)
		return () => { 
			console.log('Cleaning up admin subscription for:', selectedCustomerId)
			unsub() 
		}
	}, [selectedCustomerId])

	const loadThreads = async (page: number) => {
		try {
			const from = page * THREAD_PAGE_SIZE
			const to = from + THREAD_PAGE_SIZE - 1
			let ids: string[] = []

			// Preferred: chat_threads view
			const { data, error } = await supabase
				.from('chat_threads')
				.select('customer_id, last_message_at')
				.order('last_message_at', { ascending: false })
				.range(from, to)

			if (!error && data) {
				ids = (data as { customer_id: string }[]).map(r => r.customer_id)
			} else {
				// Fallback: derive from chat_messages
				const { data: msgs, error: msgsError } = await supabase
					.from('chat_messages')
					.select('customer_id, created_at')
					.order('created_at', { ascending: false })
					.range(from, to + THREAD_PAGE_SIZE) // fetch a bit more to dedupe
				if (msgsError) throw msgsError
				const seen = new Set<string>()
				for (const row of msgs || []) {
					if (!seen.has(row.customer_id)) {
						seen.add(row.customer_id)
						ids.push(row.customer_id)
						if (ids.length >= THREAD_PAGE_SIZE) break
					}
				}
			}

			if (ids.length) {
				await fetchUsers(ids)
				setThreadIds(prev => page === 0 ? ids : [...prev, ...ids])
				if (page === 0 && !selectedCustomerId) setSelectedCustomerId(ids[0])
			}
		} catch (err: unknown) {
			console.error('Load threads error:', err instanceof Error ? err.message : String(err))
		} finally {
			setIsLoading(false)
			setThreadPage(page)
		}
	}

	const fetchUsers = async (ids: string[]) => {
		const { data } = await supabase.from('users').select('id, full_name, email').in('id', ids)
		const map: Record<string, UserLite> = {}
		;(data || []).forEach((u: { id: string; full_name: string; email: string }) => { map[u.id] = u })
		setUserMap(prev => ({ ...prev, ...map }))
	}

	const loadConversation = async (customerId: string) => {
		try {
			setIsLoading(true)
			const { data, error } = await supabase
				.from('chat_messages')
				.select('*')
				.eq('customer_id', customerId)
				.order('created_at', { ascending: true })
			if (error) throw error
			setMessages(data || [])
		} catch (err: unknown) {
			console.error('Load convo error:', err instanceof Error ? err.message : String(err))
		} finally {
			setIsLoading(false)
			setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
		}
	}

	const subscribeRealtime = (customerId: string) => {
		console.log('Setting up real-time subscription for customer:', customerId)
		
		const channel = supabase
			.channel(`chat-admin-${customerId}`)
			.on('postgres_changes', { 
				event: 'INSERT', 
				schema: 'public', 
				table: 'chat_messages', 
				filter: `customer_id=eq.${customerId}` 
			}, (payload) => {
				console.log('Admin real-time message received:', payload)
				// Only add if it's not already in the messages
				setMessages(prev => {
					const exists = prev.some(m => m.id === payload.new.id)
					if (!exists) {
						return [...prev, payload.new as ChatMessage]
					}
					return prev
				})
				setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 20)
			})
			.on('postgres_changes', { 
				event: 'UPDATE', 
				schema: 'public', 
				table: 'chat_messages', 
				filter: `customer_id=eq.${customerId}` 
			}, (payload) => {
				console.log('Admin real-time message updated:', payload)
				setMessages(prev => 
					prev.map(m => m.id === payload.new.id ? payload.new as ChatMessage : m)
				)
			})
			.subscribe((status) => {
				console.log('Admin subscription status:', status)
			})
		
		return () => {
			console.log('Removing admin subscription for customer:', customerId)
			supabase.removeChannel(channel)
		}
	}

	const sendReply = async () => {
		const text = composer.trim()
		if (!text || !selectedCustomerId) return
		setComposer('')
		
		try {
			const res = await fetch('/api/chat', {
				method: 'POST', 
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					customer_id: selectedCustomerId, 
					sender_id: user!.id, 
					sender_role: 'admin', 
					content: text 
				})
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error || 'Failed to send')
			
			console.log('Admin reply sent successfully:', json)
			
			// Don't remove the message - let real-time handle it
			// The real-time event should update the message with the real ID
			
		} catch (err: unknown) {
			console.error('Reply error:', err instanceof Error ? err.message : String(err))
		}
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navigation />
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-4 flex items-center space-x-2">
					<ChatBubbleLeftRightIcon className="h-7 w-7 text-blue-600" />
					<h1 className="text-3xl font-bold text-gray-900">Customer Messages</h1>
				</div>

				<div className="bg-white shadow rounded-2xl border border-gray-100 grid grid-cols-12 min-h-[70vh]">
					{/* Sidebar */}
					<div className="col-span-4 border-r flex flex-col">
						<div className="p-3 font-medium text-gray-700 border-b">Chats</div>
						<div className="divide-y overflow-auto">
							{threadIds.length === 0 ? (
								<div className="p-6 text-gray-500">No conversations yet.</div>
							) : (
								threadIds.map((cid) => (
									<button key={cid} onClick={() => setSelectedCustomerId(cid)} className={`w-full text-left p-3 hover:bg-gray-50 ${selectedCustomerId === cid ? 'bg-blue-50' : ''}`}>
										<div className="text-sm font-medium text-gray-900">{userMap[cid]?.full_name || userMap[cid]?.email || cid}</div>
										<div className="text-xs text-gray-500 truncate">{cid}</div>
									</button>
								))
							)}
						</div>
						{threadIds.length >= (threadPage + 1) * THREAD_PAGE_SIZE && (
							<button onClick={() => loadThreads(threadPage + 1)} className="m-3 px-3 py-2 border rounded text-sm hover:bg-gray-50">Load more</button>
						)}
					</div>

					{/* Conversation */}
					<div className="col-span-8 flex flex-col">
						<div className="px-4 py-3 border-b">
							<p className="font-medium text-gray-900">{selectedCustomerId && userMap[selectedCustomerId] ? `${userMap[selectedCustomerId].full_name} (${userMap[selectedCustomerId].email})` : 'Select a customer'}</p>
						</div>
						<div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
							{(!selectedCustomerId || isLoading) ? (
								<div className="text-center text-gray-500 py-12">{isLoading ? 'Loading...' : 'Select a chat from the left.'}</div>
							) : messages.length === 0 ? (
								<div className="text-center text-gray-500 py-12">No messages in this conversation yet.</div>
							) : (
								messages.map((m) => (
									<div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
										<div className={`${m.sender_role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} max-w-[70%] rounded-lg px-3 py-2 text-sm`}>
											{m.content}
											<div className={`text-[10px] mt-1 ${m.sender_role === 'admin' ? 'text-blue-100' : 'text-gray-500'}`}>{new Date(m.created_at).toLocaleString()}</div>
										</div>
									</div>
								))
							)}
						</div>
						<div className="border-t p-3">
							<div className="flex items-center space-x-2">
								<textarea value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="Type your reply..." rows={2} className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
								<button onClick={sendReply} disabled={!selectedCustomerId} className="inline-flex items-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium">
									Send
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
