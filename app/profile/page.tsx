"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Settings, 
  Heart, 
  ShoppingBag, 
  Edit2, 
  Save, 
  X,
  Plus,
  Trash2,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/header"
import PageTransition from "@/components/page-transition"
import { ExtendedUser, Address } from "@/lib/mongodb"
import Loader from "@/components/loader"

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [userProfile, setUserProfile] = useState<ExtendedUser | null>(null)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchUserProfile()
  }, [session, status, router])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
        setEditForm({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          phone: data.user.phone || '',
          dateOfBirth: data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split('T')[0] : '',
          gender: data.user.gender || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        await fetchUserProfile()
        setIsEditing(false)
      } else {
        console.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditForm = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (status === 'loading') {
    return (
      <PageTransition>
       <Loader/>
      </PageTransition>
    )
  }

  if (!session) {
    return null
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE]">
        {/* Header */}
        <div className="relative bg-white shadow-sm">
          <Header />
        </div>

        <div className="pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-amber-950 hover:text-amber-800 hover:bg-white transition-all rounded-lg px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Header Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardHeader className="bg-white border-b border-gray-200">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            {session.user?.image ? (
                              <Image
                                src={session.user.image}
                                alt={session.user.name || 'User'}
                                width={80}
                                height={80}
                                className="rounded-full ring-4 ring-white shadow-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-amber-950 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                                <User className="w-8 h-8 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold text-amber-950">
                              {userProfile?.firstName && userProfile?.lastName 
                                ? `${userProfile.firstName} ${userProfile.lastName}`
                                : session.user?.name || 'Welcome!'}
                            </h1>
                            <p className="text-gray-600 font-medium">{session.user?.email}</p>
                            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Joined {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Recently'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(!isEditing)}
                          className="border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white transition-all"
                        >
                          {isEditing ? (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </>
                          ) : (
                            <>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Profile
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>

                {/* Personal Information Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardHeader className="bg-white border-b border-gray-200">
                      <CardTitle className="text-xl font-bold text-amber-950 flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                value={editForm.firstName}
                                onChange={(e) => handleEditForm('firstName', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                value={editForm.lastName}
                                onChange={(e) => handleEditForm('lastName', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                value={editForm.phone}
                                onChange={(e) => handleEditForm('phone', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="dateOfBirth">Date of Birth</Label>
                              <Input
                                id="dateOfBirth"
                                type="date"
                                value={editForm.dateOfBirth}
                                onChange={(e) => handleEditForm('dateOfBirth', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={editForm.gender} onValueChange={(value) => handleEditForm('gender', value)}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleSaveProfile}
                              disabled={isLoading}
                              className="bg-amber-950 text-white hover:bg-amber-800 transition-all"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <User className="w-5 h-5 text-amber-950" />
                              <div>
                                <p className="text-sm text-gray-500">Full Name</p>
                                <p className="font-medium">
                                  {userProfile?.firstName && userProfile?.lastName 
                                    ? `${userProfile.firstName} ${userProfile.lastName}`
                                    : 'Not provided'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Phone className="w-5 h-5 text-amber-950" />
                              <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium">{userProfile?.phone || 'Not provided'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <Calendar className="w-5 h-5 text-amber-950" />
                              <div>
                                <p className="text-sm text-gray-500">Date of Birth</p>
                                <p className="font-medium">
                                  {userProfile?.dateOfBirth 
                                    ? new Date(userProfile.dateOfBirth).toLocaleDateString()
                                    : 'Not provided'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <User className="w-5 h-5 text-amber-950" />
                              <div>
                                <p className="text-sm text-gray-500">Gender</p>
                                <p className="font-medium capitalize">
                                  {userProfile?.gender?.replace('-', ' ') || 'Not provided'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Addresses Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardHeader className="bg-white border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-amber-950 flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          Saved Addresses
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white transition-all"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Address
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {userProfile?.addresses && userProfile.addresses.length > 0 ? (
                        <div className="space-y-4">
                          {userProfile.addresses.map((address, index) => (
                            <div
                              key={address.id}
                              className="p-4 border border-gray-200 rounded-lg bg-white"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={address.isDefault ? "default" : "secondary"}>
                                      {address.type}
                                    </Badge>
                                    {address.isDefault && (
                                      <Badge className="bg-green-100 text-green-800">Default</Badge>
                                    )}
                                  </div>
                                  <p className="font-medium">{address.firstName} {address.lastName}</p>
                                  <p className="text-gray-600">{address.address1}</p>
                                  {address.address2 && <p className="text-gray-600">{address.address2}</p>}
                                  <p className="text-gray-600">
                                    {address.city}, {address.state} {address.zipCode}
                                  </p>
                                  <p className="text-gray-600">{address.country}</p>
                                  {address.phone && <p className="text-gray-600">{address.phone}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No addresses saved yet</p>
                          <p className="text-sm text-gray-500">Add an address for faster checkout</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Quick Stats & Actions */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardHeader className="bg-white border-b border-gray-200">
                      <CardTitle className="text-xl font-bold text-amber-950">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <ShoppingBag className="w-5 h-5 text-amber-950" />
                          <span className="font-medium">Orders</span>
                        </div>
                        <Badge className="bg-gray-100 text-gray-800">
                          {userProfile?.orderHistory?.length || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Heart className="w-5 h-5 text-amber-950" />
                          <span className="font-medium">Wishlist</span>
                        </div>
                        <Badge className="bg-gray-100 text-gray-800">
                          {userProfile?.wishlist?.length || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-amber-950" />
                          <span className="font-medium">Addresses</span>
                        </div>
                        <Badge className="bg-gray-100 text-gray-800">
                          {userProfile?.addresses?.length || 0}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardHeader className="bg-white border-b border-gray-200">
                      <CardTitle className="text-xl font-bold text-amber-950">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
                        onClick={() => router.push('/shop')}
                      >
                        <ShoppingBag className="w-4 h-4 mr-3" />
                        Continue Shopping
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
                      >
                        <Heart className="w-4 h-4 mr-3" />
                        View Wishlist
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
                      >
                        <ShoppingBag className="w-4 h-4 mr-3" />
                        Order History
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 