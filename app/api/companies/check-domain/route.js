import { auth } from '@clerk/nextjs/server'
import connectDB, { Company } from '@/lib/db'
import { findCompanyByEmailDomain, extractDomainFromEmail, checkDomainMX } from '@/lib/dns-utils'

/**
 * Check if a domain exists and if a company exists for that domain
 * This can be called before/during signup to check domain status
 * GET /api/companies/check-domain?email=user@example.com
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return Response.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Extract domain from email
    const domain = extractDomainFromEmail(email)
    
    if (!domain) {
      return Response.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Check MX records
    let mxCheck = null
    try {
      const hasMX = await checkDomainMX(domain)
      mxCheck = {
        hasMX,
        domain,
        valid: hasMX
      }
    } catch (error) {
      mxCheck = {
        hasMX: false,
        domain,
        valid: false,
        error: error.message
      }
    }

    // Check if company exists for this domain
    let company = null
    try {
      company = await Company.findOne({ domain })
    } catch (error) {
      console.error('Error finding company:', error)
    }

    return Response.json({
      success: true,
      data: {
        email,
        domain,
        mxCheck,
        company: company ? {
          companyId: company.companyId,
          companyName: company.companyName,
          exists: true
        } : {
          exists: false
        },
        shouldAutoAssociate: !!company
      }
    })
  } catch (error) {
    console.error('Error checking domain:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST version - accepts email in body
 */
export async function POST(req) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return Response.json(
        { success: false, error: 'Email is required in request body' },
        { status: 400 }
      )
    }

    // Extract domain from email
    const domain = extractDomainFromEmail(email)
    
    if (!domain) {
      return Response.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Check MX records
    let mxCheck = null
    try {
      const hasMX = await checkDomainMX(domain)
      mxCheck = {
        hasMX,
        domain,
        valid: hasMX
      }
    } catch (error) {
      mxCheck = {
        hasMX: false,
        domain,
        valid: false,
        error: error.message
      }
    }

    // Check if company exists for this domain
    let company = null
    try {
      company = await Company.findOne({ domain })
    } catch (error) {
      console.error('Error finding company:', error)
    }

    return Response.json({
      success: true,
      data: {
        email,
        domain,
        mxCheck,
        company: company ? {
          companyId: company.companyId,
          companyName: company.companyName,
          exists: true
        } : {
          exists: false
        },
        shouldAutoAssociate: !!company
      }
    })
  } catch (error) {
    console.error('Error checking domain:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

