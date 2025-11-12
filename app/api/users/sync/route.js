import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB, { User, Company, generateCompanyId } from '@/lib/db'
import { findCompanyByEmailDomain } from '@/lib/dns-utils'

/**
 * Sync Clerk user to MongoDB
 * This endpoint is called after user signs in/up to ensure data is synced
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

    // Get user data from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Connect to database
    try {
      await connectDB()
      console.log('✅ Database connected for user sync')
    } catch (error) {
      console.error('❌ Database connection error:', error)
      return Response.json(
        { success: false, error: 'Database connection failed', details: error.message },
        { status: 500 }
      )
    }

    // Check if user exists
    let user = await User.findOne({ clerkId: userId })

    const userData = {
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: clerkUser.fullName || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User',
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      image: clerkUser.imageUrl || '',
      emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
      isActive: true,
      lastLoginAt: new Date(),
    }

    if (user) {
      // Update existing user
      console.log('📝 Updating existing user:', user.email)
      user = await User.findOneAndUpdate(
        { clerkId: userId },
        userData,
        { new: true }
      )
      console.log('✅ User updated:', { id: user._id, email: user.email, collection: 'users' })
      
      // If user doesn't have a company, check if one exists for their domain
      if (!user.companyId && userData.email) {
        try {
          console.log(`🔍 Checking for existing company by domain for user: ${userData.email}`)
          const existingCompany = await findCompanyByEmailDomain(userData.email, Company, false)
          if (existingCompany) {
            // Associate user with existing company
            user.companyId = existingCompany.companyId
            user.companyName = existingCompany.companyName
            user.totalEmployees = existingCompany.totalEmployees
            user.industry = existingCompany.industry
            user.address = existingCompany.address
            user.website = existingCompany.website
            await user.save()
            
            // Add user to company members if not already there
            const isMember = existingCompany.members.some(
              member => member.userId?.toString() === user._id.toString() || 
                       member.email?.toLowerCase() === userData.email.toLowerCase()
            )

            if (!isMember) {
              existingCompany.members.push({
                userId: user._id,
                email: userData.email,
                role: 'member',
                addedAt: new Date(),
              })
              await existingCompany.save()
              console.log(`✅ Associated user with existing company: ${existingCompany.companyName}`)
            }
          }
        } catch (error) {
          console.error('Error checking for existing company by domain:', error)
          // Continue even if domain check fails
        }
      }
    } else {
      // Create new user
      console.log('📝 Creating new user:', userData.email)
      
      // Check if there's an existing company for this email domain
      let existingCompany = null
      if (userData.email) {
        try {
          console.log(`🔍 Checking for existing company by domain for new user: ${userData.email}`)
          existingCompany = await findCompanyByEmailDomain(userData.email, Company, false)
          if (existingCompany) {
            console.log(`🏢 Found existing company for domain: ${existingCompany.companyName}`)
            // Associate user with existing company
            userData.companyId = existingCompany.companyId
            userData.companyName = existingCompany.companyName
            userData.totalEmployees = existingCompany.totalEmployees
            userData.industry = existingCompany.industry
            userData.address = existingCompany.address
            userData.website = existingCompany.website
          }
        } catch (error) {
          console.error('Error checking for existing company by domain:', error)
          // Continue with user creation even if domain check fails
        }
      }
      
      user = new User(userData)
      await user.save()
      console.log('✅ User created:', { id: user._id, email: user.email, collection: 'users' })
      
      // If we found an existing company, add user to company members
      if (existingCompany && user._id) {
        try {
          const isMember = existingCompany.members.some(
            member => member.userId?.toString() === user._id.toString() || 
                     member.email?.toLowerCase() === userData.email.toLowerCase()
          )

          if (!isMember) {
            existingCompany.members.push({
              userId: user._id,
              email: userData.email,
              role: 'member',
              addedAt: new Date(),
            })
            await existingCompany.save()
            console.log(`✅ Added user to company members: ${existingCompany.companyName}`)
          }
        } catch (error) {
          console.error('Error adding user to company members:', error)
          // Don't fail user creation if adding to company fails
        }
      }
    }

    return Response.json({
      success: true,
      data: {
        userId: user._id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        companyId: user.companyId,
      },
      message: 'User synced successfully'
    })
  } catch (error) {
    console.error('Error syncing user:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

