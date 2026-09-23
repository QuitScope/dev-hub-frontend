"use client"

import { useState, useEffect, useRef } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ExternalLink,
  Search,
  Plus,
  Trash2,
  Calendar,
  User,
  Flag,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Edit,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, type JiraIssue, type JiraNote, type JiraSettings } from "@/lib/api-client"

export function JiraIntegration() {
  const [issues, setIssues] = useState<JiraIssue[]>([])
  const [notes, setNotes] = useState<JiraNote[]>([])
  const [settings, setSettings] = useState<JiraSettings | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<JiraNote | null>(null)
  const [newNote, setNewNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  const [settingsForm, setSettingsForm] = useState({
    jira_url: "",
    jira_email: "",
    jira_api_token: "",
  })

  const hasLoadedDataRef = useRef(false)

  // Status, priority and type come as { value, ... } objects from the API
  const getStringValue = (value: { value: string } | string | null | undefined): string =>
    typeof value === "string" ? value : (value?.value ?? "")

  const getIssueKey = (issue: JiraIssue): string => issue.jira_key || "N/A"

  const getIssueType = (issue: JiraIssue) => issue.issue_type

  useEffect(() => {
    if (!hasLoadedDataRef.current) {
      loadJiraData()
      hasLoadedDataRef.current = true
    }
  }, [])

  const loadJiraData = async () => {
    setIsLoading(true)

    // Load settings
    const settingsResponse = await apiClient.getJiraSettings()
    if (settingsResponse.data) {
      const settingsData = settingsResponse.data
      setSettings(settingsData)
      setSettingsForm({
        jira_url: settingsData.jira_url || "",
        jira_email: settingsData.jira_email || "",
        jira_api_token: "",
      })
    }

    // Load issues
    const issuesResponse = await apiClient.getJiraIssues()
    if (issuesResponse.data) {
      setIssues(issuesResponse.data)
      // Notes are eager-loaded with each issue
      setNotes(issuesResponse.data.flatMap((issue) => issue.notes ?? []))
    } else if (issuesResponse.error) {
      toast({
        title: "Fehler beim Laden der Issues",
        description: issuesResponse.error,
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const formatDate = (dateValue: string | null | undefined): string => {
    if (!dateValue) return "Kein Datum"

    try {
      const date = new Date(dateValue)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date value:", dateValue)
        return "Ungültiges Datum"
      }
      return date.toLocaleDateString("de-DE")
    } catch (error) {
      console.error("Error formatting date:", dateValue, error)
      return "Ungültiges Datum"
    }
  }

  const formatDateTime = (dateValue: string | null | undefined): string => {
    if (!dateValue) return "Kein Datum"

    try {
      const date = new Date(dateValue)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date value:", dateValue)
        return "Ungültiges Datum"
      }
      return `${date.toLocaleDateString("de-DE")} um ${date.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    } catch (error) {
      console.error("Error formatting date:", dateValue, error)
      return "Ungültiges Datum"
    }
  }

  const filteredIssues = issues.filter((issue) => {
    const issueKey = getIssueKey(issue)
    const matchesSearch =
      issue.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issueKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || getStringValue(issue.status) === filterStatus
    const matchesPriority = filterPriority === "all" || getStringValue(issue.priority) === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const myIssues = filteredIssues.filter((issue) => issue.assignee)
  const inProgressIssues = myIssues.filter((issue) => getStringValue(issue.status) === "In Progress")

  const handleRefreshIssues = async () => {
    setIsSyncing(true)

    const response = await apiClient.syncJiraIssues()
    if (response.data) {
      toast({
        title: "Issues synchronisiert",
        description: `Issues wurden von Jira synchronisiert.`,
      })
      await loadJiraData()
    } else if (response.error) {
      toast({
        title: "Synchronisierung fehlgeschlagen",
        description: response.error,
        variant: "destructive",
      })
    }

    setIsSyncing(false)
  }

  const handleAddNote = async () => {
    if (!selectedIssue || !newNote.trim()) return

    const response = await apiClient.createJiraNote({
      jira_issue_id: selectedIssue.id,
      note: newNote,
    })

    if (response.data) {
      setNotes([response.data, ...notes])
      setNewNote("")
      setIsNoteDialogOpen(false)
      toast({
        title: "Notiz hinzugefügt",
        description: `Persönliche Notiz zu ${selectedIssue.jira_key} hinzugefügt.`,
      })
    } else if (response.error) {
      toast({
        title: "Fehler beim Hinzufügen",
        description: response.error,
        variant: "destructive",
      })
    }
  }

  const handleEditNote = async () => {
    if (!editingNote || !newNote.trim()) return

    const response = await apiClient.updateJiraNote(editingNote.id, {
      note: newNote,
    })

    if (response.data) {
      setNotes(notes.map((note) => (note.id === editingNote.id ? response.data! : note)))
      setNewNote("")
      setEditingNote(null)
      setIsEditNoteDialogOpen(false)
      toast({
        title: "Notiz aktualisiert",
        description: "Die Notiz wurde erfolgreich aktualisiert.",
      })
    } else if (response.error) {
      toast({
        title: "Fehler beim Aktualisieren",
        description: response.error,
        variant: "destructive",
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    const response = await apiClient.deleteJiraNote(noteId)
    if (response.data) {
      setNotes(notes.filter((note) => note.id !== noteId))
      toast({
        title: "Notiz gelöscht",
        description: "Die persönliche Notiz wurde entfernt.",
      })
    } else if (response.error) {
      toast({
        title: "Fehler beim Löschen",
        description: response.error,
        variant: "destructive",
      })
    }
  }

  const handleSaveSettings = async () => {
    const response = await apiClient.updateJiraSettings(settingsForm)
    if (response.data) {
      const settingsData = response.data
      setSettings(settingsData)
      setIsSettingsDialogOpen(false)
      toast({
        title: "Einstellungen gespeichert",
        description: "Jira-Einstellungen wurden erfolgreich aktualisiert.",
      })
    } else if (response.error) {
      toast({
        title: "Fehler beim Speichern",
        description: response.error,
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: JiraIssue["status"]) => {
    if (!status) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"

    const statusName = getStringValue(status)

    switch (statusName.toLowerCase()) {
      case "to do":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "in progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "in review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getPriorityColor = (priority: JiraIssue["priority"]) => {
    if (!priority) return "text-gray-600 dark:text-gray-400"

    const priorityName = getStringValue(priority)

    switch (priorityName.toLowerCase()) {
      case "high":
      case "highest":
        return "text-red-600 dark:text-red-400"
      case "medium":
        return "text-yellow-600 dark:text-yellow-400"
      case "low":
      case "lowest":
        return "text-green-600 dark:text-green-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getIssueTypeIcon = (issueType: JiraIssue["issue_type"] | undefined) => {
    if (!issueType) {
      return <Clock className="h-4 w-4 text-gray-500" />
    }

    if (issueType.icon) {
      return <span className="text-base">{issueType.icon}</span>
    }

    const typeName = getStringValue(issueType)

    switch (typeName.toLowerCase()) {
      case "bug":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "story":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "task":
        return <Clock className="h-4 w-4 text-green-500" />
      case "improvement":
      case "epic":
        return <Flag className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getIssueNotes = (issueId: string) => notes.filter((note) => note.jira_issue_id === issueId)

  const getIssueKeyById = (issueId: string) => issues.find((issue) => issue.id === issueId)?.jira_key ?? "N/A"

  if (!settings?.is_configured && !isSettingsDialogOpen) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Jira nicht konfiguriert</h3>
            <p className="text-muted-foreground text-center mb-4">
              Bitte konfigurieren Sie Ihre Jira-Verbindung, um Issues zu synchronisieren.
            </p>
            <Button onClick={() => setIsSettingsDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Jira konfigurieren
            </Button>
          </CardContent>
        </Card>

        {/* Settings Dialog */}
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Jira-Einstellungen</DialogTitle>
              <DialogDescription>
                Konfigurieren Sie Ihre Jira-Verbindung, um Issues zu synchronisieren.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="jira_url">Jira URL</Label>
                <Input
                  id="jira_url"
                  value={settingsForm.jira_url}
                  onChange={(e) => setSettingsForm({ ...settingsForm, jira_url: e.target.value })}
                  placeholder="https://yourcompany.atlassian.net"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jira_email">Jira E-Mail</Label>
                <Input
                  id="jira_email"
                  type="email"
                  value={settingsForm.jira_email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, jira_email: e.target.value })}
                  placeholder="your-email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jira_api_token">API Token</Label>
                <Input
                  id="jira_api_token"
                  type="password"
                  value={settingsForm.jira_api_token}
                  onChange={(e) => setSettingsForm({ ...settingsForm, jira_api_token: e.target.value })}
                  placeholder="Ihr Jira API Token"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSaveSettings}>
                Einstellungen speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-issues" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="my-issues">Meine Issues</TabsTrigger>
            <TabsTrigger value="all-issues">Alle Issues</TabsTrigger>
            <TabsTrigger value="notes">Persönliche Notizen</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button onClick={handleRefreshIssues} disabled={isSyncing} variant="outline">
              <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
              Synchronisieren
            </Button>
            <Button onClick={() => setIsSettingsDialogOpen(true)} variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="my-issues" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meine Issues</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myIssues.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Bearbeitung</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressIssues.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hohe Priorität</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    myIssues.filter((issue) => {
                      const priority = getStringValue(issue.priority)
                      return priority === "High" || priority === "Highest"
                    }).length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mit Notizen</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myIssues.filter((issue) => getIssueNotes(issue.id).length > 0).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Issues List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Meine aktuellen Issues</h3>
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : myIssues.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Keine Issues zugewiesen</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              myIssues.map((issue) => {
                const issueNotes = getIssueNotes(issue.id)
                const issueType = getIssueType(issue)
                const issueKey = getIssueKey(issue)
                return (
                  <Card key={issue.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getIssueTypeIcon(issueType)}
                            <Badge variant="outline" className="font-mono text-xs">
                              {issueKey}
                            </Badge>
                            <h3 className="font-medium flex-1">{issue.summary}</h3>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" asChild>
                              <a href={issue.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                          {issue.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
                          )}
                          <div className="flex items-center space-x-4 flex-wrap gap-2">
                            <Badge className={getStatusColor(issue.status)}>{getStringValue(issue.status)}</Badge>
                            <div className={cn("flex items-center text-xs", getPriorityColor(issue.priority))}>
                              <Flag className="h-3 w-3 mr-1" />
                              {getStringValue(issue.priority)}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(issue.jira_updated_at)}
                            </div>
                            {issueNotes.length > 0 && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {issueNotes.length} Notiz{issueNotes.length !== 1 ? "en" : ""}
                              </div>
                            )}
                          </div>
                          {issueNotes.length > 0 && (
                            <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
                              <p className="text-sm font-medium">Persönliche Notizen:</p>
                              {issueNotes.map((note) => (
                                <div key={note.id} className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">{note.note}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatDateTime(note.created_at)}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingNote(note)
                                        setNewNote(note.note)
                                        setIsEditNoteDialogOpen(true)
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Dialog
                            open={isNoteDialogOpen && selectedIssue?.id === issue.id}
                            onOpenChange={(open) => {
                              setIsNoteDialogOpen(open)
                              if (open) {
                                setSelectedIssue(issue)
                                setNewNote("")
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Notiz
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Persönliche Notiz hinzufügen</DialogTitle>
                                <DialogDescription>
                                  Fügen Sie eine persönliche Notiz für {issueKey} - {issue.summary} hinzu
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="note">Notiz</Label>
                                  <Textarea
                                    id="note"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Fügen Sie Ihre persönliche Notiz zu diesem Issue hinzu..."
                                    rows={4}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit" onClick={handleAddNote} disabled={!newNote.trim()}>
                                  Notiz hinzufügen
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="all-issues" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Issues durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priorität" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Prioritäten</SelectItem>
                  <SelectItem value="Highest">Highest</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Lowest">Lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* All Issues List */}
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : filteredIssues.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Keine Issues gefunden</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredIssues.map((issue) => {
                const issueType = getIssueType(issue)
                const issueKey = getIssueKey(issue)
                return (
                  <Card key={issue.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getIssueTypeIcon(issueType)}
                            <Badge variant="outline" className="font-mono text-xs">
                              {issueKey}
                            </Badge>
                            <h3 className="font-medium flex-1">{issue.summary}</h3>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" asChild>
                              <a href={issue.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                          {issue.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
                          )}
                          <div className="flex items-center space-x-4 flex-wrap gap-2">
                            <Badge className={getStatusColor(issue.status)}>{getStringValue(issue.status)}</Badge>
                            <div className={cn("flex items-center text-xs", getPriorityColor(issue.priority))}>
                              <Flag className="h-3 w-3 mr-1" />
                              {getStringValue(issue.priority)}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <User className="h-3 w-3 mr-1" />
                              {getStringValue(issue.assignee) || "Nicht zugewiesen"}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(issue.jira_updated_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Persönliche Notizen</h3>
            <p className="text-sm text-muted-foreground">Notizen werden auf dem Server gespeichert</p>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : notes.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Noch keine persönlichen Notizen</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fügen Sie Notizen zu Jira-Issues im Tab &bdquo;Meine Issues&ldquo; hinzu
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              notes.map((note) => (
                <Card key={note.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{getIssueKeyById(note.jira_issue_id)}</Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDateTime(note.created_at)}
                          </div>
                        </div>
                        <p className="text-sm">{note.note}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingNote(note)
                            setNewNote(note.note)
                            setIsEditNoteDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Jira-Einstellungen</DialogTitle>
            <DialogDescription>Konfigurieren Sie Ihre Jira-Verbindung.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="jira_url">Jira URL</Label>
              <Input
                id="jira_url"
                value={settingsForm.jira_url}
                onChange={(e) => setSettingsForm({ ...settingsForm, jira_url: e.target.value })}
                placeholder="https://yourcompany.atlassian.net"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jira_email">Jira E-Mail</Label>
              <Input
                id="jira_email"
                type="email"
                value={settingsForm.jira_email}
                onChange={(e) => setSettingsForm({ ...settingsForm, jira_email: e.target.value })}
                placeholder="your-email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jira_api_token">API Token</Label>
              <Input
                id="jira_api_token"
                type="password"
                value={settingsForm.jira_api_token}
                onChange={(e) => setSettingsForm({ ...settingsForm, jira_api_token: e.target.value })}
                placeholder="Ihr Jira API Token"
              />
            </div>
            {settings?.last_sync_at && (
              <div className="text-sm text-muted-foreground">
                Letzte Synchronisierung: {formatDateTime(settings.last_sync_at)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveSettings}>
              Einstellungen speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={isEditNoteDialogOpen} onOpenChange={setIsEditNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Notiz bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie Ihre persönliche Notiz</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-note">Notiz</Label>
              <Textarea
                id="edit-note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Bearbeiten Sie Ihre Notiz..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" onClick={handleEditNote} disabled={!newNote.trim()}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
