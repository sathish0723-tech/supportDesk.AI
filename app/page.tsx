import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

/**
 * Root page component that redirects users based on auth status
 * @returns Redirect to dashboard or auth
 */
export default async function RootPage() {
  const { userId } = await auth()
  
  if (userId) {
    redirect('/dashboard')
  } else {
    redirect('/auth')
  }
}
