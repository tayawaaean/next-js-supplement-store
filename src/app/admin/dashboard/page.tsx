'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { 
  CubeIcon, 
  ShoppingCartIcon, 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  lowStockProducts: number
  pendingOrders: number
  unreadMessages: number
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    unreadMessages: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin')
        return
      }
      
      if (user?.role !== 'admin') {
        router.push('/')
        return
      }

      fetchDashboardStats()
    }
  }, [user, loading, router])

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // Fetch low stock products
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('stock_quantity', 10)

      // Fetch orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      // Fetch pending orders
      const { count: pendingOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')

      // Fetch total revenue from completed payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')

      if (paymentsError) {
        console.error('Payments fetch error:', paymentsError)
      }

      let totalRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

      // Fallback to orders if payments are missing or zero
      if (!totalRevenue) {
        const { data: paidOrders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount')
          .in('status', ['processing', 'shipped', 'delivered'])

        if (ordersError) {
          console.error('Orders fallback fetch error:', ordersError)
        }

        totalRevenue = paidOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
      }

      // Fetch unread messages count
      const { count: unreadMessagesCount } = await supabase
        .from('customer_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalCustomers: customersCount || 0,
        totalRevenue,
        lowStockProducts: lowStockCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        unreadMessages: unreadMessagesCount || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user?.role !== 'admin') {
    return null
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: CubeIcon,
      color: 'bg-blue-500',
      href: '/admin/products'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCartIcon,
      color: 'bg-green-500',
      href: '/admin/orders'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: UsersIcon,
      color: 'bg-purple-500',
      href: '/admin/customers'
    },
    {
      title: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      href: '/admin/orders'
    }
  ]

  const alertCards = [
    {
      title: 'Low Stock Products',
      value: stats.lowStockProducts,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      href: '/admin/products'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ShoppingCartIcon,
      color: 'bg-orange-500',
      href: '/admin/orders'
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-blue-500',
      href: '/admin/messages'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.full_name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(stat.href)}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {alertCards.map((alert, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(alert.href)}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${alert.color}`}>
                  <alert.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{alert.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{alert.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
