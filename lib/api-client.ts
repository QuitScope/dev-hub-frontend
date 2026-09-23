interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const needsVersioning = !endpoint.startsWith("/auth")
    const url = needsVersioning ? `${this.baseUrl}/v1${endpoint}` : `${this.baseUrl}${endpoint}`

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      })

      const body = response.status === 204 ? null : await response.json()

      if (!response.ok) {
        return { error: body?.message || "API request failed" }
      }

      // Laravel API resources wrap payloads in { data: ... }
      const data = body && typeof body === "object" && "data" in body ? body.data : body

      return { data: data as T }
    } catch (error) {
      console.error("API request failed:", error)
      return { error: "Network error occurred" }
    }
  }

  // Todo API methods
  async getTodos() {
    return this.request<Todo[]>("/todos")
  }

  async createTodo(todo: Omit<Todo, "id" | "created_at" | "updated_at">) {
    return this.request<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify(todo),
    })
  }

  async updateTodo(id: string, updates: Partial<Todo>) {
    return this.request<Todo>(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async deleteTodo(id: string) {
    return this.request<{ message: string }>(`/todos/${id}`, {
      method: "DELETE",
    })
  }

  // Snippets API methods
  async getSnippets() {
    return this.request<Snippet[]>("/snippets")
  }

  async createSnippet(snippet: Omit<Snippet, "id" | "created_at" | "updated_at">) {
    return this.request<Snippet>("/snippets", {
      method: "POST",
      body: JSON.stringify(snippet),
    })
  }

  async updateSnippet(id: string, updates: Partial<Snippet>) {
    return this.request<Snippet>(`/snippets/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async deleteSnippet(id: string) {
    return this.request<{ message: string }>(`/snippets/${id}`, {
      method: "DELETE",
    })
  }

  // Time Entries API methods
  async getTimeEntries() {
    return this.request<TimeEntry[]>("/time-entries")
  }

  async getActiveTimer() {
    return this.request<TimeEntry | null>("/time-entries/active")
  }

  async startTimer(entry: { title: string; description?: string; category: string; jiraIssue?: string }) {
    return this.request<TimeEntry>("/time-entries/start", {
      method: "POST",
      body: JSON.stringify(entry),
    })
  }

  async stopTimer(id: string) {
    return this.request<TimeEntry>(`/time-entries/${id}/stop`, {
      method: "POST",
    })
  }

  async createTimeEntry(entry: Omit<TimeEntry, "id" | "createdAt">) {
    return this.request<TimeEntry>("/time-entries", {
      method: "POST",
      body: JSON.stringify(entry),
    })
  }

  async updateTimeEntry(id: string, updates: Partial<TimeEntry>) {
    return this.request<TimeEntry>(`/time-entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async deleteTimeEntry(id: string) {
    return this.request<{ message: string }>(`/time-entries/${id}`, {
      method: "DELETE",
    })
  }

  // Jira API methods
  async getJiraIssues() {
    return this.request<JiraIssue[]>("/jira/issues")
  }

  async syncJiraIssues() {
    return this.request<{ message: string; synced: number }>("/jira/issues/sync", {
      method: "POST",
    })
  }

  async getJiraIssue(issueKey: string) {
    return this.request<JiraIssue>(`/jira/issues/${issueKey}`)
  }

  async getJiraNotes(jiraIssueKey?: string) {
    const query = jiraIssueKey ? `?jiraIssueKey=${jiraIssueKey}` : ""
    return this.request<JiraNote[]>(`/jira/notes${query}`)
  }

  async createJiraNote(note: { jira_issue_id: string; note: string }) {
    return this.request<JiraNote>("/jira/notes", {
      method: "POST",
      body: JSON.stringify(note),
    })
  }

  async updateJiraNote(noteId: string, updates: { note: string }) {
    return this.request<JiraNote>(`/jira/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async deleteJiraNote(noteId: string) {
    return this.request<{ message: string }>(`/jira/notes/${noteId}`, {
      method: "DELETE",
    })
  }

  async getJiraSettings() {
    return this.request<JiraSettings>("/jira/settings")
  }

  async updateJiraSettings(settings: JiraSettingsInput) {
    return this.request<JiraSettings>("/jira/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  // Bug API methods
  async getBugs() {
    return this.request<BugReport[]>("/bugs")
  }

  async createBug(bug: Omit<BugReport, "id">) {
    return this.request<BugReport>("/bugs", {
      method: "POST",
      body: JSON.stringify(bug),
    })
  }

  async updateBug(id: string, updates: Partial<BugReport>) {
    return this.request<BugReport>(`/bugs/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async deleteBug(id: string) {
    return this.request<{ message: string }>(`/bugs/${id}`, {
      method: "DELETE",
    })
  }
}

// Types (mirror the Dev Hub API resources)
export interface Todo {
  id: string
  title: string
  description?: string | null
  category: "Private" | "Work" | "Learning"
  priority: "Low" | "Medium" | "High"
  status: "Todo" | "In Progress" | "Done"
  jira_issue?: string | null
  due_date?: string | null
  created_at: string
  updated_at: string
}

export interface Snippet {
  id: string
  title: string
  description?: string | null
  code: string
  language: string
  tags: string[]
  jira_issue?: string | null
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: string
  title: string
  description?: string
  category: "Work" | "Learning" | "Private"
  startTime: string
  endTime?: string
  duration: number
  jiraIssue?: string
  isActive: boolean
  createdAt: string
}

export interface JiraIssue {
  id: string
  jira_id: string
  jira_key: string
  summary: string
  description?: string | null
  status: { value: string; color: string; is_completed: boolean }
  priority: { value: string; numeric_value: number; color: string }
  issue_type: { value: string; icon: string; color: string }
  assignee?: string | null
  url: string
  jira_created_at?: string | null
  jira_updated_at?: string | null
  created_at?: string
  updated_at?: string
  notes?: JiraNote[]
}

export interface JiraNote {
  id: string
  note: string
  user_id: number
  jira_issue_id: string
  created_at?: string
  updated_at?: string
}

export interface BugReport {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  status: "reported" | "in_progress" | "resolved" | "closed"
  reportedDate: string
  processedDate?: string
  resolvedDate?: string
  reporter: string
  assignee?: string
  jiraIssue?: string
  tags: string[]
}

export interface JiraSettings {
  id?: string
  jira_url?: string | null
  jira_email?: string | null
  sync_enabled?: boolean
  last_sync_at?: string | null
  is_configured: boolean
  can_sync?: boolean
  has_api_token?: boolean
  created_at?: string
  updated_at?: string
}

export interface JiraSettingsInput {
  jira_url?: string
  jira_email?: string
  jira_api_token?: string
  sync_enabled?: boolean
}

// Export singleton instance
export const apiClient = new ApiClient()
