"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function SocialLoginButtons() {
    const router = useRouter()
    
    const handleSocialLogin = (provider: string) => {
        router.push(`/api/auth/${provider}`)
    }

    return (
        <div className="grid grid-cols-3 gap-2">
            <Button 
                variant="outline" 
                onClick={() => handleSocialLogin('google')}
            >
                Google
            </Button>
            <Button 
                variant="outline"
                onClick={() => handleSocialLogin('facebook')}
            >
                Facebook
            </Button>
            <Button 
                variant="outline"
                onClick={() => handleSocialLogin('microsoft')}
            >
                Microsoft
            </Button>
        </div>
    )
}