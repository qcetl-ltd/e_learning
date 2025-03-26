"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Facebook, Loader2, AlertCircle, ComputerIcon as Microsoft, Check } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

// Mock registered users for demo purposes
// this would come from your backend
const REGISTERED_USERS = [
  { email: "user@example.com", password: "Password123!" },
  { email: "test@test.com", password: "Test1234!" },
]

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({ email: "", password: "" })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [formError, setFormError] = useState("")
  const router = useRouter()
  const { login, loginWithSocial, isLoading, error, clearError } = useAuth()

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  // Validate email as user types
  useEffect(() => {
    if (touched.email) {
      if (email.trim() === "") {
        setErrors((prev) => ({ ...prev, email: "Email is required" }))
      } else if (!validateEmail(email)) {
        setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }))
      } else {
        setErrors((prev) => ({ ...prev, email: "" }))
      }
    }
  }, [email, touched.email])

  // Validate password as user types
  useEffect(() => {
    if (touched.password) {
      if (password.trim() === "") {
        setErrors((prev) => ({ ...prev, password: "Password is required" }))
      } else if (!validatePassword(password)) {
        setErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters" }))
      } else {
        setErrors((prev) => ({ ...prev, password: "" }))
      }
    }
  }, [password, touched.password])

  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const validateForm = () => {
    // Mark all fields as touched
    setTouched({ email: true, password: true })

    let isValid = true
    const newErrors = { email: "", password: "" }

    if (!email.trim()) {
      newErrors.email = "Email is required"
      isValid = false
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address"
      isValid = false
    }

    if (!password.trim()) {
      newErrors.password = "Password is required"
      isValid = false
    } else if (!validatePassword(password)) {
      newErrors.password = "Password must be at least 8 characters"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setFormError("")

    if (!validateForm()) return

    // In a real app, this check would be done on the server
    // This is just for demo purposes
    const userExists = REGISTERED_USERS.some((user) => user.email === email && user.password === password)

    if (!userExists) {
      setFormError("Invalid email or password. Please try again.")
      return
    }

    await login(email, password, rememberMe)
  }

  const handleSocialLogin = async (provider: "google" | "facebook" | "microsoft") => {
    clearError()
    setFormError("")
    await loginWithSocial(provider)
  }

  return (
    <div className="space-y-6">
      {(error || formError) && (
        <Alert variant="destructive" className="bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError || error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 bg-red-500 text-white hover:bg-red-600"
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading}
        >
          <Mail className="h-5 w-5" />
          <span>Continue with Google</span>
        </Button>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => handleSocialLogin("facebook")}
          disabled={isLoading}
        >
          <Facebook className="h-5 w-5" />
          <span>Continue with Facebook</span>
        </Button>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => handleSocialLogin("microsoft")}
          disabled={isLoading}
        >
          <Microsoft className="h-5 w-5" />
          <span>Continue with Microsoft</span>
        </Button>
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow">
          <Separator />
        </div>
        <span className="mx-4 bg-white px-2 text-black">or</span>
        <div className="flex-grow">
          <Separator />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Id:</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder="jane.doe@gmail.com"
              required
              className={`pr-10 border-orange-300 focus:border-orange-500 ${
                touched.email &&
                (errors.email
                  ? "border-red-500 focus:ring-red-500"
                  : validateEmail(email)
                    ? "border-green-500 focus:ring-green-500"
                    : "")
              }`}
            />
            {touched.email &&
              email &&
              (errors.email ? (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
              ) : validateEmail(email) ? (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
              ) : null)}
          </div>
          {touched.email && errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password:</Label>
          <div className="relative">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder="Type here"
              required
              className={`pr-10 ${
                touched.password &&
                (errors.password
                  ? "border-red-500 focus:ring-red-500"
                  : validatePassword(password)
                    ? "border-green-500 focus:ring-green-500"
                    : "")
              }`}
            />
            {touched.password &&
              password &&
              (errors.password ? (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
              ) : validatePassword(password) ? (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
              ) : null)}
          </div>
          {touched.password && errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label htmlFor="remember-me" className="text-sm font-normal">
            Remember me
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          SIGN IN
        </Button>

        <div className="text-center">
          <a href="#" className="text-sm text-muted-foreground hover:underline">
            Forgot password?
          </a>
        </div>
      </form>

      {/* Demo credentials helper */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800">Demo Credentials</h3>
        <p className="text-xs text-blue-600 mt-1">For testing, use these credentials:</p>
        <ul className="text-xs text-blue-600 mt-1 space-y-1">
          <li>Email: user@example.com | Password: Password123!</li>
          <li>Email: krishan@gmail.com | Password: 1234567890</li>
        </ul>
      </div>
    </div>
  )
}

