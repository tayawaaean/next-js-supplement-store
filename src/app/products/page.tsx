'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import { 
  CubeIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ShoppingCartIcon,
  StarIcon,
  HeartIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types/database'
import { formatPrice, getProductImageUrl } from '@/lib/utils'
import Link from 'next/link'

interface CartItem {
  product: Product
  quantity: number
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [cart, setCart] = useState<CartItem[]>([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)
  const [showPageNumbers, setShowPageNumbers] = useState(false)
  const ITEMS_PER_PAGE = 20
  
  // Refs for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchTerm, categoryFilter, sortBy])

  // Load cart from localStorage on component mount
  useEffect(() => {
    loadCart()
  }, [])

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart))
    }
  }, [cart])

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loadMoreRef.current && hasMore && !isLoadingMore) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            loadMoreProducts()
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
      )
      
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoadingMore])

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const cartData = JSON.parse(savedCart)
        setCart(cartData)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setCurrentPage(1)
      
      // Get total count first
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      setTotalProducts(count || 0)

      // Fetch first page
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .range(0, ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setProducts(data || [])
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreProducts = async () => {
    if (isLoadingMore || !hasMore) return

    try {
      setIsLoadingMore(true)
      const nextPage = currentPage + 1
      const startIndex = (nextPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE - 1

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .range(startIndex, endIndex)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setProducts(prev => [...prev, ...data])
        setCurrentPage(nextPage)
        setHasMore(data.length === ITEMS_PER_PAGE)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more products:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const filterAndSortProducts = () => {
    let filtered = products

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
  }

  const addToCart = (product: Product) => {
    if (!user) {
      alert('Please sign in to add items to cart')
      return
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id)
      if (existingItem) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prev, { product, quantity: 1 }]
      }
    })
  }

  const getCategories = () => {
    const categories = products.map(product => product.category)
    return ['all', ...Array.from(new Set(categories))]
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
    setHasMore(true)
    // Reset to first page when filters change
    fetchProducts()
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > Math.ceil(totalProducts / ITEMS_PER_PAGE)) return
    
    setCurrentPage(page)
    setHasMore(true)
    
    // Calculate range for the specific page
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE - 1
    
    // Fetch products for specific page
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .range(startIndex, endIndex)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setProducts(data)
          setHasMore(data.length === ITEMS_PER_PAGE)
        }
      })
  }

  const getTotalPages = () => {
    return Math.ceil(totalProducts / ITEMS_PER_PAGE)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading products...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
          <p className="mt-2 text-gray-600">
            Discover our premium selection of supplements and wellness products.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  handleFilterChange()
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {getCategories().map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  handleFilterChange()
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                  setSortBy('name')
                  handleFilterChange()
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <FunnelIcon className="h-4 w-4 inline mr-2" />
                Clear
              </button>
              
              <button
                onClick={() => setShowPageNumbers(!showPageNumbers)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                title="Toggle page numbers"
              >
                {showPageNumbers ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCartIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-900 font-medium">
                  {getCartItemCount()} items in cart
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-blue-900 font-medium">
                  Total: {formatPrice(getCartTotal())}
                </span>
                <Link
                  href="/cart"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  View Cart
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Page Numbers (Optional) */}
        {showPageNumbers && (
          <div className="mb-6 bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)} of {totalProducts} products
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                  const page = Math.max(1, Math.min(getTotalPages() - 4, currentPage - 2)) + i
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= getTotalPages()}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={getProductImageUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
                  <HeartIcon className="h-4 w-4 text-gray-600" />
                </button>
                {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    Low Stock
                  </div>
                )}
                {product.stock_quantity === 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    Out of Stock
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {product.category}
                  </span>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">4.5</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock_quantity === 0}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      product.stock_quantity === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
                
                <div className="mt-3 text-sm text-gray-500">
                  {product.stock_quantity > 0 
                    ? `${product.stock_quantity} units available`
                    : 'No units available'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Section */}
        {hasMore && (
          <div className="text-center py-8" ref={loadMoreRef}>
            {isLoadingMore ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading more products...</span>
              </div>
            ) : (
              <button
                onClick={loadMoreProducts}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Load More Products
              </button>
            )}
          </div>
        )}

        {/* End of Products */}
        {!hasMore && products.length > 0 && (
          <div className="text-center py-8">
            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
              <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">You&apos;ve reached the end!</h3>
              <p className="text-gray-600 mb-4">You&apos;ve seen all {totalProducts} products in our collection.</p>
              <button
                onClick={() => {
                  setCurrentPage(1)
                  setHasMore(true)
                  fetchProducts()
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Back to Top
              </button>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No products available at the moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
