
## Fix: Require Authentication Before Showing Map

### Problem
After securing the `get-mapbox-token` endpoint to require authentication, unauthenticated users who click "Bin It" see a broken map because the token request fails with a 401 error.

### Solution Overview
Modify the app to check authentication status before showing the map. If the user isn't signed in, prompt them to sign in first.

---

## Implementation Steps

### Step 1: Update Index.tsx to Track Auth State
Add authentication state tracking to the Index page so we know if the user is signed in.

**Changes:**
- Import `useEffect` and `supabase` client
- Add `user` state to track current user
- Add `useEffect` to listen for auth state changes
- Modify "Bin It" button to check auth before showing map

### Step 2: Update "Bin It" Button Logic
When user clicks "Bin It":
- If authenticated → show map immediately
- If not authenticated → show AuthModal first, then show map after successful sign-in

**Changes to button onClick:**
```typescript
onClick={() => {
  if (user) {
    setShowMap(true);
  } else {
    setShowAuthModal(true);
  }
}}
```

### Step 3: Handle Auth Success
The AuthModal's `onSuccess` callback already calls `setShowMap(true)`, so this flow will work automatically.

### Step 4: Add Visual Indicator (Optional Enhancement)
Update the button text or add a subtitle to indicate sign-in is needed:
- Show "Sign in to Bin It" or a small note below the button for unauthenticated users

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add auth state tracking, update button logic |

---

## Technical Details

```typescript
// Add to Index.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Inside Index component:
const [user, setUser] = useState<User | null>(null);

useEffect(() => {
  // Check initial auth state
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
  });

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null);
    }
  );

  return () => subscription.unsubscribe();
}, []);

// Update button onClick:
onClick={() => {
  if (user) {
    setShowMap(true);
  } else {
    setShowAuthModal(true);
  }
}}
```

---

## User Experience After Fix

1. **New User**: Clicks "Bin It" → sees sign-in/sign-up modal → creates account → map loads
2. **Returning User (not signed in)**: Clicks "Bin It" → sees sign-in modal → signs in → map loads  
3. **Already Signed In**: Clicks "Bin It" → map loads immediately
4. **Signs out**: Would need to sign in again to use map

---

## Testing Checklist
- Verify clicking "Bin It" when not signed in shows AuthModal
- Verify signing in from the modal loads the map
- Verify already signed-in users go directly to map
- Verify map loads successfully with authentication
- Verify refreshing the page maintains auth state
