/**
 * Ticket Generation Script
 * 
 * This script generates 20 sample tickets with different user emails and statuses.
 * 
 * Usage:
 *   npm run generate-tickets
 *   OR
 *   node generate-tickets.js
 * 
 * Requirements:
 *   - MongoDB connection configured in MONGODB_URI environment variable
 *   - At least one company and team in the database (or it will use defaults)
 * 
 * The script will:
 *   - Generate 10 tickets with unique emails
 *   - Use company ID: COMP-20251110-HDI3MCNDIR
 *   - Assign random priorities (low, medium, high)
 *   - Assign random statuses (open, in_progress, resolved, closed)
 *   - Store all tickets in the Tickets database
 */

import connectDB, { User, Company } from './lib/db.js'
import connectTicketsDB, { getTicket, generateTicketId } from './modules/ticket.js'
import { getTeam } from './modules/team.js'

// Sample data for generating tickets
const sampleEmails = [
  'john.doe@example.com',
  'jane.smith@example.com',
  'michael.johnson@example.com',
  'sarah.williams@example.com',
  'david.brown@example.com',
  'emily.davis@example.com',
  'robert.miller@example.com',
  'lisa.wilson@example.com',
  'james.moore@example.com',
  'patricia.taylor@example.com',
  'william.anderson@example.com',
  'jennifer.thomas@example.com',
  'richard.jackson@example.com',
  'maria.white@example.com',
  'joseph.harris@example.com',
  'susan.martin@example.com',
  'thomas.thompson@example.com',
  'jessica.garcia@example.com',
  'charles.martinez@example.com',
  'karen.robinson@example.com'
]

const sampleSubjects = [
  'Login issue with my account',
  'Payment processing error',
  'Feature request: Dark mode',
  'Unable to access dashboard',
  'Email notifications not working',
  'Password reset not working',
  'Account verification problem',
  'Data export request',
  'Billing inquiry',
  'API integration help needed',
  'Mobile app crash on iOS',
  'Slow page loading times',
  'Missing transaction history',
  'Profile picture upload failed',
  'Two-factor authentication setup',
  'Subscription upgrade request',
  'Report a bug in search feature',
  'Request for account deletion',
  'Integration with third-party service',
  'Performance optimization needed'
]

const sampleMessages = [
  'I am unable to log into my account. I keep getting an error message saying "Invalid credentials" even though I am using the correct password.',
  'I tried to process a payment but it keeps failing. The error message is not clear. Can someone help me resolve this?',
  'I would like to request a dark mode feature for the application. This would be very helpful for night-time usage.',
  'I cannot access my dashboard. It shows a blank page or error 500. This started happening yesterday.',
  'I am not receiving email notifications for important updates. I have checked my spam folder and email settings.',
  'I tried to reset my password but I am not receiving the reset link in my email. Please help.',
  'I am having trouble verifying my email address. The verification link seems to be expired or invalid.',
  'I need to export my data for the last 6 months. Can you provide me with a CSV or JSON file?',
  'I have a question about my billing. I was charged twice this month and I want to understand why.',
  'I need help integrating your API with my application. The documentation is not clear on authentication.',
  'The mobile app crashes every time I try to open it on my iPhone. This started after the latest update.',
  'The pages are loading very slowly. It takes more than 10 seconds to load a simple page. This is affecting my productivity.',
  'I cannot see my transaction history for the past month. The records seem to be missing from my account.',
  'I tried to upload a profile picture but it keeps failing. The file is under 2MB and in JPG format.',
  'I need help setting up two-factor authentication. The setup process is not clear in the settings.',
  'I would like to upgrade my subscription to the professional plan. How can I do this?',
  'I found a bug in the search feature. When I search for a specific term, it returns irrelevant results.',
  'I would like to delete my account and all associated data. Please guide me through the process.',
  'I need to integrate your service with a third-party tool. Do you have any documentation or examples?',
  'The application is running slowly and I think it needs performance optimization. Can you investigate?'
]

const priorities = ['low', 'medium', 'high']
const statuses = ['open', 'in_progress', 'resolved', 'closed']

// Generate random name from email
function getNameFromEmail(email) {
  const namePart = email.split('@')[0]
  const parts = namePart.split('.')
  if (parts.length > 1) {
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  }
  return namePart.charAt(0).toUpperCase() + namePart.slice(1)
}

// Generate random date within last 30 days
function getRandomDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date(now)
  date.setDate(date.getDate() - daysAgo)
  return date
}

