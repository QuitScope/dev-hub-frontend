"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Edit, Trash2, ExternalLink, Calendar, Flag, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, type Todo } from "@/lib/api-client"

export function TodoManager() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    category: "Work" as Todo["category"],
    priority: "Medium" as Todo["priority"],
    jira_issue: "",
    due_date: "",
  })

  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = async () => {
    setLoading(true)
    setError(null)

    const response = await apiClient.getTodos()
    if (response.data) {
      const todosData = response.data
      setTodos(Array.isArray(todosData) ? todosData : [])
    } else {
      setError(response.error || "Failed to load todos")
      setTodos([])
    }
    setLoading(false)
  }

  const safeTodos = Array.isArray(todos) ? todos : []
  const filteredTodos = safeTodos.filter((todo) => {
    const matchesSearch =
      todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || todo.category === filterCategory
    const matchesStatus = filterStatus === "all" || todo.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleAddTodo = async () => {
    const todoData = {
      title: newTodo.title,
      description: newTodo.description || undefined,
      category: newTodo.category,
      priority: newTodo.priority,
      status: "Todo" as const,
      jira_issue: newTodo.jira_issue || undefined,
      due_date: newTodo.due_date || undefined,
    }

    const response = await apiClient.createTodo(todoData)
    if (response.data) {
      const newTodoData = response.data
      setTodos([newTodoData, ...todos])
      setNewTodo({
        title: "",
        description: "",
        category: "Work",
        priority: "Medium",
        jira_issue: "",
        due_date: "",
      })
      setIsAddDialogOpen(false)
    } else {
      console.error("Failed to create todo:", response.error)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    let newStatus: Todo["status"]
    if (todo.status === "Todo") newStatus = "In Progress"
    else if (todo.status === "In Progress") newStatus = "Done"
    else newStatus = "Todo"

    const response = await apiClient.updateTodo(id, { status: newStatus })
    if (response.data) {
      const updatedTodo = response.data
      setTodos(todos.map((t) => (t.id === id ? updatedTodo : t)))
    } else {
      console.error("Failed to update todo:", response.error)
    }
  }

  const handleDeleteTodo = async (id: string) => {
    const response = await apiClient.deleteTodo(id)
    if (response.data || !response.error) {
      setTodos(todos.filter((todo) => todo.id !== id))
    } else {
      console.error("Failed to delete todo:", response.error)
    }
  }

  const handleEditTodo = async () => {
    if (!editingTodo) return

    const todoData = {
      title: editingTodo.title,
      description: editingTodo.description || undefined,
      category: editingTodo.category,
      priority: editingTodo.priority,
      status: editingTodo.status,
      jira_issue: editingTodo.jira_issue || undefined,
      due_date: editingTodo.due_date || undefined,
    }

    const response = await apiClient.updateTodo(editingTodo.id, todoData)
    if (response.data) {
      const updatedTodo = response.data
      setTodos(todos.map((t) => (t.id === editingTodo.id ? updatedTodo : t)))
      setEditingTodo(null)
    } else {
      console.error("Failed to update todo:", response.error)
    }
  }

  const getPriorityColor = (priority: Todo["priority"]) => {
    switch (priority) {
      case "High":
        return "text-red-600 dark:text-red-400"
      case "Medium":
        return "text-yellow-600 dark:text-yellow-400"
      case "Low":
        return "text-green-600 dark:text-green-400"
    }
  }

  const getCategoryColor = (category: Todo["category"]) => {
    switch (category) {
      case "Work":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Learning":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "Private":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }

  const getStatusColor = (status: Todo["status"]) => {
    switch (status) {
      case "Todo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "In Progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Done":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading todos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">Failed to load todos</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button onClick={loadTodos} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Learning">Learning</SelectItem>
              <SelectItem value="Private">Private</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Todo">Todo</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Todo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Todo</DialogTitle>
                <DialogDescription>Create a new task to track your progress.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    placeholder="Enter todo title..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newTodo.category}
                      onValueChange={(value: Todo["category"]) => setNewTodo({ ...newTodo, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Work">Work</SelectItem>
                        <SelectItem value="Learning">Learning</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTodo.priority}
                      onValueChange={(value: Todo["priority"]) => setNewTodo({ ...newTodo, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="jira">Jira Issue (Optional)</Label>
                  <Input
                    id="jira"
                    value={newTodo.jira_issue}
                    onChange={(e) => setNewTodo({ ...newTodo, jira_issue: e.target.value })}
                    placeholder="e.g., DEV-123"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due_date">Due Date (Optional)</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTodo.due_date}
                    onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddTodo} disabled={!newTodo.title.trim()}>
                  Add Todo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTodo} onOpenChange={(open) => !open && setEditingTodo(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Todo</DialogTitle>
            <DialogDescription>Make changes to your todo item.</DialogDescription>
          </DialogHeader>
          {editingTodo && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTodo.title}
                  onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                  placeholder="Enter todo title..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTodo.description || ""}
                  onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingTodo.category}
                    onValueChange={(value: Todo["category"]) => setEditingTodo({ ...editingTodo, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Learning">Learning</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={editingTodo.priority}
                    onValueChange={(value: Todo["priority"]) => setEditingTodo({ ...editingTodo, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingTodo.status}
                  onValueChange={(value: Todo["status"]) => setEditingTodo({ ...editingTodo, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todo">Todo</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-jira">Jira Issue (Optional)</Label>
                <Input
                  id="edit-jira"
                  value={editingTodo.jira_issue || ""}
                  onChange={(e) => setEditingTodo({ ...editingTodo, jira_issue: e.target.value })}
                  placeholder="e.g., DEV-123"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-due_date">Due Date (Optional)</Label>
                <Input
                  id="edit-due_date"
                  type="date"
                  value={editingTodo.due_date || ""}
                  onChange={(e) => setEditingTodo({ ...editingTodo, due_date: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTodo(null)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleEditTodo} disabled={!editingTodo?.title.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Todos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeTodos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeTodos.filter((t) => t.status === "In Progress").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeTodos.filter((t) => t.status === "Done").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeTodos.filter((t) => t.priority === "High").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Todo List */}
      <div className="space-y-4">
        {filteredTodos.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground">No todos found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTodos.map((todo) => (
            <Card
              key={todo.id}
              className={cn("transition-all hover:shadow-md", todo.status === "Done" && "opacity-75")}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Checkbox
                      checked={todo.status === "Done"}
                      onCheckedChange={() => handleToggleStatus(todo.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3
                          className={cn("font-medium", todo.status === "Done" && "line-through text-muted-foreground")}
                        >
                          {todo.title}
                        </h3>
                        {todo.jira_issue && (
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {todo.jira_issue}
                          </Button>
                        )}
                      </div>
                      {todo.description && (
                        <p className={cn("text-sm text-muted-foreground", todo.status === "Done" && "line-through")}>
                          {todo.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <Badge className={getCategoryColor(todo.category)}>{todo.category}</Badge>
                        <Badge variant="outline" className={getStatusColor(todo.status)}>
                          {todo.status}
                        </Badge>
                        <div className={cn("flex items-center text-xs", getPriorityColor(todo.priority))}>
                          <Flag className="h-3 w-3 mr-1" />
                          {todo.priority}
                        </div>
                        {todo.due_date && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(todo.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingTodo(todo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTodo(todo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
