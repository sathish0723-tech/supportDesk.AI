import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB, { User, Company, generateCompanyId } from '@/lib/db'

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
      await company.save()
    } else {
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