async function generateTickets() {
  try {
    console.log('🚀 Starting ticket generation...\n')

    // Connect to users database
    console.log('📡 Connecting to users database...')
    await connectDB()
    console.log('✅ Connected to users database\n')

    // Connect to Tickets database
    console.log('📡 Connecting to Tickets database...')
    await connectTicketsDB()
    console.log('✅ Connected to Tickets database\n')

    // Use specific company ID
    const targetCompanyId = 'COMP-20251110-HDI3MCNDIR'
    console.log(`🔍 Finding company with ID: ${targetCompanyId}...`)
    const company = await Company.findOne({ companyId: targetCompanyId })
    
    let companyId, companyName
    if (company) {
      companyId = company.companyId
      companyName = company.companyName
      console.log(`✅ Found company: ${companyName} (${companyId})\n`)
    } else {
      // Use the company ID even if not found in database
      companyId = targetCompanyId
      companyName = 'Company (ID: ' + targetCompanyId + ')'
      console.log(`⚠️  Company not found in database, using ID: ${companyId}\n`)
    }

    // Get a team from the database
    console.log('🔍 Finding a team...')
    const Team = await getTeam()
    const team = await Team.findOne({ 
      companyId: companyId,
      isActive: true 
    })
    
    let teamId, teamName
    if (team) {
      teamId = team.teamId
      teamName = team.teamName
      console.log(`✅ Found team: ${teamName} (${teamId})\n`)
    } else {
      // Use default values if no team exists
      teamId = 'TEAM-DEFAULT-0000000000'
      teamName = 'Default Support Team'
      console.log(`⚠️  No team found, using default: ${teamName} (${teamId})\n`)
    }

    // Get Ticket model
    const Ticket = await getTicket()

    console.log('📝 Generating 10 tickets...\n')

    const createdTickets = []

    for (let i = 0; i < 10; i++) {
      const email = sampleEmails[i]
      const name = getNameFromEmail(email)
      const subject = sampleSubjects[i]
      const message = sampleMessages[i]
      
      // Randomly assign priority and status
      const priority = priorities[Math.floor(Math.random() * priorities.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      // Generate ticket ID
      const ticketId = await generateTicketId(subject)
      
      // Create activity log entry
      const activityLog = [{
        action: 'created',
        performedBy: {
          userId: `user_${i + 1}`,
          email: email,
          name: name
        },
        details: `Ticket created with priority: ${priority}`,
        timestamp: getRandomDate()
      }]

      // Add status change activity if not open
      if (status !== 'open') {
        activityLog.push({
          action: 'status_changed',
          performedBy: {
            userId: `agent_${i + 1}`,
            email: 'agent@example.com',
            name: 'Support Agent'
          },
          details: `Status changed to ${status}`,
          timestamp: new Date(getRandomDate().getTime() + 1000 * 60 * 60) // 1 hour after creation
        })
      }

      // Create ticket
      const ticket = new Ticket({
        ticketId,
        companyId,
        companyName,
        teamId,
        teamName,
        raisedBy: {
          userId: `user_${i + 1}`,
          email: email,
          name: name
        },
        subject: subject,
        message: message,
        priority: priority,
        status: status,
        activityLog: activityLog,
        createdAt: getRandomDate()
      })

      await ticket.save()
      createdTickets.push({
        ticketId: ticket.ticketId,
        email: email,
        priority: priority,
        status: status,
        subject: subject
      })

      console.log(`✅ Created ticket ${i + 1}/10: ${ticketId} - ${email} (${priority}, ${status})`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Ticket Generation Complete!')
    console.log('='.repeat(60))
    console.log(`\n📊 Summary:`)
    console.log(`   - Total tickets created: ${createdTickets.length}`)
    console.log(`   - Company: ${companyName}`)
    console.log(`   - Team: ${teamName}`)
    
    // Count by status
    const statusCount = {}
    createdTickets.forEach(t => {
      statusCount[t.status] = (statusCount[t.status] || 0) + 1
    })
    console.log(`\n📈 Status breakdown:`)
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`)
    })
    
    // Count by priority
    const priorityCount = {}
    createdTickets.forEach(t => {
      priorityCount[t.priority] = (priorityCount[t.priority] || 0) + 1
    })
    console.log(`\n🎯 Priority breakdown:`)
    Object.entries(priorityCount).forEach(([priority, count]) => {
      console.log(`   - ${priority}: ${count}`)
    })

    console.log(`\n📋 Sample tickets:`)
    createdTickets.slice(0, 5).forEach(t => {
      console.log(`   - ${t.ticketId}: ${t.email} (${t.priority}, ${t.status})`)
    })

    console.log('\n✅ All tickets have been saved to the database!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error generating tickets:', error)
    process.exit(1)
  }
}

// Run the script
generateTickets()

