import { DashboardLayout } from "@/components/dashboard-layout"
import { JiraIntegration } from "@/components/jira-integration"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function JiraPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-balance">Jira Integration</h2>
          </div>
          <JiraIntegration />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
