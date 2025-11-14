"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, Ticket, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TicketsTable } from "@/components/tickets-table"

export default function TeamTicketsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const params = useParams()
  const teamId = params?.teamId
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [team, setTeam] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoaded) return
    
    if (!user) {
      router.push("/auth")
      return
    }
    
    if (teamId) {
      fetchTeam()
      fetchTickets()
    }
  }, [isLoaded, user, teamId])

  const fetchTeam = async () => {
    try {
      const response = await fetch("/api/teams/create")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const foundTeam = data.data.find(t => t.teamId === teamId)
          if (foundTeam) {
            setTeam(foundTeam)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching team:", error)
    }
  }

  const fetchTickets = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch(`/api/tickets?teamId=${teamId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch tickets")
      }
      
      const data = await response.json()
      if (data.success) {
        setTickets(data.data || [])
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/Platform/Team")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {team ? `${team.teamName} - Tickets` : "Team Tickets"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {team ? `Viewing all tickets for ${team.teamName}` : "Viewing team tickets"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {team && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Showing tickets for: {team.teamName}
              </span>
            </div>
          </div>
        )}

        {/* Tickets Table */}
        <TicketsTable 
          data={tickets}
          isLoading={isLoading}
          searchPlaceholder="Search tickets by ID, subject, message, or email..."
        />
      </div>
    </div>
  )
}

