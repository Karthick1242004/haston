"use client"

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SkeletonBox, SkeletonRegion } from '@/components/ui/skeletons'

export default function AdminsManager() {
  const [admins, setAdmins] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchAdmins = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/admins')
      const json = await res.json()
      setAdmins(json.admins||[])
    } catch (err) {
      console.error('Failed to fetch admins:', err)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(()=>{ fetchAdmins() },[])

  const addAdmin = async () => {
    if (!newEmail) return
    await fetch('/api/admin/admins', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:newEmail }) })
    setNewEmail('')
    fetchAdmins()
  }

  const deleteAdmin = async (email:string) => {
    await fetch('/api/admin/admins', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) })
    fetchAdmins()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="admin@example.com" value={newEmail} onChange={e=>setNewEmail(e.target.value)} className="rounded-none"/>
        <Button onClick={addAdmin} className="bg-blue-950 text-white">Add</Button>
      </div>
      {isLoading ? (
        <SkeletonRegion label="Loading admins" className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex justify-between items-center border p-2">
              <SkeletonBox className="h-4 w-56" />
              <SkeletonBox className="h-8 w-16 rounded-md" />
            </div>
          ))}
        </SkeletonRegion>
      ) : admins.length === 0 ? (
        <p className="text-sm text-gray-500 border p-4 text-center">No admins yet. Add one above.</p>
      ) : (
      <ul className="space-y-2">
        {admins.map(email=> (
          <li key={email} className="flex justify-between items-center border p-2">
            <span>{email}</span>
            <Button size="sm" variant="destructive" onClick={()=>deleteAdmin(email)}>Delete</Button>
          </li>
        ))}
      </ul>
      )}
    </div>
  )
} 