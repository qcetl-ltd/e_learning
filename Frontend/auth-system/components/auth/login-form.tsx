"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient } from "@/lib/api/api-client"
import { Loader2 } from "lucide-react"

interface LoginResponse {
  access_token?: string
  refresh_token?: string
  otp_required?: boolean
  temp_token?: string
  requires_2fa_setup?: boolean
}

interface Verify2FAResponse {
  access_token: string
  refresh_token: string
}

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [error, setError] = useState("")
  const [tempToken, setTempToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("")

      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password:password
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
      }
  
      const result = await response.json();

       // Handle different login scenarios
      if (result.otp_required && result.temp_token) {
        // Existing 2FA flow
        setTempToken(result.temp_token);
        setStep("otp");
      } else if (result.requires_2fa_setup) {
        // New user needs to setup 2FA
        localStorage.setItem("access_token", result.access_token || "");
        localStorage.setItem("refresh_token", result.refresh_token || "");
        router.push("/dashboard");
      } else if (result.access_token) {
        // Regular login success
        localStorage.setItem("access_token", result.access_token);
        localStorage.setItem("refresh_token", result.refresh_token || "");
        router.push("/security");
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setError("")
      const response = await apiClient.post<Verify2FAResponse>(
        "/auth/verify-2fa",
        { 
          code: otpCode 
        },
        false,
        {
          headers: {
            Authorization: `Bearer ${tempToken}`
          }
        }
      )

      localStorage.setItem("access_token", response.access_token)
      localStorage.setItem("refresh_token", response.refresh_token)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <Label htmlFor="remember-me" className="text-sm font-medium">
            Remember me
          </Label>
        </div>
        
        <Button 
  type="submit"
  className="w-full bg-blue-600 text-white hover:bg-blue-700"
  disabled={isLoading}
>

          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <a href="/forgot-password" className="hover:underline">
            Forgot password?
          </a>
        </div>
      </form>
    </div>
  )
}