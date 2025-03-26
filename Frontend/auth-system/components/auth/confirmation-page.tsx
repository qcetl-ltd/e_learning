"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api/api-client'

export default function ConfirmationPage() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        await apiClient.post(`/users/confirm-email/${token}`, {})
        router.push('/dashboard')
      } catch (error) {
        console.error('Confirmation failed:', error)
        router.push('/login?error=confirmation_failed')
      }
    }

    if (token) confirmEmail()
  }, [token, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p>Confirming your email...</p>
      </div>
    </div>
  )
}