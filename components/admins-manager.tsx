"use client"

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminsManager() {
  const [admins, setAdmins] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')

  const fetchAdmins = async () => {
    const res = await fetch('/api/admin/admins')
    const json = await res.json()
    setAdmins(json.admins||[])
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
      <ul className="space-y-2">
        {admins.map(email=> (
          <li key={email} className="flex justify-between items-center border p-2">
            <span>{email}</span>
            <Button size="sm" variant="destructive" onClick={()=>deleteAdmin(email)}>Delete</Button>
          </li>
        ))}
      </ul>
    </div>
  )
} 