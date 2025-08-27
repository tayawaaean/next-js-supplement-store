'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { 
  ShoppingCartIcon, 
  CubeIcon, 
  TruckIcon, 
  CheckCircleIcon, 
  XMarkIcon, 
  ClockIcon,
  MapPinIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { Order, OrderItem, Product } from '@/types/database'
import { formatPrice, formatDate, getProductImageUrl } from '@/lib/utils'

interface OrderWithDetails extends Order {
  items: (OrderItem & { product: Product })[]
}

export default function CustomerOrders() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Fetch customer's orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Orders fetch error:', ordersError)
        throw ordersError
      }

      // Fetch order items with product details for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order: Order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              *,
              product:products(*)
            `)
            .eq('order_id', order.id)

          if (itemsError) {
            console.error('Order items fetch error:', itemsError)
            throw itemsError
          }

          return {
            ...order,
            items: itemsData || []
          }
        })
      )

      setOrders(ordersWithItems)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin')
        return
      }
      fetchOrders()
    }
  }, [user, loading, router, fetchOrders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return ClockIcon
      case 'processing':
        return CubeIcon
      case 'shipped':
        return TruckIcon
      case 'delivered':
        return CheckCircleIcon
      case 'cancelled':
        return XMarkIcon
      default:
        return ClockIcon
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your order is being reviewed and will be processed soon.'
      case 'processing':
        return 'Your order is being prepared and will be shipped shortly.'
      case 'shipped':
        return 'Your order has been shipped and is on its way to you.'
      case 'delivered':
        return 'Your order has been delivered successfully.'
      case 'cancelled':
        return 'Your order has been cancelled.'
      default:
        return 'Order status unknown.'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-4">Please sign in to view your orders.</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-2 text-gray-600">
            Track your orders and view your purchase history.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-8">
              <ShoppingCartIcon className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No orders yet</h3>
            <p className="text-gray-600 mb-8 text-lg">Start shopping to see your orders here.</p>
            <button
              onClick={() => router.push('/products')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105 shadow-lg"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              return (
                <div key={order.id} className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                  {/* Order Header */}
                  <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            <StatusIcon className="h-4 w-4 mr-2" />
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPrice(order.total_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-8 py-6">
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 h-16 w-16">
                            <img
                              src={getProductImageUrl(item.product.image_url)}
                              alt={item.product.name}
                              className="h-16 w-16 rounded-lg object-cover shadow-md"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.product.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} × {formatPrice(item.unit_price)}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <p className="text-sm font-medium text-gray-900">
                              {formatPrice(item.unit_price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          <span className="font-medium">Shipping Address</span>
                        </div>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded-lg border">{order.shipping_address}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <StatusIcon className="h-4 w-4 mr-2" />
                          <span className="font-medium">Order Status</span>
                        </div>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded-lg border">{getStatusDescription(order.status)}</p>
                        {order.tracking_number && (
                          <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded-lg">
                            📦 Tracking: {order.tracking_number}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Order Details #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Order Information</h4>
                      <p className="text-sm text-gray-600">Status: {selectedOrder.status}</p>
                      <p className="text-sm text-gray-600">Total: {formatPrice(selectedOrder.total_amount)}</p>
                      <p className="text-sm text-gray-600">Date: {formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Shipping</h4>
                      <p className="text-sm text-gray-600">{selectedOrder.shipping_address}</p>
                      {selectedOrder.tracking_number && (
                        <p className="text-sm text-blue-600">Track: {selectedOrder.tracking_number}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <img
                              src={getProductImageUrl(item.product.image_url)}
                              alt={item.product.name}
                              className="h-12 w-12 rounded object-cover"
                            />
                            <div>
                              <p className="text-sm font-medium">{item.product.name}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatPrice(item.unit_price)}</p>
                            <p className="text-sm text-gray-500">Total: {formatPrice(item.unit_price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
