"use client"

import useSWR from 'swr'
import { useSession } from 'next-auth/react'

// /api/admin/admins answers only for admins, so a successful response is itself
// the authorization signal. The previous version compared against
// NEXT_PUBLIC_ADMIN_MAILID, which inlined the superadmin's address into the
// public JS bundle and disagreed with the server's ADMIN_MAILID check.
const fetcher = (url:string)=>fetch(url).then(r=>{
  if (!r.ok) throw new Error('Not authorized')
  return r.json()
})

export function useIsAdmin() {
  const { data: session } = useSession()
  const { data } = useSWR(session?.user ? '/api/admin/admins' : null, fetcher, {
    shouldRetryOnError: false,
  })
  return !!session?.user && Array.isArray(data?.admins)
} 