/**
 * Test MongoDB Connection Script
 * Run this to test if your MongoDB credentials are correct
 * 
 * Usage: node test-mongodb-connection.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sathish23:sathish23@cluster0.owiirvv.mongodb.net/users'

console.log('🔍 Testing MongoDB Connection...')
console.log('📝 Connection String:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')) // Hide password

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    
    console.log('✅ SUCCESS! MongoDB connection works!')
    console.log('📊 Database:', mongoose.connection.db.databaseName)
    console.log('🔗 Ready State:', mongoose.connection.readyState)
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log('📁 Collections:', collections.map(c => c.name))
    
    await mongoose.disconnect()
    console.log('✅ Connection closed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ CONNECTION FAILED!')
    console.error('Error:', error.message)
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 FIX NEEDED:')
      console.log('1. Go to: https://cloud.mongodb.com/v2#/security/database/users')
      console.log('2. Find user "sathish23" or create it')
      console.log('3. Set password to match your .env.local')
      console.log('4. Make sure user has "Read and write to any database" role')
    } else if (error.message.includes('IP')) {
      console.log('\n🔧 FIX NEEDED:')
      console.log('1. Go to: https://cloud.mongodb.com/v2#/security/network/whitelist')
      console.log('2. Add your IP or 0.0.0.0/0 (for development)')
    }
    
    process.exit(1)
  }
}

testConnection()




