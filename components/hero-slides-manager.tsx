"use client"

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAdminHeroSlides, HeroSlide } from '@/hooks/use-hero-slides'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Move, 
  Eye, 
  EyeOff,
  ImageIcon,
  Loader2
} from 'lucide-react'
import Image from 'next/image'

export default function HeroSlidesManager() {
  const { slides, isLoading, createSlide, updateSlide, deleteSlide, refetch } = useAdminHeroSlides()
  const { toast } = useToast()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    mainText: '',
    subText: '',
    order: 1,
    isActive: true
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setFormData({
      mainText: '',
      subText: '',
      order: 1,
      isActive: true
    })
    setSelectedImage(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const openEditDialog = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setFormData({
      mainText: slide.mainText,
      subText: slide.subText,
      order: slide.order,
      isActive: slide.isActive || true
    })
    setPreviewUrl(slide.image)
    setIsEditDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!selectedImage) {
      toast({
        title: "Error",
        description: "Please select an image",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createSlide({
        ...formData,
        image: selectedImage
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Hero slide created successfully"
        })
        setIsCreateDialogOpen(false)
        resetForm()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create slide",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingSlide) {
      toast({
        title: "Error",
        description: "No slide selected for editing",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateSlide({
        slideId: editingSlide._id!,
        ...formData,
        image: selectedImage || undefined,
        currentImageUrl: editingSlide.image
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Hero slide updated successfully"
        })
        setIsEditDialogOpen(false)
        resetForm()
        setEditingSlide(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update slide",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (slideId: string, mainText: string) => {
    if (!confirm(`Are you sure you want to delete the "${mainText}" slide? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteSlide(slideId)
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Hero slide deleted successfully"
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete slide",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }

  const SlideForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6">
      {/* Image Upload */}
      <div className="space-y-4">
        <Label>Slide Image</Label>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {previewUrl ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm text-gray-600">Click to upload an image</p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          )}
        </div>
                 <input
           ref={fileInputRef}
           type="file"
           accept="image/*"
           onChange={handleImageSelect}
           className="hidden"
           aria-label="Upload hero slide image"
         />
        {!isEdit && !selectedImage && (
          <p className="text-sm text-red-500">Image is required</p>
        )}
      </div>

      {/* Text Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mainText">Main Text (Optional)</Label>
          <Input
            id="mainText"
            value={formData.mainText}
            onChange={(e) => setFormData(prev => ({ ...prev, mainText: e.target.value }))}
            placeholder="e.g., SUMMER (leave empty if not needed)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subText">Sub Text (Optional)</Label>
          <Input
            id="subText"
            value={formData.subText}
            onChange={(e) => setFormData(prev => ({ ...prev, subText: e.target.value }))}
            placeholder="e.g., Collection (leave empty if not needed)"
          />
        </div>
      </div>

      {/* Order and Active Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="order">Display Order</Label>
          <Input
            id="order"
            type="number"
            min="1"
            value={formData.order}
            onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="isActive">Active Status</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <span className="text-sm text-gray-600">
              {formData.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-950" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-amber-950">Hero Slides</h2>
          <p className="text-gray-600">Manage hero section slides and content</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-950 hover:bg-amber-900">
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Hero Slide</DialogTitle>
            </DialogHeader>
            <SlideForm />
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={isSubmitting}
                className="bg-amber-950 hover:bg-amber-900"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Slide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Slides Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {slides.map((slide, index) => (
            <motion.div
              key={slide._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={slide.image}
                    alt={`${slide.mainText} ${slide.subText}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-lg font-bold">{slide.mainText}</h3>
                    <p className="text-sm opacity-90">{slide.subText}</p>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    {slide.isActive ? (
                      <Eye className="w-4 h-4 text-green-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                      #{slide.order}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${slide.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-600">
                        {slide.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(slide)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(slide._id!, slide.mainText)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {slides.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No hero slides yet</p>
          <p className="text-gray-400 mb-4">Create your first slide to get started</p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-950 hover:bg-amber-900">
                <Plus className="w-4 h-4 mr-2" />
                Create First Slide
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Hero Slide</DialogTitle>
          </DialogHeader>
          <SlideForm isEdit />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false)
                resetForm()
                setEditingSlide(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="bg-amber-950 hover:bg-amber-900"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Slide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 