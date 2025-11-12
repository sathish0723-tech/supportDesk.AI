# Email Verification Loop Fix

## Problem
The `/auth/verify-email-address` route was looping, causing repeated verification attempts.

## Root Cause
The loop was happening because:
1. User clicks email verification link
2. Clerk redirects to `/auth/verify-email-address`
3. After verification, Clerk tries to redirect to `/onboarding`
4. But if the session isn't fully established yet, it redirects back to verification
5. This creates an infinite loop

## Solutions Applied

### 1. Middleware Update
- Added `/api/companies/check-domain(.*)` to public routes so domain checking works without auth
- Ensured all `/auth(.*)` routes are public (including verification)

### 2. Auth Component Updates
- Removed invalid `forceRedirectUrl` props
- Kept proper `afterSignUpUrl` and `afterSignInUrl` configuration

### 3. Onboarding Page Updates
- Increased redirect timeout from 500ms to 2000ms to allow email verification to complete
- This gives Clerk time to establish the session before redirecting

## Testing

To test if the loop is fixed:

1. **Sign up with a new email**
2. **Check your email and click the verification link**
3. **You should be redirected to `/onboarding` without looping**

If the loop still occurs:

1. **Check Clerk Dashboard Settings**:
   - Go to Clerk Dashboard → **Paths**
   - Ensure:
     - After sign-up: `/onboarding`
     - After sign-in: `/dashboard`
   
2. **Clear browser cache and cookies**

3. **Check browser console** for any errors

4. **Check server logs** for redirect patterns

## Domain Check API

The domain check API is now accessible at:
- `GET /api/companies/check-domain?email=user@example.com`
- `POST /api/companies/check-domain` with `{"email": "user@example.com"}`

This endpoint is public and doesn't require authentication.

