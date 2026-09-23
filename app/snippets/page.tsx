import { DashboardLayout } from "@/components/dashboard-layout"
import { SnippetsManager } from "@/components/snippets-manager"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function SnippetsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-balance">Code Snippets</h2>
          </div>
          <SnippetsManager />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
