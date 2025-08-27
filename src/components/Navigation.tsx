'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { 
  ShoppingCartIcon, 
  CubeIcon, 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon, 
  ArrowRightOnRectangleIcon, 
  Bars3Icon, 
  XMarkIcon 
} from '@heroicons/react/24/outline'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)

  const isAdmin = user?.role === 'admin'

  // Load cart count from localStorage
  useEffect(() => {
    const loadCartCount = () => {
      try {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
          const cartData = JSON.parse(savedCart)
          const count = cartData.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0)
          setCartItemCount(count)
        }
      } catch (error) {
        console.error('Error loading cart count:', error)
      }
    }

    loadCartCount()

    // Listen for cart changes
    const handleStorageChange = () => {
      loadCartCount()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cartUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', handleStorageChange)
    }
  }, [])

  const adminNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { href: '/admin/products', label: 'Products', icon: CubeIcon },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCartIcon },
    { href: '/admin/customers', label: 'Customers', icon: UsersIcon },
    { href: '/admin/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
  ]

  const customerNavItems = [
    { href: '/products', label: 'Products', icon: CubeIcon },
    { href: '/orders', label: 'My Orders', icon: ShoppingCartIcon },
    { href: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
    { href: '/profile', label: 'Profile', icon: UsersIcon },
  ]

  const handleSignOut = async () => {
    try {
      await signOut('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <CubeIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Supplement Store
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                {isAdmin ? (
                  adminNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  ))
                ) : (
                  <>
                    {customerNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Link>
                    ))}
                    
                    {/* Cart Icon for Customers */}
                    <Link
                      href="/cart"
                      className="relative flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <ShoppingCartIcon className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    Welcome, {user.full_name}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {user ? (
              <>
                {isAdmin ? (
                  adminNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Link>
                  ))
                ) : (
                  <>
                    {customerNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Link>
                    ))}
                    
                    {/* Cart Icon for Customers (Mobile) */}
                    <Link
                      href="/cart"
                      className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ShoppingCartIcon className="h-5 w-5 mr-3" />
                      Cart
                      {cartItemCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="px-3 py-2 text-sm text-gray-700">
                    Welcome, {user.full_name}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
