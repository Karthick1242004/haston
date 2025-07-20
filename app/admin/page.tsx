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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import PageTransition from '@/components/page-transition'
import Image from 'next/image'
import Header from '@/components/header'
import AdminsManager from '@/components/admins-manager'
import { Order } from '@/types/order'
import { Package, ShoppingBag, Users, DollarSign, TrendingUp, Calendar, MapPin, CreditCard, Truck, CheckCircle, Clock, Filter, ExternalLink, Edit3, Search, Eye, Trash2 } from 'lucide-react'

export default function AdminPage() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [sizes, setSizes] = useState('S,M,L')
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [isLook, setIsLook] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement|null>(null)

  const [mode, setMode] = useState<'list'|'create'|'edit'>('list')
  const [products, setProducts] = useState<any[]>([])
  const [editId, setEditId] = useState<string>('')

  // Order management state
  const [currentView, setCurrentView] = useState<'products' | 'orders'>('products')
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
    notes: ''
  })

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const json = await res.json()
      setProducts(json.products||[])
    } catch(err){ console.error(err)}
  }

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: orderFilters.page.toString(),
        limit: orderFilters.limit.toString(),
        ...(orderFilters.status !== 'all' && { status: orderFilters.status }),
        ...(orderFilters.search && { search: orderFilters.search })
      })
      
      const res = await fetch(`/api/admin/orders?${params}`)
      const json = await res.json()
      
      if (json.success) {
        setOrders(json.orders || [])
        setOrderStats(json.stats || {})
      }
    } catch(err) { 
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

  useEffect(()=>{ fetchProducts() },[])
  useEffect(()=>{ 
    if (currentView === 'orders') {
      fetchOrders() 
    }
  }, [currentView, orderFilters])

  const { data: session, status } = useSession()
  const router = useRouter()

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_MAILID
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // For create mode, require at least one image
    // For edit mode, allow updating without new images if existing images are present
    const hasImages = images.length > 0 || (mode === 'edit' && existingImages.length > 0)
    
    if (!name || !price || !description || !hasImages) {
      alert('Please fill all fields and ensure at least one image is present')
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
      images.forEach((file) => formData.append('images', file))

      const url = mode === 'edit' ? `/api/admin/product/${editId}` : '/api/admin/product'
      const method = mode === 'edit' ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        body: formData,
      })

      const json = await res.json()
      if (json.success) {
        alert(mode === 'edit' ? 'Product updated successfully!' : 'Product added successfully!')
        if (mode === 'create' && json.id) {
          router.push(`/product/${json.id}`)
        } else {
          // Refresh products list and go back to list view
          await fetchProducts()
          setMode('list')
        }
      } else {
        alert(json.error || `Failed to ${mode === 'edit' ? 'update' : 'create'} product`)
      }
    } catch(err) {
      console.error(err)
      alert('Error submitting')
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
      notes: (order as any).adminNotes || ''
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

    const success = await updateOrder(selectedOrder.orderId, updateData)
    if (success) {
      setIsOrderModalOpen(false)
      setIsEditingOrder(false)
      setSelectedOrder(null)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE] py-20">
        <Header/>
        <div className="max-w-7xl mx-auto bg-white p-10 shadow-xl border border-gray-200">
          <h1 className="text-3xl font-bold text-amber-950 mb-8" style={{fontFamily:'var(--font-anton)'}}>Admin Dashboard</h1>
          
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'products' | 'orders')} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Orders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              {mode==='list' && (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-amber-950 mb-2">Product Management</h2>
                      <p className="text-gray-600">Manage your product catalog</p>
                    </div>
                    <Button 
                      className="bg-amber-950 text-white hover:bg-amber-800 transition-all shadow-lg px-6 py-3"
                      onClick={()=>{setMode('create');setName('');setPrice('');setDescription('');setSizes('S,M,L');setImages([]);setExistingImages([]);setIsLook(false);setEditId('')}}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Add New Product
                    </Button>
                  </div>

                  {products.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Yet</h3>
                      <p className="text-gray-500 mb-6">Start building your catalog by adding your first product</p>
                      <Button 
                        className="bg-amber-950 text-white hover:bg-amber-800"
                        onClick={()=>{setMode('create');setName('');setPrice('');setDescription('');setSizes('S,M,L');setImages([]);setExistingImages([]);setIsLook(false);setEditId('')}}
                      >
                        Add Product
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {products.map(p=> (
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
                              {/* Product Info */}
                              <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{p.name}</h3>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{p.description}</p>
                                
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-2xl font-bold text-amber-950">₹{p.price}</div>
                                  <Badge variant="outline" className="text-xs">
                                    {p.images?.length || 1} image{(p.images?.length || 1) > 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>

                              {/* Sizes */}
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

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-4 border-t">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex-1 border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white transition-all"
                                  onClick={()=>{setMode('edit');setEditId(p.id);setName(p.name);setPrice(p.price);setDescription(p.description);setSizes(p.sizes.join(','));setImages([]);setExistingImages(p.images||[]);setIsLook(!!p.isLook)}}
                                >
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all"
                                  onClick={async()=>{
                                    if(window.confirm('Are you sure you want to delete this product?')){
                                      await fetch(`/api/admin/product/${p.id}`,{method:'DELETE'});
                                      await fetchProducts();
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="flex-1 text-xs text-gray-600 hover:text-amber-950"
                                  onClick={() => window.open(`/product/${p.id}`, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Preview
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="flex-1 text-xs text-gray-600 hover:text-amber-950"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/product/${p.id}`)
                                    alert('Product URL copied to clipboard!')
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

                  {session?.user?.email === ADMIN_EMAIL && (
                    <div className="mt-12 border-t pt-6">
                      <h2 className="text-xl font-semibold mb-4">Manage Admins</h2>
                      <AdminsManager />
                    </div>
                  )}
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
                        {/* Order Info */}
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

                        {/* Actions */}
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
            </TabsContent>
          </Tabs>
          {(mode==='create'||mode==='edit') && (
            <>
            <Button className="mb-6" variant="outline" onClick={()=>setMode('list')}>Back to list</Button>
          <h2 className="text-2xl font-semibold mb-4">{mode==='create'? 'Add New Product' : 'Edit Product'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-1 text-sm font-medium text-amber-950">Product Name</label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} className="rounded-none" required/>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-amber-950">Price (USD)</label>
              <Input type="number" min="0" step="0.01" value={price} onChange={(e)=>setPrice(e.target.value)} className="rounded-none" required/>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-amber-950">Description</label>
              <Textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={4} className="rounded-none" required/>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-amber-950">Sizes (comma separated)</label>
              <Input value={sizes} onChange={(e)=>setSizes(e.target.value)} className="rounded-none"/>
            </div>
            <div className="flex items-center gap-3">
              <input id="isLook" type="checkbox" checked={isLook} onChange={e=>setIsLook(e.target.checked)} />
              <label htmlFor="isLook" className="text-sm">Use in Look Breakdown slider</label>
            </div>

            <div>
              <label htmlFor="product-images" className="block mb-3 text-sm font-medium text-amber-950">{isLook ? 'Slider image (transparent) + 4 additional images' : 'Images (up to 5)'}<br/><span className="text-xs text-gray-500">{isLook && 'First image should be backgroundless'}</span></label>
              <input id="product-images" ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleSelectFiles} className="mb-4" />
              <div className="grid grid-cols-5 gap-2">
                {images.map((file,index)=> (
                  <img key={index} src={URL.createObjectURL(file)} alt="preview" className="h-24 w-24 object-cover border" />
                ))}
              </div>
            </div>
            {mode==='edit' && (
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-amber-950">
                  Existing Images
                  <span className="text-xs text-gray-500 ml-2">
                    (Click × to remove - images will be deleted from storage)
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {existingImages.map((url,idx)=>(
                    <div key={idx} className="relative p-2.5 w-auto rounded-sm group">
                      <img src={url} alt="existing" className="h-24 rounded-sm w-24 object-cover border"/>
                      <button 
                        type="button" 
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 text-xs font-bold transition-colors shadow-lg opacity-75 group-hover:opacity-100" 
                        onClick={()=>setExistingImages(existingImages.filter((_,i)=>i!==idx))}
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
              <Button type="submit" disabled={isSubmitting} className="bg-amber-950 text-white rounded-none w-full py-3">
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
          </>
         )}

          {/* Order Detail Modal */}
          <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-amber-950">
                  {isEditingOrder ? 'Edit Order' : 'Order Details'} - #{selectedOrder?.orderId}
                </DialogTitle>
              </DialogHeader>
              
              {selectedOrder && (
                <div className="space-y-6 mt-6">
                  {isEditingOrder ? (
                    // Edit Form
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
                      <div className="flex gap-3">
                        <Button onClick={handleSaveOrder} className="bg-amber-950 text-white">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditingOrder(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Details
                    <div className="space-y-6">
                      {/* Order Status and Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Package className="w-5 h-5" />
                              Order Status
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge className={`${getStatusColor(selectedOrder.status)} text-lg px-3 py-1`}>
                              {getStatusIcon(selectedOrder.status)}
                              <span className="ml-2 capitalize">{selectedOrder.status}</span>
                            </Badge>
                            <div className="mt-4 space-y-2 text-sm">
                              <p><strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}</p>
                              <p><strong>Last Updated:</strong> {new Date(selectedOrder.updatedAt).toLocaleDateString('en-IN')}</p>
                              {selectedOrder.estimatedDelivery && (
                                <p><strong>Estimated Delivery:</strong> {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('en-IN')}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <CreditCard className="w-5 h-5" />
                              Payment Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <p><strong>Transaction ID:</strong> <code className="text-xs">{selectedOrder.paymentDetails.razorpay_payment_id}</code></p>
                            <p><strong>Order ID:</strong> <code className="text-xs">{selectedOrder.paymentDetails.razorpay_order_id}</code></p>
                            <p><strong>Amount:</strong> ₹{selectedOrder.paymentDetails.amount.toFixed(2)}</p>
                            <p><strong>Status:</strong> <Badge className="bg-green-100 text-green-800">Success</Badge></p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <MapPin className="w-5 h-5" />
                              Shipping Address
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1 text-sm">
                            <p><strong>{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</strong></p>
                            <p>{selectedOrder.shippingAddress.address}</p>
                            <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                            <p>{selectedOrder.shippingAddress.country}</p>
                            <p><strong>Phone:</strong> {selectedOrder.shippingAddress.phone}</p>
                            <p><strong>Email:</strong> {selectedOrder.userEmail}</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Order Items */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {selectedOrder.items.map((item, index) => (
                              <div key={index} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="relative w-20 h-24 rounded overflow-hidden bg-gray-100">
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
                                    {item.selectedColor} • {item.selectedSize}
                                  </p>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                                    <div className="text-right">
                                      <p className="font-medium">₹{item.subtotal.toFixed(2)}</p>
                                      <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Order Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span>₹{selectedOrder.orderSummary.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shipping</span>
                              <span>{selectedOrder.orderSummary.shipping === 0 ? 'Free' : `₹${selectedOrder.orderSummary.shipping.toFixed(2)}`}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxes</span>
                              <span>₹{selectedOrder.orderSummary.taxes.toFixed(2)}</span>
                            </div>
                            {selectedOrder.orderSummary.discount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount {selectedOrder.orderSummary.discountCode && `(${selectedOrder.orderSummary.discountCode})`}</span>
                                <span>-₹{selectedOrder.orderSummary.discount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="border-t pt-2 flex justify-between text-lg font-bold">
                              <span>Total</span>
                              <span>₹{selectedOrder.orderSummary.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Admin Notes */}
                      {(selectedOrder as any).adminNotes && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Admin Notes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-700">{(selectedOrder as any).adminNotes}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button onClick={() => setIsEditingOrder(true)} className="bg-amber-950 text-white">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Order
                        </Button>
                        <Button variant="outline" onClick={() => window.open(`/order-success?orderId=${selectedOrder.orderId}`, '_blank')}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Customer View
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageTransition>
  )
} 