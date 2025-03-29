"use client"

import { useState } from "react"
import LoginForm from "./login-form"
import RegisterForm from "./register-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AuthContainer() {
  const [isLogin, setIsLogin] = useState(true)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")

  const toggleForm = () => {
    setIsLogin(!isLogin)
    setRegistrationSuccess(false)
  }

  const handleRegistrationSuccess = (email: string) => {
    setRegistrationSuccess(true)
    setRegisteredEmail(email)
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader className="text-center">
        <h1 className="text-3xl font-bold">{isLogin ? "Sign In" : "Sign Up"}</h1>
        {isLogin ? (
          <p className="text-muted-foreground mt-2">
            Not registered yet?{" "}
            <button onClick={toggleForm} className="text-blue-500 hover:underline">
              Sign Up
            </button>
          </p>
        ) : (
          <p className="text-muted-foreground mt-2">
            Already have an account?{" "}
            <button onClick={toggleForm} className="text-blue-500 hover:underline">
              Sign In
            </button>
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLogin ? (
          <LoginForm />
        ) : registrationSuccess ? (
          <div className="text-center space-y-4 py-8">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-semibold">Registration Successful!</h2>
            <p className="text-muted-foreground">
              Please confirm your account by clicking the link sent to{" "}
              <span className="font-medium">{registeredEmail}</span>
            </p>
            <button
              onClick={toggleForm}
              className="mt-6 w-full bg-black text-white py-2 rounded-md hover:bg-black/90 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <RegisterForm onSuccess={handleRegistrationSuccess} />
        )}
      </CardContent>
    </Card>
  )
}

