/**
 * Check which database is currently being used by the running server
 * Run: node check-current-database.js
 */

const http = require('http')

async function checkDatabase() {
  console.log('🔍 Checking which database your server is using...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/debug/db-test')
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Server Response:')
      console.log(`   Database: "${data.database.name}"`)
      console.log(`   Collection: "${data.database.collection}"`)
      console.log(`   Full Path: "${data.database.fullPath}"`)
      console.log(`   User Count: ${data.database.userCount}`)
      console.log('')
      
      if (data.database.name === 'users') {
        console.log('✅ CORRECT! Server is using "users" database')
        console.log(`   Data is stored in: ${data.database.fullPath}`)
      } else {
        console.log(`❌ WRONG! Server is using "${data.database.name}" database`)
        console.log('   Expected: "users" database')
        console.log('')
        console.log('🔧 FIX: Restart your Next.js server')
        console.log('   Stop server (Ctrl+C) and run: npm run dev')
      }
    } else {
      console.log('❌ Error:', data.error)
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running!')
      console.log('   Start your server: npm run dev')
    } else {
      console.log('❌ Error:', error.message)
    }
  }
}

checkDatabase()





