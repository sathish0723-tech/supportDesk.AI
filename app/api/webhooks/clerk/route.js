import { Webhook } from 'svix'
import { headers } from 'next/headers'
import connectDB, { User, Company, generateCompanyId } from '@/lib/db'
import { findCompanyByEmailDomain, extractDomainFromEmail } from '@/lib/dns-utils'

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type
  const { id, email_addresses, first_name, last_name, image_url } = evt.data

  console.log(`📥 Webhook received: ${eventType} for user ${id}`)

  // Connect to database
  try {
    await connectDB()
    console.log('✅ Database connected')
  } catch (error) {
    console.error('❌ Database connection error:', error)
    return new Response(JSON.stringify({ error: 'Database connection failed', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (eventType === 'user.created') {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ clerkId: id })
      
      if (existingUser) {
        console.log(`ℹ️ User already exists: ${existingUser.email}`)
        return new Response(JSON.stringify({ message: 'User already exists', userId: existingUser._id }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Get user email
      const userEmail = email_addresses[0]?.email_address || ''
      console.log(`📧 Processing user creation for email: ${userEmail}`)
      
      // Check if there's an existing company for this email domain
      let existingCompany = null
      if (userEmail) {
        try {
          console.log(`🔍 Starting domain check for email: ${userEmail}`)
          // Try with MX check first, but if it fails, still check database
          existingCompany = await findCompanyByEmailDomain(userEmail, Company, false)
          if (existingCompany) {
            console.log(`🏢 Found existing company for domain: ${existingCompany.companyName} (${existingCompany.companyId})`)
          } else {
            console.log(`ℹ️ No existing company found for email domain: ${userEmail}`)
          }
        } catch (error) {
          console.error('❌ Error checking for existing company by domain:', error)
          console.error('Error details:', {
            message: error.message,
            stack: error.stack
          })
          // Continue with user creation even if domain check fails
        }
      } else {
        console.log('⚠️ No email address found for user')
      }

      // Create new user
      const userData = {
        clerkId: id,
        email: userEmail,
        name: `${first_name || ''} ${last_name || ''}`.trim() || userEmail?.split('@')[0] || 'User',
        firstName: first_name || '',
        lastName: last_name || '',
        image: image_url || '',
        emailVerified: email_addresses[0]?.verification?.status === 'verified',
        isActive: true,
        lastLoginAt: new Date(),
      }

      // If we found an existing company, associate the user with it
      if (existingCompany) {
        userData.companyId = existingCompany.companyId
        userData.companyName = existingCompany.companyName
        userData.totalEmployees = existingCompany.totalEmployees
        userData.industry = existingCompany.industry
        userData.address = existingCompany.address
        userData.website = existingCompany.website
        
        console.log(`🔗 Associating user with existing company: ${existingCompany.companyName}`)
      }

      console.log('📝 Creating user with data:', { 
        clerkId: userData.clerkId, 
        email: userData.email,
        companyId: userData.companyId || 'none'
      })

      const user = new User(userData)
      const savedUser = await user.save()

      // If we found an existing company, add user to company members
      if (existingCompany && savedUser._id) {
        try {
          // Check if user is already in members list
          const isMember = existingCompany.members.some(
            member => member.userId?.toString() === savedUser._id.toString() || 
                     member.email?.toLowerCase() === userEmail.toLowerCase()
          )

          if (!isMember) {
            existingCompany.members.push({
              userId: savedUser._id,
              email: userEmail,
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
      
      console.log('✅ User created in MongoDB:', {
        id: savedUser._id,
        clerkId: savedUser.clerkId,
        email: savedUser.email,
        companyId: savedUser.companyId || 'none',
        collection: 'users'
      })

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        userId: savedUser._id,
        email: savedUser.email,
        companyId: savedUser.companyId || null,
        autoAssociated: !!existingCompany
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('❌ Error creating user:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      return new Response(JSON.stringify({ 
        error: 'Error creating user', 
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  if (eventType === 'user.updated') {
    try {
      const user = await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: email_addresses[0]?.email_address || '',
          name: `${first_name || ''} ${last_name || ''}`.trim() || email_addresses[0]?.email_address?.split('@')[0] || 'User',
          firstName: first_name || '',
          lastName: last_name || '',
          image: image_url || '',
          emailVerified: email_addresses[0]?.verification?.status === 'verified',
          lastLoginAt: new Date(),
        },
        { new: true, upsert: false }
      )

      if (user) {
        console.log('✅ User updated in MongoDB:', user.email)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return new Response('Error updating user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    try {
      await User.findOneAndDelete({ clerkId: id })
      console.log('✅ User deleted from MongoDB:', id)
    } catch (error) {
      console.error('Error deleting user:', error)
      return new Response('Error deleting user', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}

