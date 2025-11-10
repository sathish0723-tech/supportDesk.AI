"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
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
      checkCompanyAndRedirect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id])

  const checkCompanyAndRedirect = async () => {
    try {
      // First sync user to ensure they exist in DB
      // Don't fail if sync fails - MongoDB connection might be down
      try {
        const syncResponse = await fetch("/api/users/sync", { method: "POST" })
        if (!syncResponse.ok) {
          const errorData = await syncResponse.json().catch(() => ({}))
          console.warn("User sync failed (may be MongoDB connection issue):", errorData.error || "Unknown error")
          // Continue anyway - user might still have company data
        }
      } catch (syncError) {
        console.warn("User sync error (continuing anyway):", syncError)
        // Continue to check company data even if sync fails
      }
      
      // Check if user has company data
      try {
        const response = await fetch("/api/companies/me")
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data && data.data.companyId) {
            // User has company, stay on dashboard
            setIsChecking(false)
            return
          } else {
            // No company data, redirect to onboarding
            router.push("/onboarding")
            return
          }
        } else {
          // If it's a 500 error, it's likely MongoDB connection issue
          // Allow user to stay on dashboard but show warning
          if (response.status === 500) {
            console.warn("Company check failed due to server error (likely MongoDB connection)")
            setIsChecking(false)
            return
          }
          // Other errors, redirect to onboarding
          router.push("/onboarding")
          return
        }
      } catch (companyError) {
        console.warn("Company check error:", companyError)
        // On network error, allow user to stay on dashboard
        setIsChecking(false)
        return
      }
    } catch (error) {
      console.error("Unexpected error in checkCompanyAndRedirect:", error)
      // On unexpected error, allow user to stay on dashboard
      setIsChecking(false)
    } finally {
      setIsChecking(false)
    }
  }

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Dashboard
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your dashboard! Your company setup is complete.
          </p>
        </div>
      </div>
    </div>
  )
}

