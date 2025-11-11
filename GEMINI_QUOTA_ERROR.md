# ⚠️ Gemini API Quota Error (429)

## Error Explanation

You're seeing this error:
```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0
```

## What This Means

Your Gemini API key has **exceeded its free tier quota** or the free tier is not enabled.

## Solutions

### Option 1: Wait for Quota Reset
- The error says: "Please retry in 8.117534663s"
- Wait a few minutes and try again
- Free tier quotas usually reset daily

### Option 2: Check Your API Key Status
1. Go to: https://aistudio.google.com/apikey
2. Check your API key status
3. Verify if free tier is enabled
4. Check your usage: https://ai.dev/usage?tab=rate-limit

### Option 3: Upgrade Your Plan
1. Go to: https://ai.google.dev/pricing
2. Upgrade to a paid plan if you need more quota
3. Update your API key if needed

### Option 4: Use a Different API Key
1. Create a new API key: https://aistudio.google.com/apikey
2. Update the key in `app/onboarding/page.js`:
   ```javascript
   const GEMINI_API_KEY = "YOUR_NEW_API_KEY"
   ```

### Option 5: Fill Form Manually
- The form still works without Gemini API
- Users can manually enter all company information
- Logo will still work if domain is provided (uses Clearbit, no API key needed)

## Current Behavior

The app now:
- ✅ Shows a user-friendly error message when quota is exceeded
- ✅ Allows users to fill the form manually
- ✅ Still fetches logos from domain (doesn't require Gemini)
- ✅ Works even if Gemini API fails

## Temporary Workaround

Until quota resets or you upgrade:
1. Users can enter company name manually
2. Users can enter domain to get logo
3. All other fields can be filled manually
4. Form submission works without Gemini API

---

**Note**: The Gemini API is only used for auto-filling company data. The form works perfectly fine without it!


