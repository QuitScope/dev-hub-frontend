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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Square,
  Plus,
  Edit,
  Trash2,
  Clock,
  Calendar,
  ExternalLink,
  BarChart3,
  Timer,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, type TimeEntry } from "@/lib/api-client"

export function TimeTracker() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const { toast } = useToast()

  const [newEntry, setNewEntry] = useState({
    title: "",
    description: "",
    category: "Work" as TimeEntry["category"],
    jiraIssue: "",
    duration: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
  })

  useEffect(() => {
    loadTimeEntries()
    loadActiveTimer()
  }, [])

  const loadTimeEntries = async () => {
    setLoading(true)
    const response = await apiClient.getTimeEntries()
    if (response.data) {
      setTimeEntries(response.data)
    } else {
      console.error("Failed to load time entries:", response.error)
    }
    setLoading(false)
  }

  const loadActiveTimer = async () => {
    const response = await apiClient.getActiveTimer()
    if (response.data) {
      setActiveEntry(response.data)
    }
  }

  // Update current time every second for active timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getActiveDuration = () => {
    if (!activeEntry) return 0
    const now = new Date()
    const startTime = new Date(activeEntry.startTime)
    return Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60))
  }

  const handleStartTimer = async () => {
    if (activeEntry) {
      toast({
        title: "Timer already running",
        description: "Please stop the current timer before starting a new one.",
        variant: "destructive",
      })
      return
    }

    const response = await apiClient.startTimer({
      title: "New Task",
      category: "Work",
    })

    if (response.data) {
      setActiveEntry(response.data)
      setTimeEntries([response.data, ...timeEntries])
      toast({
        title: "Timer started",
        description: "Time tracking has begun for your new task.",
      })
    } else {
      console.error("Failed to start timer:", response.error)
      toast({
        title: "Failed to start timer",
        description: response.error || "Could not start the timer.",
        variant: "destructive",
      })
    }
  }

  const handleStopTimer = async () => {
    if (!activeEntry) return

    const response = await apiClient.stopTimer(activeEntry.id)
    if (response.data) {
      setTimeEntries(timeEntries.map((entry) => (entry.id === activeEntry.id ? response.data! : entry)))
      setActiveEntry(null)
      toast({
        title: "Timer stopped",
        description: `Task completed in ${formatDuration(response.data.duration)}.`,
      })
    } else {
      console.error("Failed to stop timer:", response.error)
      toast({
        title: "Failed to stop timer",
        description: response.error || "Could not stop the timer.",
        variant: "destructive",
      })
    }
  }

  const handleAddManualEntry = async () => {
    const startDateTime = new Date(`${newEntry.date}T${newEntry.startTime}`)
    const endDateTime = new Date(`${newEntry.date}T${newEntry.endTime}`)
    const duration = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))

    if (duration <= 0) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      })
      return
    }

    const entryData = {
      title: newEntry.title,
      description: newEntry.description || undefined,
      category: newEntry.category,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration,
      jiraIssue: newEntry.jiraIssue || undefined,
      isActive: false,
    }

    const response = await apiClient.createTimeEntry(entryData)
    if (response.data) {
      setTimeEntries([response.data, ...timeEntries])
      setNewEntry({
        title: "",
        description: "",
        category: "Work",
        jiraIssue: "",
        duration: "",
        date: new Date().toISOString().split("T")[0],
        startTime: "",
        endTime: "",
      })
      setIsAddDialogOpen(false)
      toast({
        title: "Time entry added",
        description: `Manual entry for ${formatDuration(duration)} has been saved.`,
      })
    } else {
      console.error("Failed to create time entry:", response.error)
      toast({
        title: "Failed to add entry",
        description: response.error || "Could not save the time entry.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEntry = async (id: string) => {
    const response = await apiClient.deleteTimeEntry(id)
    if (response.data || !response.error) {
      if (activeEntry?.id === id) {
        setActiveEntry(null)
      }
      setTimeEntries(timeEntries.filter((entry) => entry.id !== id))
      toast({
        title: "Entry deleted",
        description: "Time entry has been removed.",
      })
    } else {
      console.error("Failed to delete time entry:", response.error)
      toast({
        title: "Failed to delete",
        description: response.error || "Could not delete the time entry.",
        variant: "destructive",
      })
    }
  }

  const updateActiveEntryTitle = async (title: string) => {
    if (!activeEntry) return

    const response = await apiClient.updateTimeEntry(activeEntry.id, { title })
    if (response.data) {
      setActiveEntry(response.data)
      setTimeEntries(timeEntries.map((entry) => (entry.id === activeEntry.id ? response.data! : entry)))
    }
  }

  // Calculate statistics
  const today = new Date()
  const todayEntries = timeEntries.filter(
    (entry) => new Date(entry.createdAt).toDateString() === today.toDateString() && !entry.isActive,
  )
  const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.duration, 0) + getActiveDuration()

  const thisWeekEntries = timeEntries.filter((entry) => {
    const entryDate = new Date(entry.createdAt)
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    return entryDate >= weekStart && !entry.isActive
  })
  const weekTotal = thisWeekEntries.reduce((sum, entry) => sum + entry.duration, 0) + getActiveDuration()

  const getCategoryColor = (category: TimeEntry["category"]) => {
    switch (category) {
      case "Work":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Learning":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "Private":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading time tracker...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tracker" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tracker">Active Tracker</TabsTrigger>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="space-y-6">
          {/* Active Timer Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Timer className="h-5 w-5" />
                <span>Active Timer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeEntry ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-8 w-8 text-primary animate-pulse" />
                      <span className="text-4xl font-mono font-bold">{formatDuration(getActiveDuration())}</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={activeEntry.title}
                        onChange={(e) => updateActiveEntryTitle(e.target.value)}
                        className="text-lg font-medium"
                        placeholder="What are you working on?"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Started at {formatTime(activeEntry.startTime)}
                        {activeEntry.jiraIssue && ` • ${activeEntry.jiraIssue}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleStopTimer} variant="destructive">
                      <Square className="h-4 w-4 mr-2" />
                      Stop Timer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No active timer</p>
                  <Button onClick={handleStartTimer} size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(todayTotal)}</div>
                <p className="text-xs text-muted-foreground">{todayEntries.length} sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(weekTotal)}</div>
                <p className="text-xs text-muted-foreground">{thisWeekEntries.length} sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average/Day</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(Math.floor(weekTotal / 7))}</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Time Entries</h3>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manual Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Manual Time Entry</DialogTitle>
                  <DialogDescription>Record time spent on a task manually.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                      placeholder="What did you work on?"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                      placeholder="Optional details..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newEntry.category}
                        onValueChange={(value: TimeEntry["category"]) => setNewEntry({ ...newEntry, category: value })}
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
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEntry.date}
                        onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newEntry.startTime}
                        onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newEntry.endTime}
                        onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="jira">Jira Issue (Optional)</Label>
                    <Input
                      id="jira"
                      value={newEntry.jiraIssue}
                      onChange={(e) => setNewEntry({ ...newEntry, jiraIssue: e.target.value })}
                      placeholder="e.g., DEV-123"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleAddManualEntry}
                    disabled={!newEntry.title.trim() || !newEntry.startTime || !newEntry.endTime}
                  >
                    Add Entry
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Time Entries List */}
          <div className="space-y-4">
            {timeEntries.map((entry) => (
              <Card key={entry.id} className={cn("transition-all hover:shadow-md", entry.isActive && "border-primary")}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{entry.title}</h3>
                        {entry.jiraIssue && (
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {entry.jiraIssue}
                          </Button>
                        )}
                        {entry.isActive && <Badge variant="default">Active</Badge>}
                      </div>
                      {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <Badge className={getCategoryColor(entry.category)}>{entry.category}</Badge>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {entry.isActive ? formatDuration(getActiveDuration()) : formatDuration(entry.duration)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                        {!entry.isActive && entry.endTime && (
                          <span>
                            {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingEntry(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Time:</span>
                    <span className="font-bold">{formatDuration(weekTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Work:</span>
                    <span>
                      {formatDuration(
                        thisWeekEntries.filter((e) => e.category === "Work").reduce((sum, e) => sum + e.duration, 0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Learning:</span>
                    <span>
                      {formatDuration(
                        thisWeekEntries
                          .filter((e) => e.category === "Learning")
                          .reduce((sum, e) => sum + e.duration, 0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Private:</span>
                    <span>
                      {formatDuration(
                        thisWeekEntries.filter((e) => e.category === "Private").reduce((sum, e) => sum + e.duration, 0),
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productivity Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Sessions Today:</span>
                    <span className="font-bold">{todayEntries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Session:</span>
                    <span>
                      {todayEntries.length > 0 ? formatDuration(Math.floor(todayTotal / todayEntries.length)) : "0h 0m"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Most Productive:</span>
                    <span>
                      {thisWeekEntries.reduce(
                        (max, entry) => (entry.duration > max.duration ? entry : max),
                        thisWeekEntries[0] || { category: "N/A" },
                      ).category || "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
