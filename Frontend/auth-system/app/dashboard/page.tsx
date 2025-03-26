"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        <div className="mb-6">
          <p className="text-gray-700">Welcome, {user?.username || "User"}!</p>
          <p className="text-gray-500 text-sm">You are logged in with {user?.email}</p>
        </div>

        <Button onClick={logout} variant="outline" className="text-red-500 border-red-500 hover:bg-red-50">
          Logout
        </Button>
      </div>
    </div>
  )
}

