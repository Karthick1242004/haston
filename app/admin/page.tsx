"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useIsAdmin } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import PageTransition from '@/components/page-transition'
import Image from 'next/image'
import Header from '@/components/header'
import AdminsManager from '@/components/admins-manager'
import HeroSlidesManager from '@/components/hero-slides-manager'
import { Order } from '@/types/order'
import { ProductColor } from '@/types/product'
import { useToast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Package, ShoppingBag, Users, User, DollarSign, TrendingUp, Calendar, MapPin, CreditCard, Truck, CheckCircle, Clock, Filter, ExternalLink, Edit3, Search, Eye, Trash2, Image as ImageIcon, Plus } from 'lucide-react'

export default function AdminPage() {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [sizes, setSizes] = useState('S,M,L')
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [isLook, setIsLook] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  
  // Color and badge states
  const [productColors, setProductColors] = useState<ProductColor[]>([{name: '', value: '#000000'}])
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [colorMode, setColorMode] = useState<'single' | 'multiple'>('single')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Order management state
  const [currentView, setCurrentView] = useState<'products' | 'orders' | 'hero' | 'admins'>('products')
  const [orders, setOrders] = useState<Order[]>([])
  const [orderStats, setOrderStats] = useState<any>({})
  const [orderFilters, setOrderFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    limit: 10
  })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [orderEditForm, setOrderEditForm] = useState({
    status: '',
    estimatedDelivery: '',
    notes: '',
    timeline: {
      placedDate: '',
      processingDays: '1-2 business days',
      shippedDays: '3-5 business days', 
      deliveredDays: '5-7 business days'
    }
  })
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any>(null)

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const json = await res.json()
      setProducts(json.products || [])
    } catch(err) {
      console.error(err)
    }
  }

  const fetchOrders = async () => {
    try {
      const queryParams = new URLSearchParams({
        status: orderFilters.status,
        search: orderFilters.search,
        page: orderFilters.page.toString(),
        limit: orderFilters.limit.toString()
      })

      const [ordersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/orders?${queryParams}`),
        fetch('/api/admin/orders/stats')
      ])

      const [ordersData, statsData] = await Promise.all([
        ordersRes.json(),
        statsRes.json()
      ])

      if (ordersData.success) {
        setOrders(ordersData.orders)
      }
      if (statsData.success) {
        setOrderStats(statsData.stats)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    }
  }

  const updateOrder = async (orderId: string, updateData: any) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      const json = await res.json()
      if (json.success) {
        await fetchOrders()
        return true
      }
      return false
    } catch(err) {
      console.error('Error updating order:', err)
      return false
    }
  }

  useEffect(() => { fetchProducts() }, [])
  useEffect(() => { 
    if (currentView === 'orders') {
      fetchOrders() 
    }
  }, [currentView, orderFilters])

  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = useIsAdmin()

  if (status === 'loading') return null
  if (!isAdmin) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-[#F1EFEE]">
          <p className="text-lg text-gray-700">Unauthorized</p>
        </div>
      </PageTransition>
    )
  }

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0,5))
    }
  }

  const resetForm = () => {
    try {
      setName('')
      setPrice('')
      setDescription('')
      setSizes('S,M,L')
      setImages([])
      setExistingImages([])
      setIsLook(false)
      setEditId('')
      setProductColors([{name: '', value: '#000000'}])
      setSelectedBadges([])
      setColorMode('single')
    } catch (error) {
      console.error('Error resetting form:', error)
      // Ensure at least basic state is reset
      setProductColors([{name: '', value: '#000000'}])
      setSelectedBadges([])
      setColorMode('single')
    }
  }

  const addColor = () => {
    if (productColors.length < 5) {
      setProductColors([...productColors, {name: '', value: '#000000'}])
    }
  }

  const removeColor = (index: number) => {
    if (productColors.length > 1) {
      setProductColors(productColors.filter((_, i) => i !== index))
    }
  }

  const updateColor = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...productColors]
    updated[index][field] = value
    setProductColors(updated)
  }

  const toggleBadge = (badge: string) => {
    setSelectedBadges(prev => 
      prev.includes(badge) 
        ? prev.filter(b => b !== badge)
        : [...prev, badge]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasImages = images.length > 0 || (mode === 'edit' && existingImages.length > 0)
    
    // Check if at least one color has a non-default value
    const hasValidColors = productColors.some(c => c.value && c.value !== '#000000')
    
    if (!name || !price || !description || !hasImages) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields and ensure at least one image is present",
        variant: "destructive"
      })
      return
    }
    
    if (!hasValidColors) {
      toast({
        title: "Validation Error", 
        description: "Please select at least one color (change from default black)",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('price', price)
      formData.append('description', description)
      formData.append('sizes', sizes)
      formData.append('existingImages', JSON.stringify(existingImages))
      formData.append('isLook', isLook ? 'true' : 'false')
      // Filter colors: be more lenient with validation
      const validColors = productColors.filter((c, index) => {
        // Must have a color value (not default black)
        if (!c.value || c.value === '#000000') return false
        
        // If no name provided, auto-generate one
        if (!c.name || c.name.trim() === '') {
          c.name = colorMode === 'single' ? 'Default' : `Color ${index + 1}`
        }
        
        return true
      })
      
      formData.append('colors', JSON.stringify(validColors))
      formData.append('badges', JSON.stringify(selectedBadges.filter(badge => badge && typeof badge === 'string')))
      
      // Debug logging
      console.log('Form submission debug:')
      console.log('  - Original productColors:', productColors)
      console.log('  - Color mode:', colorMode)
      console.log('  - Filtered validColors:', validColors)
      console.log('  - Has valid colors:', hasValidColors)
      console.log('  - Submitting badges:', selectedBadges)
      images.forEach((file) => formData.append('images', file))

      const url = mode === 'edit' ? `/api/admin/product/${editId}` : '/api/admin/product'
      const method = mode === 'edit' ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        body: formData,
      })

      const json = await res.json()
      if (json.success) {
        toast({
          title: "Success",
          description: mode === 'edit' ? 'Product updated successfully!' : 'Product added successfully!'
        })
        if (mode === 'create' && json.id) {
          router.push(`/product/${json.id}`)
        } else {
          await fetchProducts()
          setMode('list')
          resetForm()
        }
      } else {
        toast({
          title: "Error",
          description: json.error || `Failed to ${mode === 'edit' ? 'update' : 'create'} product`,
          variant: "destructive"
        })
      }
    } catch(err) {
      console.error(err)
      toast({
        title: "Error",
        description: "An error occurred while submitting. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Package className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const handleOrderEdit = (order: Order) => {
    setSelectedOrder(order)
    setOrderEditForm({
      status: order.status,
      estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
      notes: (order as any).adminNotes || '',
      timeline: {
        placedDate: new Date(order.createdAt).toISOString().split('T')[0],
        processingDays: (order as any).timeline?.processingDays || '1-2 business days',
        shippedDays: (order as any).timeline?.shippedDays || '3-5 business days',
        deliveredDays: (order as any).timeline?.deliveredDays || '5-7 business days'
      }
    })
    setIsEditingOrder(true)
    setIsOrderModalOpen(true)
  }

  const handleSaveOrder = async () => {
    if (!selectedOrder) return
    
    const updateData: any = {}
    if (orderEditForm.status !== selectedOrder.status) {
      updateData.status = orderEditForm.status
    }
    if (orderEditForm.estimatedDelivery) {
      updateData.estimatedDelivery = orderEditForm.estimatedDelivery
    }
    if (orderEditForm.notes !== ((selectedOrder as any).adminNotes || '')) {
      updateData.notes = orderEditForm.notes
    }
    
    // Check if timeline data has changed
    const currentTimeline = (selectedOrder as any).timeline || {}
    if (orderEditForm.timeline.processingDays !== (currentTimeline.processingDays || '1-2 business days') ||
        orderEditForm.timeline.shippedDays !== (currentTimeline.shippedDays || '3-5 business days') ||
        orderEditForm.timeline.deliveredDays !== (currentTimeline.deliveredDays || '5-7 business days')) {
      updateData.timeline = orderEditForm.timeline
    }

    const success = await updateOrder(selectedOrder.orderId, updateData)
    if (success) {
      setIsOrderModalOpen(false)
      setIsEditingOrder(false)
      setSelectedOrder(null)
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    
    try {
      const response = await fetch(`/api/admin/product/${productToDelete.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully"
        })
        await fetchProducts()
      } else {
        throw new Error('Failed to delete product')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE] py-20">
        <Header/>
        <div className="max-w-7xl mx-auto bg-white lg:p-10 p-4 shadow-xl border border-gray-200">
          <h1 className="text-3xl font-bold text-blue-950 mb-8" style={{fontFamily:'var(--font-anton)'}}>Admin Dashboard</h1>
          
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'products' | 'orders' | 'hero' | 'admins')} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="hero" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Hero
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Admins
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              {mode === 'list' && (
                <>
                  <div className="flex justify-between flex-wrap items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-blue-950 mb-2">Product Management</h2>
                      <p className="text-gray-600">Manage your product catalog</p>
                    </div>
                    <Button 
                      className="bg-blue-950 text-white mt-2 hover:bg-blue-800 transition-all shadow-lg px-4 py-2"
                      onClick={() => {setMode('create'); resetForm()}}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                       New Product
                    </Button>
                  </div>

                  {products.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Yet</h3>
                      <p className="text-gray-500 mb-6">Start building your catalog by adding your first product</p>
                      <Button 
                        className="bg-blue-950 text-white hover:bg-blue-800"
                        onClick={() => {setMode('create'); resetForm()}}
                      >
                        Add Product
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {products.map(p => (
                        <Card key={p.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                          <div className="relative overflow-hidden">
                            <Image 
                              src={p.image} 
                              alt={p.name} 
                              width={400} 
                              height={300} 
                              className="object-cover w-full h-56 group-hover:scale-105 transition-transform duration-300" 
                              unoptimized
                            />
                            <div className="absolute top-3 right-3 flex gap-2">
                              {p.isLook && (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Look
                                </Badge>
                              )}
                              <Badge className="bg-white/90 text-gray-800">
                                ID: {p.id.slice(-6)}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{p.name}</h3>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{p.description}</p>
                                
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-2xl font-bold text-blue-950">₹{p.price}</div>
                                  <Badge variant="outline" className="text-xs">
                                    {p.images?.length || 1} image{(p.images?.length || 1) > 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>

                              {p.sizes && p.sizes.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-2">Available Sizes:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {p.sizes.slice(0, 6).map((size: string, idx: number) => (
                                      <Badge key={idx} variant="secondary" className="text-xs px-2 py-1">
                                        {size}
                                      </Badge>
                                    ))}
                                    {p.sizes.length > 6 && (
                                      <Badge variant="secondary" className="text-xs px-2 py-1">
                                        +{p.sizes.length - 6}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-3 pt-4 border-t">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex-1 border-blue-950 text-blue-950 hover:bg-blue-950 hover:text-white transition-all"
                                  onClick={() => {
                                    setMode('edit')
                                    setEditId(p.id)
                                    setName(p.name)
                                    setPrice(p.price)
                                    setDescription(p.description)
                                    setSizes(p.sizes.join(','))
                                    setImages([])
                                    setExistingImages(p.images||[])
                                    setIsLook(!!p.isLook)
                                    // Handle both old string format and new object format
                                    if (p.colors) {
                                      console.log('Edit form - Original colors:', p.colors, typeof p.colors)
                                      
                                      // Handle string that looks like JSON
                                      if (typeof p.colors === 'string') {
                                        try {
                                          const parsed = JSON.parse(p.colors)
                                          if (Array.isArray(parsed) && parsed.length > 0) {
                                            setProductColors(parsed.map((color: any) => ({
                                              name: color.name || 'Color',
                                              value: color.value || '#000000'
                                            })))
                                          } else {
                                            setProductColors([{name: '', value: '#000000'}])
                                          }
                                        } catch (e) {
                                          setProductColors([{name: '', value: '#000000'}])
                                        }
                                      } else if (Array.isArray(p.colors)) {
                                        if (p.colors.length > 0) {
                                          // Check if it's the new format (objects) or old format (strings)
                                          if (typeof p.colors[0] === 'object' && p.colors[0].name && p.colors[0].value) {
                                            setProductColors(p.colors)
                                          } else {
                                            // Convert old string format to new object format
                                            setProductColors(p.colors.map((color: any, index: number) => ({
                                              name: typeof color === 'string' ? color : `Color ${index + 1}`,
                                              value: '#000000'
                                            })))
                                          }
                                        } else {
                                          setProductColors([{name: '', value: '#000000'}])
                                        }
                                      } else {
                                        setProductColors([{name: '', value: '#000000'}])
                                      }
                                    } else {
                                      setProductColors([{name: '', value: '#000000'}])
                                    }
                                    // Handle badges safely
                                    if (p.badges) {
                                      console.log('Edit form - Original badges:', p.badges, typeof p.badges)
                                      
                                      if (typeof p.badges === 'string') {
                                        try {
                                          const parsed = JSON.parse(p.badges)
                                          if (Array.isArray(parsed)) {
                                            setSelectedBadges(parsed.filter((badge: any) => badge && typeof badge === 'string'))
                                          } else {
                                            setSelectedBadges([])
                                          }
                                        } catch (e) {
                                          // Handle comma-separated string format
                                          if (p.badges.includes(',')) {
                                            const badges = p.badges.split(',').map((b: string) => b.trim().replace(/"/g, '')).filter((b: string) => b)
                                            setSelectedBadges(badges)
                                          } else {
                                            setSelectedBadges([])
                                          }
                                        }
                                      } else if (Array.isArray(p.badges)) {
                                        setSelectedBadges(p.badges.filter((badge: any) => badge && typeof badge === 'string'))
                                      } else {
                                        setSelectedBadges([])
                                      }
                                    } else {
                                      setSelectedBadges([])
                                    }
                                    setColorMode(p.colors && p.colors.length > 1 ? 'multiple' : 'single')
                                  }}
                                >
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <AlertDialog open={deleteDialogOpen && productToDelete?.id === p.id} onOpenChange={(open) => {
                                  if (!open) {
                                    setDeleteDialogOpen(false)
                                    setProductToDelete(null)
                                  }
                                }}>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all"
                                      onClick={() => {
                                        setProductToDelete(p)
                                        setDeleteDialogOpen(true)
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{p.name}"? This action cannot be undone and will also remove all associated images from storage.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={handleDeleteProduct}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete Product
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="flex-1 text-xs text-gray-600 hover:text-blue-950"
                                  onClick={() => window.open(`/product/${p.id}`, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Preview
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="flex-1 text-xs text-gray-600 hover:text-blue-950"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/product/${p.id}`)
                                    toast({
                                      title: "Success",
                                      description: "Product URL copied to clipboard!"
                                    })
                                  }}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Copy URL
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {(mode === 'create' || mode === 'edit') && (
                <>
                  <Button className="mb-6" variant="outline" onClick={() => {setMode('list'); resetForm()}}>Back to list</Button>
                  <h2 className="text-2xl font-semibold mb-4">{mode === 'create' ? 'Add New Product' : 'Edit Product'}</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-blue-950">Product Name</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-none" required/>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-blue-950">Price (INR)</label>
                      <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-none" required/>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-blue-950">Description</label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded-none" required/>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-blue-950">Sizes (comma separated)</label>
                      <Input value={sizes} onChange={(e) => setSizes(e.target.value)} className="rounded-none"/>
                    </div>
                    <div className="flex items-center gap-3">
                      <input id="isLook" type="checkbox" checked={isLook} onChange={e => setIsLook(e.target.checked)} />
                      <label htmlFor="isLook" className="text-sm">Use in Look Breakdown slider</label>
                    </div>

                    {/* Color Mode Selection */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-blue-950">Color Options</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            value="single" 
                            checked={colorMode === 'single'} 
                            onChange={(e) => {
                              setColorMode('single')
                              if (productColors.length > 1) {
                                setProductColors([productColors[0]])
                              }
                            }}
                          />
                          <span className="text-sm">Single Color (5 images of same color)</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            value="multiple" 
                            checked={colorMode === 'multiple'} 
                            onChange={(e) => setColorMode('multiple')}
                          />
                          <span className="text-sm">Multiple Colors (images must match color order)</span>
                        </label>
                      </div>
                    </div>

                    {/* Color Inputs */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-blue-950">
                        Product Colors (Max 5)
                        {colorMode === 'multiple' && (
                          <span className="block text-xs text-orange-600 mt-1">
                            ⚠️ Important: Upload images in the EXACT same order as colors below. 
                            First color = First set of images, Second color = Second set of images, etc.
                            <br />
                            💡 Tip: Color names are optional - will auto-generate if left empty.
                          </span>
                        )}
                        {colorMode === 'single' && (
                          <span className="block text-xs text-blue-600 mt-1">
                            📝 Note: All 5 images should be of the same color specified below.
                            <br />
                            💡 Tip: Color name is optional - will use "Default" if left empty.
                          </span>
                        )}
                      </label>
                      <div className="space-y-3">
                        {productColors.map((color, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Color {index + 1}:</span>
                              <input
                                type="color"
                                value={color.value}
                                onChange={(e) => updateColor(index, 'value', e.target.value)}
                                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                placeholder="Color name (optional - e.g., Black, Navy Blue)"
                                value={color.name}
                                onChange={(e) => updateColor(index, 'name', e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded text-sm flex-1 min-w-40"
                              />
                            </div>
                            {colorMode === 'multiple' && productColors.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeColor(index)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        {colorMode === 'multiple' && productColors.length < 5 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addColor}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Color (Max 5)
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Badge Selection */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-blue-950">Product Badges</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedBadges.includes('new-arrival')}
                            onChange={() => toggleBadge('new-arrival')}
                          />
                          <span className="text-sm">New Arrival</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedBadges.includes('trendy')}
                            onChange={() => toggleBadge('trendy')}
                          />
                          <span className="text-sm">Trendy</span>
                        </label>
                      </div>
                      {selectedBadges.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs text-gray-600">Preview:</span>
                          {selectedBadges.map(badge => (
                            <span 
                              key={badge}
                              className={`px-2 py-1 text-xs rounded-full ${
                                badge === 'new-arrival' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {badge === 'new-arrival' ? 'New Arrival' : 'Trendy'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="product-images" className="block mb-3 text-sm font-medium text-blue-950">
                        {isLook ? 'Slider image (transparent) + 4 additional images' : 'Images (up to 5)'}
                        <br/><span className="text-xs text-gray-500">{isLook && 'First image should be backgroundless'}</span>
                      </label>
                      <input id="product-images" ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleSelectFiles} className="mb-4" />
                                    <div className="grid grid-cols-5 gap-2">
                        {images.map((file, index) => (
                          <div key={index} className="relative group">
                            <img src={URL.createObjectURL(file)} alt="preview" className="h-24 w-24 object-cover border rounded-lg" />
                            <button 
                              type="button" 
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 text-xs font-bold transition-colors shadow-lg opacity-75 group-hover:opacity-100" 
                              onClick={() => setImages(images.filter((_, i) => i !== index))}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
              </div>
                    </div>
                    
                    {mode === 'edit' && (
                      <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium text-blue-950">
                          Existing Images
                          <span className="text-xs text-gray-500 ml-2">
                            (Click × to remove - images will be deleted from storage)
                          </span>
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {existingImages.map((url, idx) => (
                            <div key={idx} className="relative p-2.5 w-auto rounded-sm group">
                              <img src={url} alt="existing" className="h-24 rounded-sm w-24 object-cover border"/>
                              <button 
                                type="button" 
                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 text-xs font-bold transition-colors shadow-lg opacity-75 group-hover:opacity-100" 
                                onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))}
                                title="Remove image (will be deleted from storage)"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        {existingImages.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No existing images</p>
                        )}
                      </div>
                    )}

                    <div>
                      <Button type="submit" disabled={isSubmitting} className="bg-blue-950 text-white rounded-none w-full py-3">
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              {/* Order Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{orderStats.total || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{(orderStats.totalRevenue || 0).toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{orderStats.pending || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{orderStats.delivered || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search orders by ID, customer, or product..."
                          value={orderFilters.search}
                          onChange={(e) => setOrderFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="md:w-48">
                      <Select value={orderFilters.status} onValueChange={(value) => setOrderFilters(prev => ({ ...prev, status: value, page: 1 }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Orders List */}
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.orderId} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <Badge variant="outline" className="font-mono text-sm">
                              #{order.orderId}
                            </Badge>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status}</span>
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-900">Customer</p>
                              <p className="text-gray-600">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                              <p className="text-gray-600">{order.userEmail}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Items & Total</p>
                              <p className="text-gray-600">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                              <p className="font-medium">₹{order.orderSummary.total.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Delivery</p>
                              <p className="text-gray-600">
                                {order.estimatedDelivery 
                                  ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN')
                                  : 'Not set'
                                }
                              </p>
                              <p className="text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setIsEditingOrder(false)
                              setIsOrderModalOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOrderEdit(order)}
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {orders.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h3>
                    <p className="text-gray-500">
                      {orderFilters.search || orderFilters.status !== 'all' 
                        ? "Try adjusting your search or filter criteria."
                        : "No orders have been placed yet."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Order Detail Modal */}
              <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-blue-950">
                      {isEditingOrder ? 'Edit Order' : 'Order Details'} - #{selectedOrder?.orderId}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {selectedOrder && (
                    <div className="space-y-6 mt-6">
                      {isEditingOrder ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="status">Order Status</Label>
                              <Select value={orderEditForm.status} onValueChange={(value) => setOrderEditForm(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="delivery">Estimated Delivery Date</Label>
                              <Input
                                id="delivery"
                                type="date"
                                value={orderEditForm.estimatedDelivery}
                                onChange={(e) => setOrderEditForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                              />
                            </div>
                          </div>
                                                      <div>
                              <Label htmlFor="notes">Admin Notes</Label>
                              <Textarea
                                id="notes"
                                placeholder="Add internal notes about this order..."
                                value={orderEditForm.notes}
                                onChange={(e) => setOrderEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                              />
                            </div>
                            
                            {/* Timeline Editing */}
                            <div className="space-y-4">
                              <Label className="text-lg font-semibold">Timeline Settings</Label>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor="processingDays">Processing Duration</Label>
                                  <Input
                                    id="processingDays"
                                    value={orderEditForm.timeline.processingDays}
                                    onChange={(e) => setOrderEditForm(prev => ({ 
                                      ...prev, 
                                      timeline: { ...prev.timeline, processingDays: e.target.value }
                                    }))}
                                    placeholder="e.g., 1-2 business days"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="shippedDays">Shipping Duration</Label>
                                  <Input
                                    id="shippedDays"
                                    value={orderEditForm.timeline.shippedDays}
                                    onChange={(e) => setOrderEditForm(prev => ({ 
                                      ...prev, 
                                      timeline: { ...prev.timeline, shippedDays: e.target.value }
                                    }))}
                                    placeholder="e.g., 3-5 business days"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="deliveredDays">Delivery Duration</Label>
                                  <Input
                                    id="deliveredDays"
                                    value={orderEditForm.timeline.deliveredDays}
                                    onChange={(e) => setOrderEditForm(prev => ({ 
                                      ...prev, 
                                      timeline: { ...prev.timeline, deliveredDays: e.target.value }
                                    }))}
                                    placeholder="e.g., 5-7 business days"
                                  />
                                </div>
                              </div>
                            </div>
                          <div className="flex gap-3">
                            <Button onClick={handleSaveOrder} className="bg-blue-950 text-white">
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditingOrder(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Order Overview */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-amber-100 rounded-lg">
                                    <Package className="w-5 h-5 text-blue-950" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Order ID</p>
                                    <p className="font-semibold text-gray-900">#{selectedOrder.orderId}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-green-100 rounded-lg">
                                    <Calendar className="w-5 h-5 text-green-700" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Order Date</p>
                                    <p className="font-semibold text-gray-900">
                                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-blue-700" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Total Amount</p>
                                    <p className="font-semibold text-gray-900">₹{selectedOrder.orderSummary.total.toFixed(2)}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Order Status & Customer Info */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                              <CardHeader>
                                                                 <CardTitle className="flex items-center gap-2">
                                   <Users className="w-5 h-5" />
                                   Customer Information
                                 </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Name</p>
                                  <p className="text-gray-900">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Email</p>
                                  <p className="text-gray-900">{selectedOrder.userEmail}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Phone</p>
                                  <p className="text-gray-900">{selectedOrder.shippingAddress.phone}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Status</p>
                                  <Badge className={getStatusColor(selectedOrder.status)}>
                                    {getStatusIcon(selectedOrder.status)}
                                    <span className="ml-1 capitalize">{selectedOrder.status}</span>
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <MapPin className="w-5 h-5" />
                                  Shipping Address
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <p className="text-gray-900 font-medium">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                                <p className="text-gray-700">{selectedOrder.shippingAddress.address}</p>
                                <p className="text-gray-700">
                                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                                </p>
                                <p className="text-gray-700">{selectedOrder.shippingAddress.country}</p>
                                {selectedOrder.estimatedDelivery && (
                                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                    <p className="text-sm font-medium text-yellow-800">Estimated Delivery</p>
                                    <p className="text-yellow-700">
                                      {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          {/* Order Items */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5" />
                                Order Items ({selectedOrder.items.length})
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {selectedOrder.items.map((item, index) => (
                                  <div key={index} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                                      <p className="text-sm text-gray-600">
                                        Size: {item.selectedSize} • Color: {item.selectedColor}
                                      </p>
                                      <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-4">
                                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                          <span className="text-sm font-medium">₹{item.price.toFixed(2)} each</span>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-semibold text-gray-900">₹{item.subtotal.toFixed(2)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Payment & Order Summary */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <CreditCard className="w-5 h-5" />
                                  Payment Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Payment ID</p>
                                  <p className="text-gray-900 font-mono text-sm">{selectedOrder.paymentDetails.razorpay_payment_id}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Order ID</p>
                                  <p className="text-gray-900 font-mono text-sm">{selectedOrder.paymentDetails.razorpay_order_id}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Amount Paid</p>
                                  <p className="text-gray-900">₹{selectedOrder.paymentDetails.amount.toFixed(2)} {selectedOrder.paymentDetails.currency}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Status</p>
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {selectedOrder.paymentDetails.status}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Subtotal</span>
                                  <span className="font-medium">₹{selectedOrder.orderSummary.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Shipping</span>
                                  <span className="font-medium">
                                    {selectedOrder.orderSummary.shipping === 0 ? "Free" : `₹${selectedOrder.orderSummary.shipping.toFixed(2)}`}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Taxes</span>
                                  <span className="font-medium">₹{selectedOrder.orderSummary.taxes.toFixed(2)}</span>
                                </div>
                                {selectedOrder.orderSummary.discount > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-green-600">
                                      Discount {selectedOrder.orderSummary.discountCode && `(${selectedOrder.orderSummary.discountCode})`}
                                    </span>
                                    <span className="text-green-600 font-medium">-₹{selectedOrder.orderSummary.discount.toFixed(2)}</span>
                                  </div>
                                                                 )}
                                 <div className="border-t border-gray-200 my-3"></div>
                                 <div className="flex justify-between text-lg font-bold">
                                  <span>Total</span>
                                  <span>₹{selectedOrder.orderSummary.total.toFixed(2)}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Order Timeline */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Order Timeline
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* Order Placed */}
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="font-medium text-gray-900">Order Placed</h4>
                                        <p className="text-xs text-gray-600">Order received and confirmed</p>
                                      </div>
                                      <span className="text-xs font-medium text-gray-900">
                                        {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Processing */}
                                <div className="flex items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                                    ['processing', 'shipped', 'delivered'].includes(selectedOrder.status) 
                                      ? 'bg-blue-500' 
                                      : 'bg-gray-300'
                                  }`}>
                                    <Package className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="font-medium text-gray-900">Processing</h4>
                                        <p className="text-xs text-gray-600">Preparing order for shipment</p>
                                      </div>
                                                                             <span className="text-xs text-gray-500">{(selectedOrder as any).timeline?.processingDays || '1-2 business days'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Shipped */}
                                <div className="flex items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                                    ['shipped', 'delivered'].includes(selectedOrder.status) 
                                      ? 'bg-purple-500' 
                                      : 'bg-gray-300'
                                  }`}>
                                    <Truck className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="font-medium text-gray-900">Shipped</h4>
                                        <p className="text-xs text-gray-600">Order is on its way</p>
                                      </div>
                                                                             <span className="text-xs text-gray-500">{(selectedOrder as any).timeline?.shippedDays || '3-5 business days'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Delivered */}
                                <div className="flex items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                                    selectedOrder.status === 'delivered' 
                                      ? 'bg-green-500' 
                                      : 'bg-gray-300'
                                  }`}>
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="font-medium text-gray-900">Delivered</h4>
                                        <p className="text-xs text-gray-600">Order has been delivered</p>
                                      </div>
                                                                             <span className="text-xs text-gray-500">{(selectedOrder as any).timeline?.deliveredDays || '5-7 business days'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Admin Actions */}
                          <div className="flex justify-end gap-3 pt-6 border-t">
                            <Button variant="outline" onClick={() => setIsOrderModalOpen(false)}>
                              Close
                            </Button>
                            <Button onClick={() => setIsEditingOrder(true)} className="bg-blue-950 text-white">
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit Order
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="hero" className="space-y-6">
              <HeroSlidesManager />
            </TabsContent>

            <TabsContent value="admins" className="space-y-6">
              <AdminsManager />
            </TabsContent>
            
          </Tabs>
        </div>
      </div>
    </PageTransition>
  )
} 