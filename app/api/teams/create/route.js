import { auth, currentUser } from '@clerk/nextjs/server'
import connectTicketsDB, { getTeam, generateTeamId } from '@/modules/team'
import connectDB, { User } from '@/lib/db'

/**
 * Create a new team
 */
export async function POST(req) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await currentUser()
    if (!user) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const {
      teamName,
      description,
      members = []
    } = body

    if (!teamName || teamName.trim() === '') {
      return Response.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Connect to users database to get company information
    await connectDB()
    const userDoc = await User.findOne({ clerkId: userId })
    
    if (!userDoc) {
      return Response.json(
        { success: false, error: 'User not found. Please sync your account first.' },
        { status: 404 }
      )
    }

    if (!userDoc.companyId || !userDoc.companyName) {
      return Response.json(
        { success: false, error: 'Company not found. Please complete company setup first.' },
        { status: 400 }
      )
    }

    // Connect to Tickets database and get Team model
    await connectTicketsDB()
    const Team = await getTeam()

    // Generate unique team ID
    const teamId = await generateTeamId(teamName)

    // Prepare members array with creator as admin if not already included
    const membersList = Array.isArray(members) ? [...members] : []
    
    console.log('Received members for create:', JSON.stringify(membersList, null, 2))
    
    // Clean and structure members array
    const cleanedMembers = membersList.map(member => ({
      email: (member.email || '').toLowerCase().trim(),
      name: (member.name || member.email?.split('@')[0] || '').trim(),
      role: member.role || 'member',
      userId: member.userId || undefined, // Only include if exists
      addedAt: new Date()
    })).filter(m => m.email) // Remove any members without email
    
    // Check if creator is already in members list
    const creatorEmail = user.emailAddresses[0]?.emailAddress || ''
    const creatorInMembers = cleanedMembers.some(m => 
      m.email?.toLowerCase() === creatorEmail.toLowerCase()
    )

    // If creator not in members, add them as admin
    if (!creatorInMembers && creatorEmail) {
      cleanedMembers.unshift({
        userId: userId,
        email: creatorEmail.toLowerCase(),
        name: user.fullName || user.firstName || creatorEmail.split('@')[0],
        role: 'admin',
        addedAt: new Date()
      })
    }
    
    console.log('Final cleaned members list for create:', JSON.stringify(cleanedMembers, null, 2))

    // Create new team
    const team = new Team({
      teamId,
      companyId: userDoc.companyId,
      companyName: userDoc.companyName,
      teamName: teamName.trim(),
      description: description?.trim() || '',
      members: cleanedMembers,
      createdBy: {
        userId: userId,
        email: creatorEmail,
        name: user.fullName || user.firstName || creatorEmail.split('@')[0]
      },
      isActive: true,
      settings: {
        autoAssign: false,
        notificationEnabled: true
      }
    })

    await team.save()

    return Response.json({
      success: true,
      data: {
        teamId: team.teamId,
        companyId: team.companyId,
        companyName: team.companyName,
        teamName: team.teamName,
        description: team.description,
        members: team.members,
        createdBy: team.createdBy,
        createdAt: team.createdAt
      },
      message: 'Team created successfully'
    })
  } catch (error) {
    console.error('Error creating team:', error)
    return Response.json(
      { 
        success: false, 
        error: error.message || 'Failed to create team',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Get all teams for the current user's company
 */
export async function GET(req) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Connect to users database to get company information
    await connectDB()
    const userDoc = await User.findOne({ clerkId: userId })
    
    if (!userDoc) {
      return Response.json(
        { success: false, error: 'User not found. Please sync your account first.' },
        { status: 404 }
      )
    }

    if (!userDoc.companyId) {
      return Response.json({
        success: true,
        data: [],
        message: 'No company found. Teams will be available after company setup.'
      })
    }

    // Connect to Tickets database and get Team model
    await connectTicketsDB()
    const Team = await getTeam()

    // Find teams for the user's company where user is creator or member
    const teams = await Team.find({
      companyId: userDoc.companyId,
      $or: [
        { 'createdBy.userId': userId },
        { 'members.userId': userId }
      ],
      isActive: true
    }).sort({ createdAt: -1 })

    return Response.json({
      success: true,
      data: teams,
      message: 'Teams fetched successfully'
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return Response.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch teams'
      },
      { status: 500 }
    )
  }
}

/**
 * Update an existing team
 */
export async function PUT(req) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      teamId,
      teamName,
      description,
      members = []
    } = body

    if (!teamId) {
      return Response.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    if (!teamName || teamName.trim() === '') {
      return Response.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Connect to users database to get company information
    await connectDB()
    const userDoc = await User.findOne({ clerkId: userId })
    
    if (!userDoc) {
      return Response.json(
        { success: false, error: 'User not found. Please sync your account first.' },
        { status: 404 }
      )
    }

    if (!userDoc.companyId) {
      return Response.json(
        { success: false, error: 'Company not found. Please complete company setup first.' },
        { status: 400 }
      )
    }

    // Connect to Tickets database and get Team model
    await connectTicketsDB()
    const Team = await getTeam()

    // Find the team and verify it belongs to the user's company
    const team = await Team.findOne({ 
      teamId,
      companyId: userDoc.companyId 
    })

    if (!team) {
      return Response.json(
        { success: false, error: 'Team not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    // Check if user is the creator or an admin member
    const isCreator = team.createdBy.userId === userId
    const isAdminMember = team.members?.some(
      m => m.userId === userId && m.role === 'admin'
    )

    if (!isCreator && !isAdminMember) {
      return Response.json(
        { success: false, error: 'You do not have permission to edit this team' },
        { status: 403 }
      )
    }

    // Update team fields
    team.teamName = teamName.trim()
    team.description = description?.trim() || ''
    
    // Always update members (even if empty array, but ensure creator is included)
    const membersList = Array.isArray(members) ? [...members] : []
    
    console.log('Received members for update:', JSON.stringify(membersList, null, 2))
    
    // Clean members array - remove MongoDB _id and ensure proper structure
    const cleanedMembers = membersList.map(member => {
      const cleaned = {
        email: member.email?.toLowerCase().trim() || '',
        name: member.name?.trim() || member.email?.split('@')[0] || '',
        role: member.role || 'member',
        addedAt: member.addedAt ? (member.addedAt instanceof Date ? member.addedAt : new Date(member.addedAt)) : new Date()
      }
      // Only include userId if it exists and is not empty
      if (member.userId && member.userId.trim() !== '') {
        cleaned.userId = member.userId.trim()
      }
      return cleaned
    }).filter(m => m.email) // Remove any members without email
    
    // Ensure creator is still in members list
    const creatorEmail = team.createdBy.email
    const creatorInMembers = cleanedMembers.some(m => 
      m.email?.toLowerCase() === creatorEmail.toLowerCase()
    )

    if (!creatorInMembers) {
      // Add creator back as admin
      cleanedMembers.unshift({
        userId: team.createdBy.userId,
        email: creatorEmail.toLowerCase(),
        name: team.createdBy.name || creatorEmail.split('@')[0],
        role: 'admin',
        addedAt: new Date()
      })
    }

    console.log('Final cleaned members list:', JSON.stringify(cleanedMembers, null, 2))
    console.log('Final cleaned members count:', cleanedMembers.length)
    
    // Use findOneAndUpdate to ensure the array is properly updated
    // This is more reliable than modifying and saving
    const updatedTeam = await Team.findOneAndUpdate(
      { teamId: teamId },
      {
        $set: {
          teamName: teamName.trim(),
          description: description?.trim() || '',
          members: cleanedMembers,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    )
    
    if (!updatedTeam) {
      return Response.json(
        { success: false, error: 'Failed to update team' },
        { status: 500 }
      )
    }
    
    console.log('Team members after update:', JSON.stringify(updatedTeam.members, null, 2))
    console.log('Updated team members count:', updatedTeam.members.length)

    return Response.json({
      success: true,
      data: {
        teamId: updatedTeam.teamId,
        companyId: updatedTeam.companyId,
        companyName: updatedTeam.companyName,
        teamName: updatedTeam.teamName,
        description: updatedTeam.description,
        members: updatedTeam.members,
        createdBy: updatedTeam.createdBy,
        updatedAt: updatedTeam.updatedAt
      },
      message: 'Team updated successfully'
    })
  } catch (error) {
    console.error('Error updating team:', error)
    return Response.json(
      { 
        success: false, 
        error: error.message || 'Failed to update team',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

