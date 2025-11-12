"use client"

/**
 * Client-side handler to prevent email verification loops
 * This script runs on the verification page to detect and break loops
 */

if (typeof window !== 'undefined') {
  let redirectCount = 0
  const MAX_REDIRECTS = 3
  const REDIRECT_KEY = 'clerk_verify_redirect_count'
  const LAST_REDIRECT_KEY = 'clerk_verify_last_redirect'

  // Check if we're in a redirect loop
  const checkLoop = () => {
    const currentPath = window.location.pathname
    
    if (currentPath.includes('verify-email-address')) {
      const count = parseInt(sessionStorage.getItem(REDIRECT_KEY) || '0', 10)
      const lastRedirect = parseInt(sessionStorage.getItem(LAST_REDIRECT_KEY) || '0', 10)
      const timeSinceLastRedirect = Date.now() - lastRedirect
      
      // If too many redirects in short time, break the loop
      if (count >= MAX_REDIRECTS && timeSinceLastRedirect < 5000) {
        console.warn('⚠️ Email verification loop detected! Redirecting to /onboarding')
        sessionStorage.removeItem(REDIRECT_KEY)
        sessionStorage.removeItem(LAST_REDIRECT_KEY)
        window.location.href = '/onboarding'
        return
      }
      
      // Increment redirect count
      sessionStorage.setItem(REDIRECT_KEY, String(count + 1))
      sessionStorage.setItem(LAST_REDIRECT_KEY, String(Date.now()))
    } else {
      // Clear redirect count when not on verification page
      sessionStorage.removeItem(REDIRECT_KEY)
      sessionStorage.removeItem(LAST_REDIRECT_KEY)
    }
  }

  // Run check on page load
  checkLoop()
  
  // Also check after a short delay (in case Clerk redirects)
  setTimeout(checkLoop, 2000)
  
  // Listen for navigation events
  window.addEventListener('beforeunload', () => {
    const currentPath = window.location.pathname
    if (currentPath.includes('verify-email-address')) {
      const count = parseInt(sessionStorage.getItem(REDIRECT_KEY) || '0', 10)
      sessionStorage.setItem(REDIRECT_KEY, String(count + 1))
    }
  })
}

