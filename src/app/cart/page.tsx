'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { 
  ShoppingCartIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  ArrowLeftIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

import { Product } from '@/types/database'
import { formatPrice, getProductImageUrl } from '@/lib/utils'
import Link from 'next/link'

interface CartItem {
  product: Product
  quantity: number
}

interface ShippingAddress {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  country: string
}

export default function CartPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  })
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin')
        return
      }
      loadCart()
    }
  }, [user, loading, router])

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const cartData = JSON.parse(savedCart)
        setCartItems(cartData)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setIsUpdating(true)
    try {
      const updatedCart = cartItems.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
      setCartItems(updatedCart)
      localStorage.setItem('cart', JSON.stringify(updatedCart))
    } catch (error) {
      console.error('Error updating quantity:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const removeItem = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.product.id !== productId)
    setCartItems(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const isAddressComplete = () => {
    return (
      shippingAddress.fullName.trim() !== '' &&
      shippingAddress.phone.trim() !== '' &&
      shippingAddress.addressLine1.trim() !== '' &&
      shippingAddress.city.trim() !== '' &&
      shippingAddress.state.trim() !== '' &&
      shippingAddress.zipCode.trim() !== '' &&
      shippingAddress.country.trim() !== ''
    )
  }

  const formatAddressForDatabase = () => {
    const parts = [
      shippingAddress.fullName,
      shippingAddress.phone,
      shippingAddress.addressLine1,
      shippingAddress.addressLine2,
      `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}`,
      shippingAddress.country
    ].filter(part => part.trim() !== '')
    
    return parts.join('\n')
  }

  const handleCheckout = async () => {
    if (!isAddressComplete()) {
      alert('Please fill in all required shipping address fields')
      return
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty')
      return
    }

    setIsCheckingOut(true)
    try {
      // Call our API to create Stripe Checkout session and pending order
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          cartItems,
          shippingAddress: formatAddressForDatabase(),
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
        return
      }

      throw new Error('No checkout URL returned')
    } catch (error) {
      console.error('Error starting checkout:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Link
              href="/products"
              className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors mr-6"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
              <ShoppingCartIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-lg text-gray-600">Complete your purchase with secure checkout</p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-8">
              <ShoppingCartIcon className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h3>
            <p className="text-gray-600 mb-8 text-lg">Start shopping to add items to your cart</p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105 shadow-lg"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="xl:col-span-2">
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <ShoppingCartIcon className="h-6 w-6 text-blue-600 mr-3" />
                      Cart Items ({getItemCount()})
                    </h2>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="p-8 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-6">
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 rounded-xl overflow-hidden shadow-md border border-gray-200">
                            <img
                              className="w-full h-full object-cover"
                              src={getProductImageUrl(item.product.image_url)}
                              alt={item.product.name}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {item.product.name}
                              </h3>
                              <p className="text-sm text-gray-500 mb-3">
                                {item.product.category}
                              </p>
                              <div className="flex items-center space-x-4">
                                <span className="text-2xl font-bold text-blue-600">
                                  {formatPrice(item.product.price * item.quantity)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatPrice(item.product.price)} each
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-6">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  disabled={isUpdating}
                                  className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-md"
                                >
                                  <MinusIcon className="h-4 w-4" />
                                </button>
                                <span className="px-4 py-3 text-lg font-semibold text-gray-900 min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  disabled={isUpdating}
                                  className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-md"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </button>
                              </div>
                              <button
                                onClick={() => removeItem(item.product.id)}
                                className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors group"
                                title="Remove item"
                              >
                                <TrashIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary & Shipping */}
            <div className="xl:col-span-1">
              <div className="space-y-6">
                {/* Order Summary Card */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <CreditCardIcon className="h-6 w-6 text-green-600 mr-3" />
                    Order Summary
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Subtotal ({getItemCount()} items)</span>
                      <span className="font-medium text-gray-900">{formatPrice(getCartTotal())}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-600 font-semibold">Shipping</span>
                      <span className="text-green-600 font-semibold">Free</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-blue-600">{formatPrice(getCartTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Address Card */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Shipping Address
                  </h3>
                  
                  <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        value={shippingAddress.fullName}
                        onChange={(e) => handleAddressChange('fullName', e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={shippingAddress.phone}
                        onChange={(e) => handleAddressChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                        required
                      />
                    </div>

                    {/* Address Line 1 */}
                    <div>
                      <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        id="addressLine1"
                        value={shippingAddress.addressLine1}
                        onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                        placeholder="Street address, P.O. box, company name"
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                        required
                      />
                    </div>

                    {/* Address Line 2 */}
                    <div>
                      <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-2">
                        Apartment, suite, etc. (optional)
                      </label>
                      <input
                        type="text"
                        id="addressLine2"
                        value={shippingAddress.addressLine2}
                        onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                        placeholder="Apartment, suite, unit, building, floor, etc."
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                      />
                    </div>

                    {/* City, State, Zip */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          placeholder="City"
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          id="state"
                          value={shippingAddress.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          placeholder="State"
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          id="zipCode"
                          value={shippingAddress.zipCode}
                          onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                          placeholder="ZIP"
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                          required
                        />
                      </div>
                    </div>

                    {/* Country */}
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <select
                        id="country"
                        value={shippingAddress.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                        required
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Japan">Japan</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Checkout Button Card */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || cartItems.length === 0 || !isAddressComplete()}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    {isCheckingOut ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <CreditCardIcon className="h-5 w-5 mr-3" />
                        Proceed to Checkout
                      </div>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    By proceeding, you agree to our terms and conditions
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
