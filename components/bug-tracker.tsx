"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Search, Bug, CheckCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"

interface BugReport {
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

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const statusColors = {
  reported: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  closed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
}

const statusIcons = {
  reported: Bug,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: CheckCircle,
}

export function BugTracker() {
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [filteredBugs, setFilteredBugs] = useState<BugReport[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBug, setEditingBug] = useState<BugReport | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as BugReport["priority"],
    status: "reported" as BugReport["status"],
    reporter: "",
    assignee: "",
    jiraIssue: "",
    tags: "",
    reportedDate: new Date(),
    processedDate: undefined as Date | undefined,
    resolvedDate: undefined as Date | undefined,
  })

  useEffect(() => {
    loadBugs()
  }, [])

  useEffect(() => {
    filterBugs()
  }, [bugs, searchTerm, statusFilter, priorityFilter])

  const loadBugs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getBugs()
      setBugs(response.data ?? [])
    } catch (error) {
      console.error("Error loading bugs:", error)
      setBugs([])
    } finally {
      setLoading(false)
    }
  }

  const filterBugs = () => {
    let filtered = bugs

    if (searchTerm) {
      filtered = filtered.filter(
        (bug) =>
          bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bug.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bug.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bug.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((bug) => bug.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((bug) => bug.priority === priorityFilter)
    }

    setFilteredBugs(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const bugData = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      reportedDate: formData.reportedDate.toISOString(),
      processedDate: formData.processedDate?.toISOString(),
      resolvedDate: formData.resolvedDate?.toISOString(),
    }

    try {
      if (editingBug) {
        await apiClient.updateBug(editingBug.id, bugData)
      } else {
        await apiClient.createBug(bugData)
      }

      await loadBugs()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving bug:", error)
    }
  }

  const updateBugStatus = async (bugId: string, newStatus: BugReport["status"]) => {
    try {
      const updateData: Partial<BugReport> = { status: newStatus }

      if (newStatus === "in_progress" && !bugs.find((b) => b.id === bugId)?.processedDate) {
        updateData.processedDate = new Date().toISOString()
      }

      if (newStatus === "resolved" && !bugs.find((b) => b.id === bugId)?.resolvedDate) {
        updateData.resolvedDate = new Date().toISOString()
      }

      await apiClient.updateBug(bugId, updateData)
      await loadBugs()
    } catch (error) {
      console.error("Error updating bug status:", error)
    }
  }

  const deleteBug = async (bugId: string) => {
    try {
      await apiClient.deleteBug(bugId)
      await loadBugs()
    } catch (error) {
      console.error("Error deleting bug:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      status: "reported",
      reporter: "",
      assignee: "",
      jiraIssue: "",
      tags: "",
      reportedDate: new Date(),
      processedDate: undefined,
      resolvedDate: undefined,
    })
    setEditingBug(null)
  }

  const editBug = (bug: BugReport) => {
    setFormData({
      title: bug.title,
      description: bug.description,
      priority: bug.priority,
      status: bug.status,
      reporter: bug.reporter,
      assignee: bug.assignee || "",
      jiraIssue: bug.jiraIssue || "",
      tags: bug.tags.join(", "),
      reportedDate: new Date(bug.reportedDate),
      processedDate: bug.processedDate ? new Date(bug.processedDate) : undefined,
      resolvedDate: bug.resolvedDate ? new Date(bug.resolvedDate) : undefined,
    })
    setEditingBug(bug)
    setIsDialogOpen(true)
  }

  const getStatusStats = () => {
    const stats = {
      reported: bugs.filter((b) => b.status === "reported").length,
      in_progress: bugs.filter((b) => b.status === "in_progress").length,
      resolved: bugs.filter((b) => b.status === "resolved").length,
      closed: bugs.filter((b) => b.status === "closed").length,
    }
    return stats
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Fehlerprotokolle...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemeldet</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reported}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Bearbeitung</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Behoben</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geschlossen</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Fehler suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="reported">Gemeldet</SelectItem>
              <SelectItem value="in_progress">In Bearbeitung</SelectItem>
              <SelectItem value="resolved">Behoben</SelectItem>
              <SelectItem value="closed">Geschlossen</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Priorität filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Prioritäten</SelectItem>
              <SelectItem value="low">Niedrig</SelectItem>
              <SelectItem value="medium">Mittel</SelectItem>
              <SelectItem value="high">Hoch</SelectItem>
              <SelectItem value="critical">Kritisch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Fehler
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBug ? "Fehler bearbeiten" : "Neuen Fehler melden"}</DialogTitle>
              <DialogDescription>
                Dokumentiere einen neuen Fehler oder bearbeite einen bestehenden Eintrag.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reporter">Melder *</Label>
                  <Input
                    id="reporter"
                    value={formData.reporter}
                    onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as BugReport["priority"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="critical">Kritisch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as BugReport["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reported">Gemeldet</SelectItem>
                      <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                      <SelectItem value="resolved">Behoben</SelectItem>
                      <SelectItem value="closed">Geschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignee">Zugewiesen an</Label>
                  <Input
                    id="assignee"
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jiraIssue">Jira Issue</Label>
                  <Input
                    id="jiraIssue"
                    value={formData.jiraIssue}
                    onChange={(e) => setFormData({ ...formData, jiraIssue: e.target.value })}
                    placeholder="z.B. DEV-123"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (kommagetrennt)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="z.B. frontend, api, critical"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Gemeldet am *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.reportedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.reportedDate
                          ? format(formData.reportedDate, "dd.MM.yyyy", { locale: de })
                          : "Datum wählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.reportedDate}
                        onSelect={(date) => date && setFormData({ ...formData, reportedDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Bearbeitet am</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.processedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.processedDate
                          ? format(formData.processedDate, "dd.MM.yyyy", { locale: de })
                          : "Datum wählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.processedDate}
                        onSelect={(date) => setFormData({ ...formData, processedDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Behoben am</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.resolvedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.resolvedDate
                          ? format(formData.resolvedDate, "dd.MM.yyyy", { locale: de })
                          : "Datum wählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.resolvedDate}
                        onSelect={(date) => setFormData({ ...formData, resolvedDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">{editingBug ? "Aktualisieren" : "Erstellen"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bug List */}
      <div className="space-y-4">
        {filteredBugs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bug className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Fehler gefunden</h3>
              <p className="text-muted-foreground text-center">
                {bugs.length === 0
                  ? "Noch keine Fehler gemeldet. Erstelle den ersten Fehlerbericht."
                  : "Keine Fehler entsprechen den aktuellen Filterkriterien."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBugs.map((bug) => {
            const StatusIcon = statusIcons[bug.status]
            return (
              <Card key={bug.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <CardTitle className="text-lg">{bug.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={priorityColors[bug.priority]}>
                          {bug.priority === "low" && "Niedrig"}
                          {bug.priority === "medium" && "Mittel"}
                          {bug.priority === "high" && "Hoch"}
                          {bug.priority === "critical" && "Kritisch"}
                        </Badge>
                        <Badge className={statusColors[bug.status]}>
                          {bug.status === "reported" && "Gemeldet"}
                          {bug.status === "in_progress" && "In Bearbeitung"}
                          {bug.status === "resolved" && "Behoben"}
                          {bug.status === "closed" && "Geschlossen"}
                        </Badge>
                        {bug.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={bug.status}
                        onValueChange={(value: BugReport["status"]) => updateBugStatus(bug.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reported">Gemeldet</SelectItem>
                          <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                          <SelectItem value="resolved">Behoben</SelectItem>
                          <SelectItem value="closed">Geschlossen</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => editBug(bug)}>
                        Bearbeiten
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteBug(bug.id)}>
                        Löschen
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bug.description && <p className="text-muted-foreground">{bug.description}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Gemeldet:</span>
                        <p className="text-muted-foreground">
                          {format(new Date(bug.reportedDate), "dd.MM.yyyy", { locale: de })} von {bug.reporter}
                        </p>
                      </div>
                      {bug.processedDate && (
                        <div>
                          <span className="font-medium">Bearbeitet:</span>
                          <p className="text-muted-foreground">
                            {format(new Date(bug.processedDate), "dd.MM.yyyy", { locale: de })}
                          </p>
                        </div>
                      )}
                      {bug.resolvedDate && (
                        <div>
                          <span className="font-medium">Behoben:</span>
                          <p className="text-muted-foreground">
                            {format(new Date(bug.resolvedDate), "dd.MM.yyyy", { locale: de })}
                          </p>
                        </div>
                      )}
                    </div>

                    {(bug.assignee || bug.jiraIssue) && (
                      <div className="flex items-center gap-4 text-sm">
                        {bug.assignee && (
                          <div>
                            <span className="font-medium">Zugewiesen an:</span>
                            <span className="ml-1 text-muted-foreground">{bug.assignee}</span>
                          </div>
                        )}
                        {bug.jiraIssue && (
                          <div>
                            <span className="font-medium">Jira:</span>
                            <span className="ml-1 text-muted-foreground">{bug.jiraIssue}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
