import { Suspense } from "react"
import AuthContainer from "@/components/auth/auth-container"
import { Loader } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 bg-dot-white/[0.2]">
      <Suspense fallback={<Loader className="animate-spin" />}>
        <AuthContainer />
      </Suspense>
    </main>
  )
}

