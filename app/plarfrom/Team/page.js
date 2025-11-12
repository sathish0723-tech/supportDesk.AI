"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Users, X, Mail, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TeamPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [companyLogos, setCompanyLogos] = useState({})
  const [formData, setFormData] = useState({
    teamName: "",
    description: "",
    members: []
  })
  const [memberEmail, setMemberEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!isLoaded) return
    
    if (!user) {
      router.push("/auth")
      return
    }
    
    fetchTeams()
  }, [isLoaded, user])

  // Fetch logo from domain (same as onboarding)
  const fetchLogoFromDomain = (domain) => {
    if (!domain) return null
    
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim()
    if (cleanDomain) {
      return `https://logo.clearbit.com/${cleanDomain}`
    }
    return null
  }

  const fetchTeams = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await fetch("/api/teams/create")
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const teamsData = data.data || []
          setTeams(teamsData)
          
          // Fetch logos for teams with company domain
          const logos = {}
          teamsData.forEach(team => {
            if (team.companyDomain) {
              const logoUrl = fetchLogoFromDomain(team.companyDomain)
              if (logoUrl) {
                logos[team.teamId] = logoUrl
              }
            }
          })
          setCompanyLogos(logos)
          
          if (data.message && data.message.includes("No company found")) {
            setError("Please complete company setup first to create teams.")
          }
        } else {
          setError(data.error || "Failed to load teams")
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Failed to load teams")
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
      setError("Failed to load teams")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMember = () => {
    if (!memberEmail || memberEmail.trim() === "") {
      setError("Please enter a valid email address")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(memberEmail.trim())) {
      setError("Please enter a valid email address")
      return
    }

    const emailLower = memberEmail.trim().toLowerCase()
    
    // Check if member already exists (check both email and userId if present)
    const memberExists = formData.members.some(m => {
      const memberEmail = (m.email || "").toLowerCase()
      return memberEmail === emailLower
    })
    
    if (memberExists) {
      setError("This member is already added to the team")
      return
    }

    // When creating a new team, check if it's the current user's email
    // (they'll be added automatically as admin, so we can skip or inform them)
    if (!editingTeam && user) {
      const currentUserEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()
      if (currentUserEmail === emailLower) {
        setError("You will be automatically added as the team admin. Please add other members.")
        return
      }
    }

    // When editing, check if it's the creator's email
    if (editingTeam && editingTeam.createdBy?.email?.toLowerCase() === emailLower) {
      setError("The team creator is already a member and cannot be removed")
      return
    }

    // Add member
    const newMember = {
      email: emailLower,
      name: emailLower.split("@")[0],
      role: "member",
      addedAt: new Date().toISOString() // Add timestamp immediately
    }
    
    setFormData(prevFormData => {
      const updatedMembers = [...prevFormData.members, newMember]
      console.log("Adding member:", newMember)
      console.log("Current formData.members before add:", prevFormData.members)
      console.log("Updated members list after add:", updatedMembers)
      console.log("Updated members count:", updatedMembers.length)
      return {
        ...prevFormData,
        members: updatedMembers
      }
    })
    setMemberEmail("")
    setError("")
  }

  const handleRemoveMember = (index) => {
    const memberToRemove = formData.members[index]
    
    // Prevent removing the team creator when editing
    if (editingTeam && memberToRemove?.email?.toLowerCase() === editingTeam.createdBy?.email?.toLowerCase()) {
      setError("Cannot remove the team creator")
      return
    }
    
    setFormData(prevFormData => ({
      ...prevFormData,
      members: prevFormData.members.filter((_, i) => i !== index)
    }))
  }

  const handleEditTeam = (team) => {
    setEditingTeam(team)
    // Clean members array - remove MongoDB _id and keep only necessary fields
    const cleanedMembers = team.members ? team.members.map(m => ({
      email: m.email || '',
      name: m.name || m.email?.split('@')[0] || '',
      role: m.role || 'member',
      userId: m.userId || undefined,
      addedAt: m.addedAt ? (typeof m.addedAt === 'string' ? m.addedAt : new Date(m.addedAt).toISOString()) : new Date().toISOString()
    })) : []
    
    console.log('Loading team for edit:', team.teamName)
    console.log('Team members from DB:', team.members)
    console.log('Cleaned members for form:', cleanedMembers)
    console.log('Cleaned members count:', cleanedMembers.length)
    
    setFormData({
      teamName: team.teamName || "",
      description: team.description || "",
      members: cleanedMembers
    })
    setMemberEmail("")
    setError("")
    setSuccess("")
  }

  const handleCancelEdit = () => {
    setEditingTeam(null)
    setFormData({
      teamName: "",
      description: "",
      members: []
    })
    setMemberEmail("")
    setError("")
  }

  const handleCreateTeam = async () => {
    if (!formData.teamName || formData.teamName.trim() === "") {
      setError("Team name is required")
      return
    }

    try {
      setIsCreating(true)
      setError("")
      setSuccess("")

      const requestBody = {
        teamName: formData.teamName,
        description: formData.description,
        members: formData.members
      }
      
      console.log('Creating team with data:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch("/api/teams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess("Team created successfully!")
        setFormData({
          teamName: "",
          description: "",
          members: []
        })
        setMemberEmail("")
        setShowCreateForm(false)
        // Refresh teams list
        await fetchTeams()
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorMsg = data.error || "Failed to create team"
        setError(errorMsg)
        // If company not found, suggest going to onboarding
        if (errorMsg.includes("Company not found") || errorMsg.includes("company setup")) {
          setTimeout(() => {
            if (confirm("You need to complete company setup first. Would you like to go to onboarding?")) {
              router.push("/onboarding")
            }
          }, 1000)
        }
      }
    } catch (error) {
      console.error("Error creating team:", error)
      setError("Failed to create team. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateTeam = async () => {
    if (!formData.teamName || formData.teamName.trim() === "") {
      setError("Team name is required")
      return
    }

    if (!editingTeam) {
      setError("No team selected for editing")
      return
    }

    try {
      setIsUpdating(true)
      setError("")
      setSuccess("")

      // Debug: Log formData before cleaning
      console.log('FormData members before cleaning:', JSON.stringify(formData.members, null, 2))
      console.log('FormData members count:', formData.members.length)
      
      // Clean members before sending - remove any MongoDB _id fields
      const cleanedMembers = formData.members.map(m => {
        const cleaned = {
          email: m.email || '',
          name: m.name || m.email?.split('@')[0] || '',
          role: m.role || 'member',
          addedAt: m.addedAt || new Date().toISOString() // Ensure addedAt is always set
        }
        if (m.userId) cleaned.userId = m.userId
        return cleaned
      })
      
      console.log('Cleaned members count:', cleanedMembers.length)
      console.log('Cleaned members:', JSON.stringify(cleanedMembers, null, 2))
      
      const requestBody = {
        teamId: editingTeam.teamId,
        teamName: formData.teamName,
        description: formData.description,
        members: cleanedMembers
      }
      
      console.log('Updating team with data:', JSON.stringify(requestBody, null, 2))
      console.log('Request body members count:', requestBody.members.length)
      
      const response = await fetch("/api/teams/create", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess("Team updated successfully!")
        setFormData({
          teamName: "",
          description: "",
          members: []
        })
        setMemberEmail("")
        setEditingTeam(null)
        // Refresh teams list
        await fetchTeams()
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorMsg = data.error || "Failed to update team"
        setError(errorMsg)
      }
    } catch (error) {
      console.error("Error updating team:", error)
      setError("Failed to update team. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddMember()
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Teams
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your support teams and assign members
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Team
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Create/Edit Team Form Modal */}
        {(showCreateForm || editingTeam) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{editingTeam ? "Edit Team" : "Create New Team"}</CardTitle>
                    <CardDescription>
                      {editingTeam ? "Update team information and members" : "Create a new support team and add members"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingTeam(null)
                      setFormData({ teamName: "", description: "", members: [] })
                      setMemberEmail("")
                      setError("")
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
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., IT Support Team"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Brief description of the team"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add Team Members
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter member email address"
                      value={memberEmail}
                      onChange={(e) => {
                        setMemberEmail(e.target.value)
                        setError("")
                      }}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddMember}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {formData.members.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Members ({formData.members.length})
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                      {formData.members.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {member.email}
                            </span>
                            {member.role && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                member.role === "admin" 
                                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                  : member.role === "agent"
                                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              }`}>
                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                              </span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(index)}
                            className="h-6 w-6"
                            disabled={member.role === "admin" && editingTeam?.createdBy?.userId === member.userId}
                            title={member.role === "admin" && editingTeam?.createdBy?.userId === member.userId ? "Cannot remove team creator" : "Remove member"}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingTeam(null)
                      setFormData({ teamName: "", description: "", members: [] })
                      setMemberEmail("")
                      setError("")
                    }}
                    disabled={isCreating || isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                    disabled={(isCreating || isUpdating) || !formData.teamName.trim()}
                  >
                    {(isCreating || isUpdating) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingTeam ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingTeam ? "Update Team" : "Create Team"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Teams List */}
        {teams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No teams yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
                Create your first team to get started with ticket management
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {teams.map((team) => {
              const logoUrl = companyLogos[team.teamId]
              return (
                <Card key={team._id || team.teamId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {logoUrl ? (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
                            <img
                              src={logoUrl}
                              alt={team.companyName || "Company"}
                              className="w-full h-full object-contain p-1.5"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                            <div className="w-full h-full items-center justify-center hidden">
                              <Users className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600 flex-shrink-0">
                            <Users className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold truncate">
                            {team.teamName}
                          </CardTitle>
                          {team.companyName && (
                            <CardDescription className="text-xs truncate">
                              {team.companyName}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => handleEditTeam(team)}
                        title="Edit team"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Members:</span>
                        <span>{team.members?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Created:</span>
                        <span>{new Date(team.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      {team.companyDomain && (
                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-500">
                          <span className="font-medium">Domain:</span>
                          <span className="truncate ml-2 max-w-[120px]">{team.companyDomain}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

