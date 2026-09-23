"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckSquare,
  Code2,
  ExternalLink,
  Plus,
  Bug,
  AlertTriangle,
  AlertCircle,
} from "lucide-react"
import { apiClient, type Todo } from "@/lib/api-client"
import Link from "next/link"

interface DashboardStats {
  todos: {
    total: number
    open: number
    inProgress: number
    done: number
  }
  snippets: {
    total: number
    categories: number
  }
  jiraIssues: {
    total: number
    inProgress: number
  }
  bugs: {
    total: number
    reported: number
    inProgress: number
    resolved: number
    critical: number
  }
}

export function DashboardWidgets() {
  const [stats, setStats] = useState<DashboardStats>({
    todos: { total: 0, open: 0, inProgress: 0, done: 0 },
    snippets: { total: 0, categories: 0 },
    jiraIssues: { total: 0, inProgress: 0 },
    bugs: { total: 0, reported: 0, inProgress: 0, resolved: 0, critical: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentTodos, setRecentTodos] = useState<Todo[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [todosRes, snippetsRes, jiraRes, bugsRes] = await Promise.all([
        apiClient.getTodos(),
        apiClient.getSnippets(),
        apiClient.getJiraIssues(),
        apiClient.getBugs(),
      ])

      const todos = todosRes.data ?? []
      const snippets = snippetsRes.data ?? []
      const jiraIssues = jiraRes.data ?? []
      const bugs = bugsRes.data ?? []

      const todoStats = {
        total: todos.length,
        open: todos.filter((t) => t.status === "Todo").length,
        inProgress: todos.filter((t) => t.status === "In Progress").length,
        done: todos.filter((t) => t.status === "Done").length,
      }

      // Most recently created todos
      setRecentTodos(
        todos
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3),
      )

      const snippetStats = {
        total: snippets.length,
        categories: new Set(snippets.map((s) => s.language)).size,
      }

      const jiraStats = {
        total: jiraIssues.length,
        inProgress: jiraIssues.filter((j) => j.status.value === "In Progress").length,
      }

      const bugStats = {
        total: bugs.length,
        reported: bugs.filter((b) => b.status === "reported").length,
        inProgress: bugs.filter((b) => b.status === "in_progress").length,
        resolved: bugs.filter((b) => b.status === "resolved").length,
        critical: bugs.filter((b) => b.priority === "critical").length,
      }

      setStats({
        todos: todoStats,
        snippets: snippetStats,
        jiraIssues: jiraStats,
        bugs: bugStats,
      })

      const failedCalls = [todosRes, snippetsRes, jiraRes, bugsRes].filter((r) => r.error).length
      if (failedCalls > 0) {
        setError(`${failedCalls} API endpoint(s) are not available. Some data may be missing.`)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setError("Unable to connect to the API. Please check your Laravel backend.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={loadDashboardData} className="ml-auto bg-transparent">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Todos</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todos.open}</div>
            <p className="text-xs text-muted-foreground">{stats.todos.inProgress} in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Snippets</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.snippets.total}</div>
            <p className="text-xs text-muted-foreground">{stats.snippets.categories} languages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jira Issues</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jiraIssues.total}</div>
            <p className="text-xs text-muted-foreground">{stats.jiraIssues.inProgress} in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bug Reports</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bugs.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.bugs.reported} reported, {stats.bugs.resolved} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Bugs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.bugs.critical}</div>
            <p className="text-xs text-muted-foreground">{stats.bugs.inProgress} in progress</p>
          </CardContent>
        </Card>

        {/* Recent Todos Widget */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Todos</CardTitle>
                <CardDescription>Your latest tasks and progress</CardDescription>
              </div>
              <Link href="/todos">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Todo
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTodos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No todos yet. Create your first todo!</p>
            ) : (
              recentTodos.map((todo) => (
                <div key={todo.id} className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      todo.status === "In Progress"
                        ? "bg-primary"
                        : todo.status === "Done"
                          ? "bg-green-500"
                          : "bg-muted"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{todo.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {todo.category} • {todo.priority} Priority
                    </p>
                  </div>
                  <Badge
                    variant={
                      todo.status === "In Progress" ? "default" : todo.status === "Done" ? "secondary" : "outline"
                    }
                  >
                    {todo.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
