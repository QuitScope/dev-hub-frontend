import { DashboardLayout } from "@/components/dashboard-layout"
import { BugTracker } from "@/components/bug-tracker"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function BugwochePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bugwoche</h1>
            <p className="text-muted-foreground">
              Verwalte und verfolge Fehlerprotokolle für eine effiziente Fehlerbehebung.
            </p>
          </div>
          <BugTracker />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
