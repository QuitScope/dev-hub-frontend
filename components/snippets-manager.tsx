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
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Code2,
  Tag,
  Calendar,
  Check,
  FileText,
  Loader2,
} from "lucide-react"
import { apiClient, type Snippet } from "@/lib/api-client"

const languages = [
  "javascript",
  "typescript",
  "python",
  "java",
  "css",
  "html",
  "php",
  "sql",
  "bash",
  "yaml",
  "json",
  "markdown",
]

export function SnippetsManager() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLanguage, setFilterLanguage] = useState<string>("all")
  const [filterTag, setFilterTag] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()

  const [newSnippet, setNewSnippet] = useState({
    title: "",
    description: "",
    code: "",
    language: "javascript",
    tags: "",
    jira_issue: "",
  })

  useEffect(() => {
    loadSnippets()
  }, [])

  const loadSnippets = async () => {
    setLoading(true)
    const response = await apiClient.getSnippets()
    if (response.data) {
      const snippetsData = response.data
      const validSnippets = Array.isArray(snippetsData)
        ? snippetsData.map((snippet) => ({
            ...snippet,
            tags: Array.isArray(snippet.tags) ? snippet.tags : [],
          }))
        : []
      setSnippets(validSnippets)
    } else {
      console.error("Failed to load snippets:", response.error)
      setSnippets([])
    }
    setLoading(false)
  }

  const allTags = Array.from(
    new Set(
      Array.isArray(snippets) ? snippets.flatMap((snippet) => (Array.isArray(snippet.tags) ? snippet.tags : [])) : [],
    ),
  )

  const filteredSnippets = Array.isArray(snippets)
    ? snippets.filter((snippet) => {
        const matchesSearch =
          snippet.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          snippet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          snippet.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (Array.isArray(snippet.tags) &&
            snippet.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
        const matchesLanguage = filterLanguage === "all" || snippet.language === filterLanguage
        const matchesTag = filterTag === "all" || (Array.isArray(snippet.tags) && snippet.tags.includes(filterTag))
        return matchesSearch && matchesLanguage && matchesTag
      })
    : []

  const emptySnippetForm = {
    title: "",
    description: "",
    code: "",
    language: "javascript",
    tags: "",
    jira_issue: "",
  }

  const openEditDialog = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setNewSnippet({
      title: snippet.title,
      description: snippet.description ?? "",
      code: snippet.code,
      language: snippet.language,
      tags: snippet.tags.join(", "),
      jira_issue: snippet.jira_issue ?? "",
    })
    setIsAddDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open && editingSnippet) {
      setEditingSnippet(null)
      setNewSnippet(emptySnippetForm)
    }
  }

  const handleSaveSnippet = async () => {
    const snippetData = {
      title: newSnippet.title,
      description: newSnippet.description || undefined,
      code: newSnippet.code,
      language: newSnippet.language,
      tags: newSnippet.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      jira_issue: newSnippet.jira_issue || undefined,
    }

    const response = editingSnippet
      ? await apiClient.updateSnippet(editingSnippet.id, snippetData)
      : await apiClient.createSnippet(snippetData)
    if (response.data) {
      const saved = response.data
      setSnippets(editingSnippet ? snippets.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...snippets])
      setEditingSnippet(null)
      setNewSnippet(emptySnippetForm)
      setIsAddDialogOpen(false)
      toast({
        title: editingSnippet ? "Snippet updated" : "Snippet added",
        description: "Your code snippet has been saved successfully.",
      })
    } else {
      console.error("Failed to save snippet:", response.error)
      toast({
        title: "Failed to save snippet",
        description: response.error || "Could not save the snippet.",
        variant: "destructive",
      })
    }
  }

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      toast({
        title: "Copied to clipboard",
        description: "Code snippet has been copied to your clipboard.",
      })
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSnippet = async (id: string) => {
    const response = await apiClient.deleteSnippet(id)
    if (response.data || !response.error) {
      setSnippets(snippets.filter((snippet) => snippet.id !== id))
      toast({
        title: "Snippet deleted",
        description: "The code snippet has been removed.",
      })
    } else {
      console.error("Failed to delete snippet:", response.error)
      toast({
        title: "Failed to delete",
        description: response.error || "Could not delete the snippet.",
        variant: "destructive",
      })
    }
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      typescript: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      python: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      css: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      html: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      php: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      yaml: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    }
    return colors[language] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading snippets...</span>
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
            placeholder="Search snippets, tags, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterLanguage} onValueChange={setFilterLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Snippet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSnippet ? "Edit Code Snippet" : "Add New Code Snippet"}</DialogTitle>
                <DialogDescription>Save a reusable code snippet with tags for easy searching.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newSnippet.title}
                    onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                    placeholder="Enter snippet title..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newSnippet.description}
                    onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={newSnippet.language}
                    onValueChange={(value) => setNewSnippet({ ...newSnippet, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Textarea
                    id="code"
                    value={newSnippet.code}
                    onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                    placeholder="Paste your code here..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={newSnippet.tags}
                    onChange={(e) => setNewSnippet({ ...newSnippet, tags: e.target.value })}
                    placeholder="React, Hooks, TypeScript (comma separated)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="jira">Jira Issue (Optional)</Label>
                  <Input
                    id="jira"
                    value={newSnippet.jira_issue}
                    onChange={(e) => setNewSnippet({ ...newSnippet, jira_issue: e.target.value })}
                    placeholder="e.g., DEV-123"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleSaveSnippet}
                  disabled={!newSnippet.title.trim() || !newSnippet.code.trim()}
                >
                  {editingSnippet ? "Save Changes" : "Add Snippet"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Snippets</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{snippets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(snippets.map((s) => s.language)).size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTags.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Jira Links</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{snippets.filter((s) => s.jira_issue).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Snippets List */}
      <div className="space-y-4">
        {filteredSnippets.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Code2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No snippets found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSnippets.map((snippet) => (
            <Card key={snippet.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{snippet.title}</h3>
                      {snippet.jira_issue && (
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {snippet.jira_issue}
                        </Button>
                      )}
                    </div>
                    {snippet.description && <p className="text-sm text-muted-foreground">{snippet.description}</p>}
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                      <Badge className={getLanguageColor(snippet.language)}>{snippet.language}</Badge>
                      {Array.isArray(snippet.tags) &&
                        snippet.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(snippet.created_at).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(snippet.code, snippet.id)}
                      className="relative"
                    >
                      {copiedId === snippet.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(snippet)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSnippet(snippet.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code className="font-mono">{snippet.code}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
