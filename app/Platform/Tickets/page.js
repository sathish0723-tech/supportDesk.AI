"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Ticket, Plus, Search, Filter, X, Mail, AlertCircle, Clock, CheckCircle, Users, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TicketsTable } from "@/components/tickets-table"
import * as Separator from "@radix-ui/react-separator"

export default function TicketsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [allTickets, setAllTickets] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    priority: "medium",
    message: "",
    teamId: "",
    subject: ""
  })

  useEffect(() => {
    if (!isLoaded) return
    
    if (!user) {
      router.push("/auth")
      return
    }
    
    // Set default email to user's email
    if (user.emailAddresses && user.emailAddresses[0]) {
      setFormData(prev => ({
        ...prev,
        email: user.emailAddresses[0].emailAddress || ""
      }))
    }
    
    fetchTeams()
    fetchTickets()
  }, [isLoaded, user])

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams/create")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const teamsData = data.data || []
          setTeams(teamsData)
          
          // If user is in a team, auto-select the first team
          if (teamsData.length > 0 && !formData.teamId) {
            const userTeam = teamsData.find(team => 
              team.members?.some(m => m.userId === user.id || m.email?.toLowerCase() === user.emailAddresses[0]?.emailAddress?.toLowerCase())
            ) || teamsData[0]
            
            setFormData(prev => ({
              ...prev,
              teamId: userTeam.teamId
            }))
          }
        }
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const fetchTickets = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch("/api/tickets")
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch tickets")
      }
      
      const data = await response.json()
      if (data.success) {
        const ticketsData = data.data || []
        setAllTickets(ticketsData)
        setTickets(ticketsData)
      } else {
        setError(data.error || "Failed to load tickets")
      }
    } catch (err) {
      setError(err.message || "Failed to load tickets")
      console.error("Error fetching tickets:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!formData.email || !formData.email.trim()) {
      setError("Email is required")
      return
    }

    if (!formData.message || !formData.message.trim()) {
      setError("Message is required")
      return
    }

    if (!formData.teamId) {
      setError("Please select a team")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address")
      return
    }

    try {
      setIsCreating(true)
      setError("")
      setSuccess("")

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          priority: formData.priority,
          message: formData.message.trim(),
          teamId: formData.teamId,
          subject: formData.subject.trim()
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess("Ticket created successfully!")
        setFormData({
          email: user?.emailAddresses?.[0]?.emailAddress || "",
          priority: "medium",
          message: "",
          teamId: formData.teamId, // Keep selected team
          subject: ""
        })
        setShowCreateForm(false)
        await fetchTickets()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error || "Failed to create ticket")
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
      setError("Failed to create ticket. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }


  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tickets
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage and track support tickets
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Team Selection - Show if multiple teams exist */}
        {teams.length > 1 && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
              Select Team to View Tickets
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTeamId === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedTeamId(null)
                  setTickets(allTickets)
                }}
                className="text-sm h-9 px-4"
              >
                All Teams
              </Button>
              {teams.map((team) => {
                const teamTickets = allTickets.filter(ticket => ticket.teamId === team.teamId)
                return (
                  <div
                    key={team.teamId}
                    className={`flex items-center rounded-md border ${
                      selectedTeamId === team.teamId
                        ? "bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <Button
                      variant={selectedTeamId === team.teamId ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setSelectedTeamId(team.teamId)
                        const filteredTickets = allTickets.filter(ticket => ticket.teamId === team.teamId)
                        setTickets(filteredTickets)
                      }}
                      className={`text-sm h-9 px-4 flex items-center gap-2 ${
                        selectedTeamId === team.teamId 
                          ? "text-white" 
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <span>{team.teamName}</span>
                      <span className={`text-xs ${
                        selectedTeamId === team.teamId 
                          ? "text-white/80" 
                          : "text-gray-500 dark:text-gray-400"
                      }`}>
                        ({teamTickets.length})
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTeamId(team.teamId)
                        const filteredTickets = allTickets.filter(ticket => ticket.teamId === team.teamId)
                        setTickets(filteredTickets)
                      }}
                      className={`h-9 w-8 p-0 flex items-center justify-center ${
                        selectedTeamId === team.teamId 
                          ? "text-white hover:bg-gray-800" 
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Selected Team Info */}
        {selectedTeamId && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Showing tickets for: {teams.find(t => t.teamId === selectedTeamId)?.teamName || "Unknown Team"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTeamId(null)
                  setTickets(allTickets)
                }}
                className="text-sm h-7 px-3"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Create Ticket Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Create New Ticket</CardTitle>
                    <CardDescription>
                      Raise a new support ticket and assign it to a team
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowCreateForm(false)
                      setError("")
                      setFormData({
                        email: user?.emailAddresses?.[0]?.emailAddress || "",
                        priority: "medium",
                        message: "",
                        teamId: formData.teamId,
                        subject: ""
                      })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      setError("")
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Brief subject for the ticket"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Team <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.teamId} value={team.teamId}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Describe your issue or request..."
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value })
                      setError("")
                    }}
                    rows={6}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setError("")
                      setFormData({
                        email: user?.emailAddresses?.[0]?.emailAddress || "",
                        priority: "medium",
                        message: "",
                        teamId: formData.teamId,
                        subject: ""
                      })
                    }}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTicket}
                    disabled={isCreating || !formData.email.trim() || !formData.message.trim() || !formData.teamId}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Ticket
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}

