"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import LoginForm from "@/components/auth/login-form"
import { useAuth } from "@/lib/auth/auth-context"

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If already authenticated, redirect to dashboard or home
    if (!isLoading && isAuthenticated) {
      const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/dashboard"
      sessionStorage.removeItem("redirectAfterLogin")
      router.push(redirectPath)
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 bg-dot-white/[0.2]">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="text-muted-foreground mt-2">
            Not registered yet?{" "}
            <a href="/register" className="text-blue-500 hover:underline">
              Sign Up
            </a>
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  )
}

