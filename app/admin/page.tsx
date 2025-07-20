"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useIsAdmin } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PageTransition from '@/components/page-transition'
import Image from 'next/image'
import Header from '@/components/header'
import AdminsManager from '@/components/admins-manager'

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

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const json = await res.json()
      setProducts(json.products||[])
    } catch(err){ console.error(err)}
  }

  useEffect(()=>{ fetchProducts() },[])

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
    if (!name || !price || !description || images.length === 0) {
      alert('Please fill all fields and select at least one image')
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

      const res = await fetch('/api/admin/product', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (json.success) {
        alert('Product added successfully!')
        router.push(`/product/${json.id}`)
      } else {
        alert(json.error || 'Failed to create product')
      }
    } catch(err) {
      console.error(err)
      alert('Error submitting')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE] py-20">
        <Header/>
        <div className="max-w-5xl mx-auto bg-white p-10 shadow-xl border border-gray-200">
          <h1 className="text-3xl font-bold text-amber-950 mb-8" style={{fontFamily:'var(--font-anton)'}}>Admin Dashboard</h1>
          {mode==='list' && (
            <>
              <Button className="mb-6 bg-amber-950 text-white" onClick={()=>{setMode('create');setName('');setPrice('');setDescription('');setSizes('S,M,L');setImages([])}}>Add New Product</Button>
              <div className="grid md:grid-cols-3 gap-6">
                {products.map(p=> (
                  <div key={p.id} className="border p-4 space-y-2">
                    <Image src={p.image} alt={p.name} width={200} height={250} className="object-cover w-full h-40" unoptimized/>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p>₹{p.price}</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={()=>{setMode('edit');setEditId(p.id);setName(p.name);setPrice(p.price);setDescription(p.description);setSizes(p.sizes.join(','));setImages([]);setExistingImages(p.images||[]);setIsLook(!!p.isLook)}}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={async()=>{await fetch(`/api/admin/product/${p.id}`,{method:'DELETE'});await fetchProducts()}}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>

              {session?.user?.email === ADMIN_EMAIL && (
                <div className="mt-12 border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">Manage Admins</h2>
                  <AdminsManager />
                </div>
              )}
            </>
          )}
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
                <label className="block mb-2 text-sm font-medium text-amber-950">Existing Images</label>
                <div className="grid grid-cols-5 gap-2">
                  {existingImages.map((url,idx)=>(
                    <div key={idx} className="relative p-2.5 w-auto rounded-sm">
                      <img src={url} alt="existing" className="h-24 rounded-sm w-24 object-cover border"/>
                      <button type="button" className="absolute top-1 left-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs" onClick={()=>setExistingImages(existingImages.filter((_,i)=>i!==idx))}>×</button>
                    </div>
                  ))}
                </div>
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
        </div>
      </div>
    </PageTransition>
  )
} 