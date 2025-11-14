import { auth, currentUser } from '@clerk/nextjs/server'
import connectTicketsDB, { getTicket, generateTicketId } from '@/modules/ticket'
import connectDB, { User, Company } from '@/lib/db'
import { getTeam } from '@/modules/team'

/**
 * Create a new ticket
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
      email,
      priority = 'medium',
      message,
      teamId,
      subject
    } = body

    // Validation
    if (!email || !email.trim()) {
      return Response.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!message || !message.trim()) {
      return Response.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!teamId || !teamId.trim()) {
      return Response.json(
        { success: false, error: 'Team selection is required' },
        { status: 400 }
      )
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
      return Response.json(
        { success: false, error: 'Invalid priority level' },
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

    // Connect to Tickets database and verify team exists
    await connectTicketsDB()
    const Team = await getTeam()
    const team = await Team.findOne({ 
      teamId,
      companyId: userDoc.companyId,
      isActive: true
    })

    if (!team) {
      return Response.json(
        { success: false, error: 'Team not found or inactive' },
        { status: 404 }
      )
    }

    // Get Ticket model
    const Ticket = await getTicket()

    // Generate unique ticket ID
    const ticketId = await generateTicketId(subject || message.substring(0, 50))

    // Get user info for raisedBy
    const raisedByEmail = email.toLowerCase().trim()
    const raisedByName = userDoc.name || raisedByEmail.split('@')[0]

    // Create new ticket
    const ticket = new Ticket({
      ticketId,
      companyId: userDoc.companyId,
      companyName: userDoc.companyName,
      teamId: team.teamId,
      teamName: team.teamName,
      raisedBy: {
        userId: userId,
        email: raisedByEmail,
        name: raisedByName
      },
      subject: subject || message.substring(0, 100),
      message: message.trim(),
      priority: priority.toLowerCase(),
      status: 'open',
      activityLog: [{
        action: 'created',
        performedBy: {
          userId: userId,
          email: user.emailAddresses[0]?.emailAddress || raisedByEmail,
          name: user.fullName || raisedByName
        },
        details: `Ticket created with priority: ${priority}`,
        timestamp: new Date()
      }]
    })

    await ticket.save()

    return Response.json({
      success: true,
      data: {
        ticketId: ticket.ticketId,
        companyId: ticket.companyId,
        companyName: ticket.companyName,
        teamId: ticket.teamId,
        teamName: ticket.teamName,
        raisedBy: ticket.raisedBy,
        subject: ticket.subject,
        message: ticket.message,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt
      },
      message: 'Ticket created successfully'
    })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return Response.json(
      { 
        success: false, 
        error: error.message || 'Failed to create ticket',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Get all tickets for the current user's company
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
        message: 'No company found. Tickets will be available after company setup.'
      })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const teamId = searchParams.get('teamId')

    // Connect to Tickets database and get Ticket model
    await connectTicketsDB()
    const Ticket = await getTicket()

    // Build query
    const query = {
      companyId: userDoc.companyId
    }

    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      query.status = status
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      query.priority = priority
    }

    if (teamId) {
      query.teamId = teamId
    }

    // Find tickets for the user's company
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Limit to 100 most recent tickets

    return Response.json({
      success: true,
      data: tickets.map(ticket => ({
        ticketId: ticket.ticketId,
        companyId: ticket.companyId,
        companyName: ticket.companyName,
        teamId: ticket.teamId,
        teamName: ticket.teamName,
        raisedBy: ticket.raisedBy,
        subject: ticket.subject,
        message: ticket.message,
        priority: ticket.priority,
        status: ticket.status,
        assignedTo: ticket.assignedTo,
        resolvedAt: ticket.resolvedAt,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      })),
      message: 'Tickets fetched successfully'
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return Response.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch tickets'
      },
      { status: 500 }
    )
  }
}

