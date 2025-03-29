"use client"

import { useState } from "react"
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function TwoFactorToggle() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  const handle2FAToggle = (checked: boolean) => {
    if (checked) {
     
      setShowSetup(true)
    } else {
     
      setIs2FAEnabled(false)
      setShowSetup(false)
    }
  }

  const handleSetupComplete = () => {
    setIs2FAEnabled(true)
    setShowSetup(false)
  }

  const handleCancel = () => {
    setShowSetup(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Label htmlFor="2fa-toggle" className="text-base font-medium">
              Two-Factor Authentication
            </Label>
            <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
          </div>
        </div>
        <Switch id="2fa-toggle" checked={is2FAEnabled || showSetup} onCheckedChange={handle2FAToggle} />
      </div>

      {showSetup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Set Up Two-Factor Authentication
            </CardTitle>
            <CardDescription>Scan the QR code with your authenticator app to enable 2FA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-40 h-40 bg-gray-200 flex items-center justify-center rounded-md">
                <span className="text-sm text-gray-500">QR Code Placeholder</span>
              </div>
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <input
                    id="verification-code"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter 6-digit code"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSetupComplete}>Verify and Enable</Button>
          </CardFooter>
        </Card>
      )}

      {is2FAEnabled && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-md">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-medium">Two-factor authentication is enabled</span>
        </div>
      )}
    </div>
  )
}

