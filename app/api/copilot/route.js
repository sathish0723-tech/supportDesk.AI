import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB, { User, Company } from '@/lib/db'

/**
 * Copilot API Route - Forwards chat messages to local copilot service
 * POST /api/copilot
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

    const body = await req.json()

    // Support both simple message format and complex payload format
    let message = body.message
    let complexPayload = body

    // If it's a simple message format, extract it
    if (message && typeof message === 'string') {
      if (!message.trim()) {
        return Response.json(
          { success: false, error: 'Message is required' },
          { status: 400 }
        )
      }
    } else if (!body.prompt && !body.endpoint && !message) {
      // If no message, prompt, or endpoint, it's invalid
      return Response.json(
        { success: false, error: 'Message, prompt, or payload is required' },
        { status: 400 }
      )
    }

    // Connect to database and get user information
    await connectDB()
    const userDoc = await User.findOne({ clerkId: userId })
    
    if (!userDoc) {
      return Response.json(
        { success: false, error: 'User not found. Please sync your account first.' },
        { status: 404 }
      )
    }

    // Get Clerk user data for additional info
    const clerkUser = await currentUser()

    // Get company information if available
    let companyData = null
    if (userDoc.companyId) {
      const company = await Company.findOne({ companyId: userDoc.companyId })
      if (company) {
        companyData = {
          companyId: company.companyId,
          companyName: company.companyName,
          industry: company.industry,
          website: company.website,
          domain: company.domain,
          address: company.address,
          totalEmployees: company.totalEmployees
        }
      }
    }

    // Build user data object
    const userData = {
      userId: userId,
      clerkId: userId,
      email: userDoc.email || clerkUser?.emailAddresses[0]?.emailAddress || '',
      name: userDoc.name || clerkUser?.fullName || '',
      firstName: userDoc.firstName || clerkUser?.firstName || '',
      lastName: userDoc.lastName || clerkUser?.lastName || '',
      image: userDoc.image || clerkUser?.imageUrl || ''
    }

    // Use company data from frontend if provided, otherwise use server-fetched data
    const finalCompanyData = complexPayload.company || companyData

    // Structure the payload - merge complex payload with user/company data
    // If it's a simple message, create prompt-based payload
    // If it's a complex payload, merge it with user/company data
    let payload
    if (message && typeof message === 'string' && !complexPayload.company) {
      // Simple message format
      payload = {
        prompt: message.trim(),
        user: userData,
        company: finalCompanyData
      }
    } else {
      // Complex payload format - merge with user and company data
      // Remove company from complexPayload to avoid duplication, then add final company data
      const { company: _, ...restOfPayload } = complexPayload
      payload = {
        ...restOfPayload,
        user: userData,
        company: finalCompanyData,
        // If prompt exists in complex payload, keep it; otherwise add message as prompt
        prompt: complexPayload.prompt || message || complexPayload.message || ''
      }
    }

    // Get the local copilot API URL from environment or use default
    const copilotApiUrl = process.env.COPILOT_API_URL || 'http://localhost:8000/api/copilot/chat'

    console.log('📤 Sending payload to copilot service:', JSON.stringify(payload, null, 2))

    // Forward the request to the local copilot service
    const response = await fetch(copilotApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { error: await response.text() }
      }
      
      console.error('Copilot API error:', errorData)
      
      return Response.json(
        { 
          success: false, 
          error: errorData.error || errorData.message || 'Failed to get response from copilot service',
          details: errorData.details || errorData
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Extract response text
    let responseText = ''
    if (data.response) {
      responseText = data.response
    } else if (data.message) {
      responseText = data.message
    } else if (typeof data === 'string') {
      responseText = data
    } else {
      responseText = JSON.stringify(data)
    }

    return Response.json({
      success: true,
      response: responseText
    })

  } catch (error) {
    console.error('Error in copilot API:', error)
    return Response.json(
      { 
        success: false, 
        error: error.message || 'An unexpected error occurred. Make sure the copilot service is running on http://localhost:8000' 
      },
      { status: 500 }
    )
  }
}

