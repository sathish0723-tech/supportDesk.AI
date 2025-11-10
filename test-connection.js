/**
 * Quick MongoDB Connection Test
 * Run: node test-connection.js
 * 
 * This uses the same connection logic as your app
 */

// Read .env.local manually
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local')
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found')
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      env[match[1].trim()] = match[2].trim()
    }
  })
  
  return env
}

const mongoose = require('mongoose')

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection...\n')
  
  let env
  try {
    env = loadEnv()
  } catch (error) {
    console.error('❌ Could not load .env.local')
    console.error('   Make sure .env.local exists in the project root')
    process.exit(1)
  }
  
  const uri = env.MONGODB_URI
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local')
    process.exit(1)
  }
  
  console.log('📋 Connection String:', uri.replace(/:[^:@]+@/, ':****@'))
  console.log('')
  
  try {
    console.log('⏳ Connecting to MongoDB...')
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    })
    
    console.log('✅ SUCCESS! Connected to MongoDB')
    console.log('')
    
    // Get database info
    const db = mongoose.connection.db
    const dbName = db.databaseName
    console.log(`📊 Database Name: ${dbName}`)
    
    // List collections
    const collections = await db.listCollections().toArray()
    console.log(`📁 Collections: ${collections.length}`)
    collections.forEach(col => {
      console.log(`   - ${col.name}`)
    })
    
    // Check users collection
    if (collections.find(c => c.name === 'users')) {
      const User = mongoose.connection.collection('users')
      const count = await User.countDocuments()
      console.log(`👥 Users in collection: ${count}`)
    } else {
      console.log('⚠️  "users" collection not found yet (will be created on first save)')
    }
    
    await mongoose.disconnect()
    console.log('')
    console.log('✅ Test completed successfully!')
    console.log('')
    console.log('🎯 Next: Restart your Next.js server and try signing up again')
    
  } catch (error) {
    console.error('')
    console.error('❌ CONNECTION FAILED!')
    console.error('')
    console.error('Error:', error.message)
    console.error('')
    
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('🔧 FIX: Password mismatch!')
      console.error('   1. Go to: https://cloud.mongodb.com/v2#/security/database/users')
      console.error('   2. Find user: sathish23')
      console.error('   3. Click Edit → Edit Password')
      console.error('   4. Set password to: sathish23')
      console.error('   5. Make sure role is: Read and write to any database')
      console.error('   6. Wait 1-2 minutes, then run this test again')
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('🔧 FIX: IP not whitelisted!')
      console.error('   1. Go to: https://cloud.mongodb.com/v2#/security/network/whitelist')
      console.error('   2. Add: 0.0.0.0/0 (for development)')
      console.error('   3. Wait 1-2 minutes, then run this test again')
    } else {
      console.error('🔧 Check your connection string and network settings')
    }
    
    process.exit(1)
  }
}

testConnection()

