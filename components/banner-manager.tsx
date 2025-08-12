"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Edit, Plus, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react"
import type { BannerMessage } from "@/types/banner"

export default function BannerManager() {
  const [bannerMessages, setBannerMessages] = useState<BannerMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMessage, setEditingMessage] = useState<BannerMessage | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    text: '',
    icon: '',
    isActive: true,
    order: 0
  })

  // Fetch banner messages
  const fetchBannerMessages = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/banner-messages')
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setBannerMessages(data.bannerMessages || [])
      } else {
        const errorMsg = data.error || data.details || "Failed to fetch banner messages"
        console.error('API returned error:', errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching banner messages:', error)
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch banner messages"
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBannerMessages()
  }, [])

  // Reset form
  const resetForm = () => {
    setFormData({
      text: '',
      icon: '',
      isActive: true,
      order: bannerMessages.length + 1
    })
    setEditingMessage(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.text.trim()) {
      toast({
        title: "Error",
        description: "Banner text is required",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const url = editingMessage 
        ? `/api/admin/banner-messages/${editingMessage._id}`
        : '/api/admin/banner-messages'
      
      const method = editingMessage ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: editingMessage 
            ? "Banner message updated successfully"
            : "Banner message created successfully"
        })
        
        await fetchBannerMessages()
        resetForm()
        setIsDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save banner message",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving banner message:', error)
      toast({
        title: "Error",
        description: "Failed to save banner message",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (messageId: string) => {
    try {
      const response = await fetch(`/api/admin/banner-messages/${messageId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Banner message deleted successfully"
        })
        await fetchBannerMessages()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete banner message",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting banner message:', error)
      toast({
        title: "Error",
        description: "Failed to delete banner message",
        variant: "destructive"
      })
    }
  }

  // Handle edit
  const handleEdit = (message: BannerMessage) => {
    setEditingMessage(message)
    setFormData({
      text: message.text,
      icon: message.icon || '',
      isActive: message.isActive,
      order: message.order
    })
    setIsDialogOpen(true)
  }

  // Handle toggle active
  const handleToggleActive = async (message: BannerMessage) => {
    try {
      const response = await fetch(`/api/admin/banner-messages/${message._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !message.isActive
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Banner message ${!message.isActive ? 'activated' : 'deactivated'}`
        })
        await fetchBannerMessages()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update banner message",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating banner message:', error)
      toast({
        title: "Error",
        description: "Failed to update banner message",
        variant: "destructive"
      })
    }
  }

  // Popular emojis for quick selection
  const popularEmojis = ['🚚', '🔥', '✨', '🔄', '⭐', '💬', '🔒', '⚡', '🎉', '💎', '🚀', '🎯', '💝', '🌟', '🎊', '🏆']

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading banner messages...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-950">Banner Messages</h2>
          <p className="text-gray-600 mt-1">Manage the animated banner messages displayed on your website</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-950 hover:bg-blue-900">
              <Plus className="w-4 h-4 mr-2" />
              Add Banner Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMessage ? 'Edit Banner Message' : 'Add New Banner Message'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Banner Text */}
              <div className="space-y-2">
                <Label htmlFor="text">Banner Text</Label>
                <Textarea
                  id="text"
                  placeholder="Enter banner message text (e.g., FREE SHIPPING ON ORDERS OVER ₹999)"
                  value={formData.text}
                  onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  className="min-h-[80px]"
                  required
                />
              </div>

              {/* Icon Selection */}
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Optional)</Label>
                <div className="space-y-3">
                  <Input
                    id="icon"
                    placeholder="Enter emoji or leave empty"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  />
                  
                  {/* Popular emoji picker */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Quick select:</p>
                    <div className="flex flex-wrap gap-2">
                      {popularEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                          className="p-2 text-xl hover:bg-gray-100 rounded border transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings */}
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
                  <Label htmlFor="isActive">Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <span className="text-sm">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {formData.text && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300 text-black p-3 rounded border">
                    <div className="flex items-center justify-center text-sm font-medium">
                      {formData.icon && (
                        <span className="mr-2">{formData.icon}</span>
                      )}
                      <span>{formData.text}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-950 hover:bg-blue-900"
                >
                  {isSubmitting ? 'Saving...' : editingMessage ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banner Messages List */}
      <div className="space-y-4">
        {bannerMessages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No banner messages found</p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add your first banner message
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {bannerMessages.map((message, index) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className={`${!message.isActive ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Drag handle */}
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        
                        {/* Icon */}
                        {message.icon && (
                          <div className="text-xl">{message.icon}</div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{message.text}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Order: {message.order}
                            </Badge>
                            <Badge 
                              variant={message.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {message.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(message)}
                          title={message.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {message.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(message)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Banner Message</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this banner message? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(message._id!)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Stats */}
      {bannerMessages.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-950">{bannerMessages.length}</p>
                <p className="text-sm text-gray-600">Total Messages</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {bannerMessages.filter(m => m.isActive).length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-400">
                  {bannerMessages.filter(m => !m.isActive).length}
                </p>
                <p className="text-sm text-gray-600">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
