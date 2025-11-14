"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, BarChart3, Users, Ticket, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlatformDashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    teamMembers: 0,
    resolvedToday: 0
  })
  const hasChecked = useRef(false)
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    
    if (!user && !hasRedirected.current) {
      hasRedirected.current = true
      router.push("/auth")
      return
    }
    
    if (user && !hasChecked.current) {
      hasChecked.current = true
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id])

  const loadDashboardData = async () => {
    try {
      setIsChecking(true)
      
      // TODO: Replace with actual API endpoints
      // const [ticketsRes, teamRes] = await Promise.all([
      //   fetch("/api/tickets"),
      //   fetch("/api/teams")
      // ])
      // const ticketsData = await ticketsRes.json()
      // const teamData = await teamRes.json()
      
      // Placeholder stats for now
      setStats({
        totalTickets: 0,
        openTickets: 0,
        teamMembers: 0,
        resolvedToday: 0
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsChecking(false)
    }
  }

  if (!isLoaded || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress || "User"}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              All time tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">
              Tickets resolved today
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your recent support desk activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
            <p className="text-muted-foreground">
              Activity will appear here as you use the platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


