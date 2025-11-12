import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/auth(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/companies/check-domain(.*)', // Allow domain check without auth
])

export default clerkMiddleware(async (auth, req) => {
  const { pathname, searchParams } = req.nextUrl
  
  // Special handling for email verification to prevent loops
  if (pathname.includes('verify-email-address')) {
    // Check if this is a repeated verification attempt (prevent loop)
    const verificationAttempts = req.cookies.get('verification_attempts')?.value || '0'
    const attempts = parseInt(verificationAttempts, 10)
    const lastAttemptTime = req.cookies.get('verification_last_attempt')?.value || '0'
    const timeSinceLastAttempt = Date.now() - parseInt(lastAttemptTime, 10)
    
    // If too many attempts in short time (more aggressive), redirect immediately
    if (attempts > 3 && timeSinceLastAttempt < 10000) { // 3 attempts in 10 seconds
      console.log('⚠️ Verification loop detected! Redirecting to onboarding to break loop')
      const response = NextResponse.redirect(new URL('/onboarding', req.url))
      response.cookies.delete('verification_attempts')
      response.cookies.delete('verification_last_attempt')
      return response
    }
    
    // Check if user is already authenticated (email might already be verified)
    try {
      const { userId } = await auth()
      if (userId) {
        // User is authenticated, redirect to onboarding to break potential loop
        console.log('✅ User already authenticated, redirecting to onboarding')
        const response = NextResponse.redirect(new URL('/onboarding', req.url))
        response.cookies.delete('verification_attempts')
        response.cookies.delete('verification_last_attempt')
        return response
      }
    } catch (error) {
      // If auth check fails, continue with verification flow
      console.log('Auth check failed, continuing verification')
    }
    
    // Increment attempt counter
    const response = NextResponse.next()
    response.cookies.set('verification_attempts', String(attempts + 1), {
      maxAge: 60, // 60 seconds
      httpOnly: true,
      sameSite: 'lax'
    })
    response.cookies.set('verification_last_attempt', String(Date.now()), {
      maxAge: 60,
      httpOnly: true,
      sameSite: 'lax'
    })
    
    // Allow verification routes to be completely public
    return response
  }
  
  // Clear verification attempts cookie if not on verification page
  const response = NextResponse.next()
  if (!pathname.includes('verify-email')) {
    response.cookies.delete('verification_attempts')
  }
  
  // Allow public routes to be accessed without authentication
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
  
  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

