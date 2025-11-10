# Google OAuth Authentication - Testing Guide

## Quick Start

1. **Add Google Client Secret to `.env.local`**
   - Get it from Google Cloud Console
   - Replace `your_google_client_secret_here`

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Visit Login Page**
   ```
   http://localhost:3000/auth/login
   ```

## Testing Checklist

### ✅ Visual Tests
- [ ] Login page displays correctly
- [ ] Google button shows with logo
- [ ] Page is responsive on mobile
- [ ] Dark mode works (if enabled)

### ✅ Functional Tests
- [ ] Click "Continue with Google" opens OAuth popup
- [ ] Can select Google account
- [ ] Redirects back to app after login
- [ ] Dashboard is accessible after login
- [ ] Session persists on page refresh

### ✅ Protected Routes
- [ ] `/dashboard` requires authentication
- [ ] `/jobs/addjob` requires authentication  
- [ ] `/copilot` requires authentication
- [ ] Unauthenticated users redirect to `/auth/login`

### ✅ Sign Out
- [ ] Sign out button works (if added to UI)
- [ ] Session is cleared
- [ ] Redirect to home page
- [ ] Cannot access protected routes after sign out

## Troubleshooting

### Common Issues

**Issue: "Configuration error"**
- Check `GOOGLE_CLIENT_SECRET` is set in `.env.local`
- Restart dev server after changing `.env.local`

**Issue: "Redirect URI mismatch"**
- Add `http://localhost:3000/api/auth/callback/google` to Google Console
- Check Authorized redirect URIs in OAuth client settings

**Issue: "Access blocked"**
- App might not be verified by Google
- Add test users in Google Cloud Console
- Or publish the app

**Issue: Session not persisting**
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again
- Check browser console for errors

## API Endpoints

- **Session**: `GET /api/auth/session`
- **Sign In**: `POST /api/auth/signin/google`
- **Sign Out**: `POST /api/auth/signout`
- **Providers**: `GET /api/auth/providers`

## Test Using curl

```bash
# Check providers
curl http://localhost:3000/api/auth/providers

# Check session (should return empty if not logged in)
curl http://localhost:3000/api/auth/session
```

## Using the Auth in Components

### Client Component
```javascript
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Component() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  
  if (session) {
    return (
      <div>
        <p>Signed in as {session.user.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }
  
  return <button onClick={() => signIn("google")}>Sign in</button>;
}
```

### Server Component
```javascript
import { getCurrentUser } from "@/lib/auth";

export default async function ServerComponent() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Not authenticated</div>;
  }
  
  return <div>Hello {user.name}</div>;
}
```

## Need Help?

Check these files:
- Auth config: `app/api/auth/[...nextauth]/route.js`
- Login page: `app/auth/login/page.js`
- Middleware: `middleware.js`
- Auth utilities: `lib/auth.js`


