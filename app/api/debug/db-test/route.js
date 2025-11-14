import connectDB, { User } from '@/lib/db'

/**
 * Debug endpoint to test database connection and user collection
 * GET /api/debug/db-test
 */
export async function GET(req) {
  try {
    // Connect to database
    await connectDB()
    
    // Try to find all users
    const users = await User.find({}).limit(5)
    const userCount = await User.countDocuments({})
    
    // Get collection name
    const collectionName = User.collection.name
    const dbName = User.db.databaseName
    
    return Response.json({
      success: true,
      database: {
        name: dbName,
        collection: collectionName,
        fullPath: `${dbName}.${collectionName}`,
        userCount: userCount,
        sampleUsers: users.map(u => ({
          id: u._id,
          clerkId: u.clerkId,
          email: u.email,
          name: u.name
        }))
      },
      message: 'Database connection successful'
    })
  } catch (error) {
    console.error('Database test error:', error)
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}




