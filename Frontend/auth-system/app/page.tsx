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

// import { TwoFactorToggle } from "@/components/auth/two-factor-toggle"
// import { DashboardButton } from "@/components/auth/dashboard-button"

// export default function Home() {
//   return (
//     <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
//       <div className="w-full max-w-md p-6 space-y-6 bg-card rounded-lg shadow-lg border border-border">
//         <div className="space-y-2 text-center">
//           <h1 className="text-2xl font-bold tracking-tight">Account Security</h1>
//           <p className="text-sm text-muted-foreground">Manage your two-factor authentication settings</p>
//         </div>
//         <TwoFactorToggle />
//         <div className="pt-4 border-t border-border">
//           <DashboardButton />
//         </div>
//       </div>
//     </main>
//   )
// }


