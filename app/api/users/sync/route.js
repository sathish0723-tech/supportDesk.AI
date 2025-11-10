import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB, { User, Company, generateCompanyId } from '@/lib/db'

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
    } else {
      // Create new user
      console.log('📝 Creating new user:', userData.email)
      user = new User(userData)
      await user.save()
      console.log('✅ User created:', { id: user._id, email: user.email, collection: 'users' })
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

