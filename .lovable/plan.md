
## Make Sign-Up Optional: Allow Unauthenticated Map Access

### Problem
After securing the Mapbox token endpoint to require authentication, users are forced to sign up/sign in before they can use the map. You want sign-up to be **optional** - users should be able to use the map immediately without creating an account.

### Challenge
We need to balance two goals:
1. **User experience**: Let anyone use the map without signing up
2. **Security**: Protect the Mapbox token from abuse (API quota exhaustion)

### Solution: IP-Based Rate Limiting for Public Access
Allow public access to the Mapbox token endpoint, but protect it with IP-based rate limiting. This prevents abuse while allowing guest users to use the map.

---

## Implementation Steps

### Step 1: Update Edge Function to Allow Unauthenticated Access
Modify `get-mapbox-token` to work for both authenticated and unauthenticated users:
- If authenticated → rate limit by user ID
- If not authenticated → rate limit by IP address
- Apply stricter limits for unauthenticated requests

### Step 2: Update Index.tsx Button Logic
Remove the authentication check from the "Bin It" button so it always shows the map:
```typescript
onClick={() => setShowMap(true)}
```

### Step 3: Keep Sign-In Option Available
The sign-in button in the header remains for users who want to track their stats and streaks.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/get-mapbox-token/index.ts` | Allow unauthenticated access with IP-based rate limiting |
| `src/pages/Index.tsx` | Remove auth check from "Bin It" button |

---

## Technical Details

### Edge Function Changes
```typescript
// Get user if authenticated (optional)
let userId: string | null = null;
const authHeader = req.headers.get('Authorization');

if (authHeader) {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  userId = user?.id ?? null;
}

// Rate limit by user ID if authenticated, otherwise by IP
const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
  || req.headers.get('cf-connecting-ip') 
  || 'unknown';

const rateLimitKey = userId || `ip:${clientIP}`;
const maxRequests = userId ? 30 : 15; // Authenticated users get more requests
```

### Index.tsx Changes
```typescript
// Before (current - forces auth)
onClick={() => {
  if (user) {
    setShowMap(true);
  } else {
    setShowAuthModal(true);
  }
}}

// After (allows guest access)
onClick={() => setShowMap(true)}
```

---

## User Experience After Fix

| Scenario | Experience |
|----------|------------|
| **Guest user** | Clicks "Bin It" → Map loads immediately → Can find bins and navigate |
| **Guest user (wants to track)** | Clicks "Sign in" → Creates account → Stats are tracked |
| **Returning user** | Clicks "Bin It" → Map loads → If signed in, stats are tracked |

---

## Security Measures Retained
- Rate limiting still protects against API abuse (stricter for unauthenticated users)
- Mapbox token is still server-side only (never exposed to frontend)
- Input validation and error handling remain in place
