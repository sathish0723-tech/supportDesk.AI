# Vercel Environment Variables Setup

## Required Environment Variables

To fix the build error, you need to set the following environment variables in your Vercel project:

### 1. Clerk Authentication Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/last-active?path=api-keys)
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 2. Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... (your publishable key)
CLERK_SECRET_KEY=sk_test_... (your secret key)
```

**Important:** 
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must be prefixed with `NEXT_PUBLIC_` to be available during build time
- Make sure to set these for **Production**, **Preview**, and **Development** environments
- After adding the variables, **redeploy** your application

### 3. Gemini API Key (Optional - for auto-filling company data)

If you want to use Gemini AI to auto-fill company information:

1. Get your Gemini API key from: https://aistudio.google.com/apikey
2. Add to Vercel environment variables:

```
GEMINI_API_KEY=AIzaSy... (your Gemini API key)
```

**Note:** The app works without this key - users can manually fill the form.

### 4. Other Required Variables

You may also need to set:

```
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=support_desk
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
CLERK_WEBHOOK_SECRET=whsec_... (if using webhooks)
```

### 5. Redeploy

After setting the environment variables:
1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**

Or trigger a new deployment by pushing to your repository.

## Troubleshooting

If you still see the error after setting the variables:
1. Make sure the variable name is exactly `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (case-sensitive)
2. Verify the key starts with `pk_test_` or `pk_live_`
3. Check that the variable is enabled for the environment you're deploying to
4. Try redeploying after adding the variables

