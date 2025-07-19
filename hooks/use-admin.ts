"use client"

import useSWR from 'swr'
import { useSession } from 'next-auth/react'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export function useIsAdmin() {
  const { data: session } = useSession()
  const { data } = useSWR(session?.user ? '/api/admin/admins' : null, fetcher)
  const superAdmin = process.env.NEXT_PUBLIC_ADMIN_MAILID
  const isAdmin = !!session?.user && (session.user.email===superAdmin || (data?.admins||[]).includes(session.user.email))
  return isAdmin
} 