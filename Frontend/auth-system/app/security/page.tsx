import { TwoFactorToggle } from "@/components/auth/two-factor-toggle";
import { DashboardButton } from "@/components/auth/dashboard-button";

export default function SecurityPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
       <div className="w-full max-w-md p-6 space-y-6 bg-card rounded-lg shadow-lg border border-border">
         <div className="space-y-2 text-center">
           <h1 className="text-2xl font-bold tracking-tight">Account Security</h1>
           <p className="text-sm text-muted-foreground">Manage your two-factor authentication settings</p>
         </div>
         <TwoFactorToggle />
         <div className="pt-4 border-t border-border">
           <DashboardButton />
         </div>
       </div>
     </main>
  );
}