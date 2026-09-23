import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardWidgets } from "@/components/dashboard-widgets"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function HomePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-balance">Dashboard</h2>
          </div>
          <DashboardWidgets />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
