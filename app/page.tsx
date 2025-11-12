import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'

/**
 * Root page component that redirects users based on auth status
 * @returns Redirect to dashboard or auth
 */
export default async function RootPage() {
  // Don't redirect if user is in email verification flow
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  
  if (pathname.includes('verify-email')) {
    // Let Clerk handle the verification flow
    return null
  }
  
  const { userId } = await auth()
  
  if (userId) {
    redirect('/dashboard')
  } else {
    redirect('/auth')
  }
}
