"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Mail, Facebook, Loader2, ComputerIcon as Microsoft, Check, AlertCircle,Github, ComputerIcon } from "lucide-react"
import ProgressIndicator from "./progress-indicator"
import { tokenManager } from "@/lib/auth/token-manager"
import { JSX } from "react/jsx-runtime"
import { useRouter } from "next/navigation"

interface RegisterFormProps {
  onSuccess: (email: string) => void
}

interface SocialProviderConfig {
  name :string
  color:string
  icon: JSX.Element
  authEndpoint:string
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter()
  const [isSocialLoading,setIsSocialLoading] = useState<string | null>(null)

  const socialProviders: SocialProviderConfig[] = [
    {
      name: "Google",
      color: "bg-red-500 hover:bg-red-600",
      icon: <Mail className="h-5 w-5" />,
      authEndpoint: "http://localhost:8000/api/v1/auth/google"
    },
    {
      name: "Facebook",
      color: "bg-blue-600 hover:bg-blue-700",
      icon: <Facebook className="h-5 w-5" />,
      authEndpoint: "http://localhost:8000/api/v1/auth/facebook"
    },
    {
      name: "Microsoft",
      color: "bg-blue-500 hover:bg-blue-600",
      icon: <ComputerIcon className="h-5 w-5" />,
      authEndpoint: "http://localhost:8000/api/v1/auth/microsoft"
    }
    ]
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    tenant_name: "",
  })
  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    
  })
  const [touched, setTouched] = useState({
    email: false,
    username: false,
    password: false,
    confirmPassword: false,
    
  })
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [apiError, setApiError] = useState("")

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  })

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  // Update password strength indicators
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: formData.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(formData.password),
      hasLowerCase: /[a-z]/.test(formData.password),
      hasNumber: /[0-9]/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    })
  }, [formData.password])

  // Validate email as user types
  useEffect(() => {
    if (touched.email) {
      if (formData.email.trim() === "") {
        setErrors((prev) => ({ ...prev, email: "Email is required" }))
      } else if (!validateEmail(formData.email)) {
        setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }))
      } else {
        setErrors((prev) => ({ ...prev, email: "" }))
      }
    }
  }, [formData.email, touched.email])

  // Validate password as user types
  useEffect(() => {
    if (touched.password) {
      if (formData.password.trim() === "") {
        setErrors((prev) => ({ ...prev, password: "Password is required" }))
      } else if (!validatePassword(formData.password)) {
        setErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters long" }))
      } else {
        setErrors((prev) => ({ ...prev, password: "" }))
      }
    }
  }, [formData.password, touched.password])

  // Validate confirm password as user types
  useEffect(() => {
    if (touched.confirmPassword) {
      if (formData.confirmPassword !== formData.password) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }))
      }
    }
  }, [formData.confirmPassword, formData.password, touched.confirmPassword])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  const validateForm = () => {
    const newErrors = {
      email: !formData.email ? "Email required" : "",
      username: !formData.username ? "Username required" : "",
      password: !formData.password ? "Password required" : 
               formData.password.length < 8 ? "Minimum 8 characters" : "",
      confirmPassword: formData.confirmPassword !== formData.password ? 
                     "Passwords must match" : ""
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // Effect to handle success navigation when progress reaches 100%
  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        onSuccess(formData.email)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [progress, formData.email, onSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify( 
          {
            email: formData.email,
            password: formData.password,
            username: formData.username,
            tenant_name: formData.tenant_name || undefined

          } ),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }
  
      onSuccess(formData.email);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Registration failed");
    }
  };

  const handleSocialSignup = async (provider: SocialProviderConfig) => {
    setIsSocialLoading(provider.name);
    try {
      // Generate a secure state parameter
      const state = crypto.randomUUID();
      sessionStorage.setItem(`oauth_state_${provider.name}`, state);
      
      // Construct the correct backend URL
      const authUrl = `${provider.authEndpoint}?state=${encodeURIComponent(state)}`;
      console.log("Opening auth URL:", authUrl); // Debug log
      
      const authWindow = window.open(
        authUrl,
        "_blank",
        "width=500,height=600"
      );
  
      // Message handler remains the same
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        // ... rest of your message handling code
      };
  
      window.addEventListener("message", handleMessage);
  
      return () => {
        window.removeEventListener("message", handleMessage);
        authWindow?.close();
      };
    } catch (error) {
      console.error("Social signup error:", error); // Detailed error logging
      setApiError(`Failed to start ${provider.name} authentication`);
    } finally {
      setIsSocialLoading(null);
    }
  };
  

  return (
    <div className="space-y-6">
      {isLoading && <ProgressIndicator progress={progress} fullScreen={true} />}

      <div className="space-y-4">
        {socialProviders.map((provider) => (
          <Button
            key={provider.name}
            variant="outline"
            className={`w-full flex items-center gap-2 ${provider.color} text-white`}
            onClick={() => handleSocialSignup(provider)}
            disabled={!!isSocialLoading}
          >
            {isSocialLoading === provider.name ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {provider.icon}
                <span>Continue with {provider.name}</span>
              </>
            )}
          </Button>
        ))}
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
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="your.email@example.com"
              className={`pr-10 ${touched.email && (errors.email ? "border-red-500 focus:ring-red-500" : validateEmail(formData.email) ? "border-green-500 focus:ring-green-500" : "")}`}
            />
            {touched.email &&
              (errors.email ? (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
              ) : validateEmail(formData.email) ? (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
              ) : null)}
          </div>
          {touched.email && errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="johndoe"
            className={touched.username && errors.username ? "border-red-500" : ""}
          />
          {touched.username && errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tenant_name">Organization (Optional)</Label>
          <Input
            id="tenant_name"
            name="tenant_name"
            value={formData.tenant_name}
            onChange={(e) => setFormData({...formData, tenant_name: e.target.value})}
            placeholder="Your company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Minimum 8 characters"
              className={`pr-10 ${touched.password && (errors.password ? "border-red-500 focus:ring-red-500" : validatePassword(formData.password) ? "border-green-500 focus:ring-green-500" : "")}`}
            />
            {touched.password &&
              (errors.password ? (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
              ) : validatePassword(formData.password) ? (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
              ) : null)}
          
          {touched.password && errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

          {/* Password strength indicators */}
          {touched.password && formData.password.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium">Password strength:</p>
              <ul className="text-xs space-y-1">
                <li
                  className={`flex items-center ${passwordStrength.hasMinLength ? "text-green-500" : "text-gray-400"}`}
                >
                  {passwordStrength.hasMinLength ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <span className="h-3 w-3 mr-1">•</span>
                  )}
                  At least 8 characters
                </li>
                <li
                  className={`flex items-center ${passwordStrength.hasUpperCase ? "text-green-500" : "text-gray-400"}`}
                >
                  {passwordStrength.hasUpperCase ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <span className="h-3 w-3 mr-1">•</span>
                  )}
                  Contains uppercase letter
                </li>
                <li
                  className={`flex items-center ${passwordStrength.hasLowerCase ? "text-green-500" : "text-gray-400"}`}
                >
                  {passwordStrength.hasLowerCase ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <span className="h-3 w-3 mr-1">•</span>
                  )}
                  Contains lowercase letter
                </li>
                <li className={`flex items-center ${passwordStrength.hasNumber ? "text-green-500" : "text-gray-400"}`}>
                  {passwordStrength.hasNumber ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <span className="h-3 w-3 mr-1">•</span>
                  )}
                  Contains number
                </li>
                <li
                  className={`flex items-center ${passwordStrength.hasSpecialChar ? "text-green-500" : "text-gray-400"}`}
                >
                  {passwordStrength.hasSpecialChar ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <span className="h-3 w-3 mr-1">•</span>
                  )}
                  Contains special character
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Confirm your password"
              className={`pr-10 ${touched.confirmPassword && (errors.confirmPassword ? "border-red-500 focus:ring-red-500" : formData.confirmPassword === formData.password && formData.confirmPassword !== "" ? "border-green-500 focus:ring-green-500" : "")}`}
            />
            {touched.confirmPassword &&
              formData.confirmPassword &&
              (errors.confirmPassword ? (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
              ) : formData.confirmPassword === formData.password ? (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
              ) : null)}
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
        </div>

        {apiError && <p className="text-red-500 text-sm">{apiError}</p>}

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          SIGN UP
        </Button>
      </form>
    </div>
  )
}

