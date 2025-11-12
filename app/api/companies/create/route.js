import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB, { User, Company, generateCompanyId } from '@/lib/db'
import { extractDomainFromEmail } from '@/lib/dns-utils'

/**
 * Create or update company for the current user
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
    const {
      companyName,
      totalEmployees,
      industry,
      phoneNumber,
      address,
      website,
    } = body

    if (!companyName) {
      return Response.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Get user from MongoDB
    const user = await User.findOne({ clerkId: userId })
    
    if (!user) {
      return Response.json(
        { success: false, error: 'User not found. Please sync your account first.' },
        { status: 404 }
      )
    }

    // Extract domain from user's email or website
    let domain = null
    if (user.email) {
      domain = extractDomainFromEmail(user.email)
    }
    
    // If no domain from email, try to extract from website
    if (!domain && website) {
      const cleanDomain = website
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .trim()
        .toLowerCase()
      if (cleanDomain) {
        domain = cleanDomain
      }
    }

    // Check if user already has a company
    let company = null
    if (user.companyId) {
      company = await Company.findOne({ companyId: user.companyId })
    }

    if (company) {
      // Update existing company
      company.companyName = companyName
      company.totalEmployees = totalEmployees || company.totalEmployees
      company.industry = industry || company.industry
      company.phoneNumber = phoneNumber || company.phoneNumber
      company.address = address || company.address
      company.website = website || company.website
      if (domain) {
        company.domain = domain
      }
      await company.save()
    } else {
      // Check if a company with this domain already exists
      if (domain) {
        const existingCompany = await Company.findOne({ domain })
        if (existingCompany) {
          // Associate user with existing company
          company = existingCompany
          
          // Update user with company info
          user.companyId = company.companyId
          user.companyName = company.companyName
          user.totalEmployees = company.totalEmployees
          user.industry = company.industry
          user.address = company.address
          user.website = company.website
          await user.save()

          // Add user to company members if not already there
          const isMember = company.members.some(
            member => member.userId?.toString() === user._id.toString() || 
                     member.email?.toLowerCase() === user.email.toLowerCase()
          )

          if (!isMember) {
            company.members.push({
              userId: user._id,
              email: user.email,
              role: 'member',
              addedAt: new Date(),
            })
            await company.save()
          }

          return Response.json({
            success: true,
            data: {
              companyId: company.companyId,
              companyName: company.companyName,
              industry: company.industry,
              totalEmployees: company.totalEmployees,
            },
            message: 'User associated with existing company',
            existingCompany: true
          })
        }
      }

      // Generate unique company ID
      const companyId = await generateCompanyId(companyName)

      // Create new company
      company = new Company({
        companyId,
        companyName,
        totalEmployees,
        industry,
        phoneNumber,
        address,
        website,
        domain: domain || undefined,
        ownerId: user._id,
        ownerEmail: user.email,
        members: [{
          userId: user._id,
          email: user.email,
          role: 'owner',
        }],
        isActive: true,
      })

      await company.save()

      // Update user with company ID
      user.companyId = companyId
      user.companyName = companyName
      user.totalEmployees = totalEmployees
      user.industry = industry
      user.address = address
      user.website = website
      await user.save()
    }

    return Response.json({
      success: true,
      data: {
        companyId: company.companyId,
        companyName: company.companyName,
        industry: company.industry,
        totalEmployees: company.totalEmployees,
      },
      message: 'Company created/updated successfully'
    })
  } catch (error) {
    console.error('Error creating company:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

