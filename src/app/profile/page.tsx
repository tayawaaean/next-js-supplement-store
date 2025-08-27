'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface ProfileForm {
  full_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileForm>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States'
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin')
        return
      }
      loadProfile()
    }
  }, [user, loading, router])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      
      // Load profile data from the users table
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        // If no profile exists, use basic user data
        setProfile({
          full_name: user?.full_name || '',
          email: user?.email || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'United States'
        })
      } else {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          zip_code: profileData.zip_code || '',
          country: profileData.country || 'United States'
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProfileForm, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zip_code: profile.zip_code,
          country: profile.country,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    loadProfile() // Reset to original values
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading your profile...</p>
          </div>
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-lg text-gray-600">Manage your account information and preferences</p>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckIcon className="h-5 w-5 mr-2" />
              ) : (
                <XMarkIcon className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
                    Personal Information
                  </h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                        required
                      />
                    ) : (
                      <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg border">
                        {profile.full_name || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg border flex-1">
                        {profile.email}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                      />
                    ) : (
                      <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg border">
                        {profile.phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter your street address"
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                      />
                    ) : (
                      <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg border">
                        {profile.address || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* City, State, ZIP */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profile.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="City"
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                        />
                      ) : (
                        <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg border">
                          {profile.city || 'Not provided'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profile.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="State"
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                        />
                      ) : (
                        <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg border">
                          {profile.state || 'Not provided'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profile.zip_code}
                          onChange={(e) => handleInputChange('zip_code', e.target.value)}
                          placeholder="ZIP"
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                        />
                      ) : (
                        <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg border">
                          {profile.zip_code || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    {isEditing ? (
                      <select
                        value={profile.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
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
                    ) : (
                      <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg border">
                        {profile.country}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={handleCancel}
                        className="px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </div>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Account Status */}
              <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  Account Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/products')}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Browse Products
                  </button>
                  <button
                    onClick={() => router.push('/orders')}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    View Orders
                  </button>
                  <button
                    onClick={() => signOut('/')}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
