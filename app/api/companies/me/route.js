import { auth } from '@clerk/nextjs/server'
import connectDB, { User, Company } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      return Response.json(
        { success: false, error: 'User not found. Please sign in again.' },
        { status: 404 }
      )
    }

    if (!user.companyId) {
      return Response.json(
        { success: true, data: null, message: 'No company linked yet' },
        { status: 200 }
      )
    }

    const company = await Company.findOne({ companyId: user.companyId })
    if (!company) {
      return Response.json(
        { success: true, data: null, message: 'Company not found' },
        { status: 200 }
      )
    }

    return Response.json({
      success: true,
      data: {
        companyId: company.companyId,
        companyName: company.companyName,
        totalEmployees: company.totalEmployees,
        industry: company.industry,
        phoneNumber: company.phoneNumber,
        address: company.address,
        website: company.website,
        ownerEmail: company.ownerEmail,
        members: company.members?.map(m => ({
          email: m.email,
          role: m.role,
          addedAt: m.addedAt
        })) || []
      }
    })
  } catch (error) {
    console.error('Error fetching company:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}






