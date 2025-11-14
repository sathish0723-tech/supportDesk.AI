/**
 * Verify Database Configuration
 * Run: node verify-database.js
 * 
 * This checks what database is actually being used
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

async function verifyDatabase() {
  console.log('🔍 Verifying Database Configuration...\n')
  
  let env
  try {
    env = loadEnv()
  } catch (error) {
    console.error('❌ Could not load .env.local')
    process.exit(1)
  }
  
  const uri = env.MONGODB_URI
  const dbNameFromEnv = env.MONGODB_DB_NAME
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local')
    process.exit(1)
  }
  
  console.log('📋 Configuration:')
  console.log(`   Connection String: ${uri.replace(/:[^:@]+@/, ':****@')}`)
  console.log(`   MONGODB_DB_NAME: ${dbNameFromEnv || '(not set)'}`)
  console.log('')
  
  // Extract database name from URI
  const uriMatch = uri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/)
  const dbNameFromURI = uriMatch ? uriMatch[1] : null
  
  console.log('📊 Database Name Analysis:')
  if (dbNameFromURI) {
    console.log(`   ✅ Database name in URI: "${dbNameFromURI}"`)
  } else {
    console.log(`   ⚠️  No database name in URI (will use default: "test")`)
  }
  
  if (dbNameFromEnv) {
    console.log(`   ℹ️  MONGODB_DB_NAME env var: "${dbNameFromEnv}" (Mongoose doesn't use this)`)
  }
  console.log('')
  
  try {
    console.log('⏳ Connecting to MongoDB...')
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    })
    
    console.log('✅ Connected to MongoDB')
    console.log('')
    
    // Get actual database being used
    const db = mongoose.connection.db
    const actualDbName = db.databaseName
    
    console.log('🎯 ACTUAL DATABASE BEING USED:')
    console.log(`   Database Name: "${actualDbName}"`)
    console.log('')
    
    if (actualDbName === 'users') {
      console.log('✅ CORRECT! Data is being stored in "users" database')
    } else {
      console.log(`⚠️  WARNING: Data is being stored in "${actualDbName}" database, not "users"`)
      console.log('')
      console.log('🔧 TO FIX:')
      console.log('   Update MONGODB_URI in .env.local to include /users at the end:')
      console.log('   mongodb+srv://sathish23:****@cluster0.owiirvv.mongodb.net/users')
    }
    console.log('')
    
    // List collections
    const collections = await db.listCollections().toArray()
    console.log(`📁 Collections in "${actualDbName}" database: ${collections.length}`)
    collections.forEach(col => {
      console.log(`   - ${col.name}`)
    })
    console.log('')
    
    // Check users collection
    if (collections.find(c => c.name === 'users')) {
      const User = mongoose.connection.collection('users')
      const count = await User.countDocuments()
      console.log(`👥 Users in "users" collection: ${count}`)
      
      if (count > 0) {
        const sample = await User.find({}).limit(1).toArray()
        if (sample.length > 0) {
          console.log(`   Sample user: ${sample[0].email || 'N/A'}`)
        }
      }
    } else {
      console.log('⚠️  "users" collection not found yet (will be created on first save)')
    }
    console.log('')
    
    // Check companies collection
    if (collections.find(c => c.name === 'companies')) {
      const Company = mongoose.connection.collection('companies')
      const count = await Company.countDocuments()
      console.log(`🏢 Companies in "companies" collection: ${count}`)
    } else {
      console.log('⚠️  "companies" collection not found yet (will be created on first save)')
    }
    
    await mongoose.disconnect()
    console.log('')
    console.log('✅ Verification completed!')
    
  } catch (error) {
    console.error('')
    console.error('❌ CONNECTION FAILED!')
    console.error('')
    console.error('Error:', error.message)
    process.exit(1)
  }
}

verifyDatabase()




