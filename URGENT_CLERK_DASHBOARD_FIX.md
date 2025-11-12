# 🚨 URGENT: Fix Email Verification Loop - Clerk Dashboard Configuration

## The Problem
The email verification loop is happening because **Clerk Dashboard redirect URLs don't match your code**.

## ⚠️ CRITICAL: You MUST Fix This in Clerk Dashboard

The code changes alone won't fix this. You **MUST** update Clerk Dashboard settings.

### Step-by-Step Fix:

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Select your application**
3. **Navigate to**: **Paths** section
   - Look for: **User & Authentication** → **Paths**
   - OR: **Settings** → **Paths**

4. **Set these EXACT values**:
   ```
   After sign-up: /onboarding
   After sign-in: /dashboard
   Fallback redirect URL: /onboarding
   ```

5. **Also check**:
   - **User & Authentication** → **Email, Phone, Username**
   - Make sure **Email** is enabled
   - Check **Email verification** settings
   - Set verification to **Optional** (not Required) if the loop persists

6. **Save all changes**

7. **Wait 1-2 minutes** for changes to propagate

8. **Clear browser cache and cookies** (IMPORTANT!)

9. **Test again**

## Why This Happens

Clerk's email verification flow:
1. User clicks verification link
2. Clerk verifies email
3. Clerk checks Dashboard for redirect URL
4. If Dashboard says `/onboarding` but code says something else → **LOOP**
5. If Dashboard redirect URL is wrong → **LOOP**

## Code vs Dashboard Must Match

Your code has:
- `afterSignUpUrl="/onboarding"`
- `afterSignInUrl="/dashboard"`

**Clerk Dashboard MUST have the same values!**

## If Loop Still Happens After Dashboard Fix

1. **Check browser console** (F12) for errors
2. **Check Network tab** - see what redirects are happening
3. **Try incognito/private mode** - rules out cache issues
4. **Try different browser** - rules out browser-specific issues
5. **Check Clerk Dashboard logs** - see what Clerk is doing

## Alternative: Disable Email Verification Requirement

If you need a quick workaround:

1. Clerk Dashboard → **User & Authentication** → **Email, Phone, Username**
2. Set **Email verification** to **Optional** (not Required)
3. Users can sign up without verifying email immediately
4. They can verify later from their account settings

This will stop the loop, but users won't be forced to verify before accessing the app.

## Expected Behavior After Fix

✅ User clicks verification link
✅ Clerk verifies email (one time)
✅ Clerk redirects to `/onboarding` (one time)
✅ User sees onboarding page
✅ **NO MORE LOOPS!**

## Still Not Working?

If after:
- ✅ Updating Clerk Dashboard
- ✅ Clearing browser cache
- ✅ Restarting server
- ✅ Matching all redirect URLs

The loop still happens, then:
- Contact Clerk support
- Check if there are multiple Clerk applications (might be using wrong one)
- Verify environment variables are correct

