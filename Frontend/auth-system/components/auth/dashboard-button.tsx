import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardButton() {
  return (
    <Button asChild className="w-full">
      <Link href="/dashboard" className="flex items-center justify-center gap-2">
        Access Dashboard
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  )
}

