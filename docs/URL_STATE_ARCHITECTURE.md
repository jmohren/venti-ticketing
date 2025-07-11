# URL State Architecture

## Overview
This project uses a hybrid approach for URL state management that combines React hooks with direct browser API manipulation to avoid circular dependencies and race conditions.

## The Pattern

### Problem
React's URL state hooks can create circular dependencies when trying to synchronize URL parameters with component state:
```
User Action → State Update → URL Update → State Update → URL Update (infinite loop)
```

### Solution: Hybrid Approach
1. **Direct Browser API for Updates**: Use native `window.history.replaceState()` for immediate URL changes
2. **React Hooks for Reading**: Use `useUrlState` hook to read and respond to URL changes
3. **Unidirectional Flow**: URL as single source of truth (URL → State, never State → URL)

## Implementation

### For URL Updates (Write):
```typescript
// Direct browser API manipulation
const url = new URL(window.location.href);
url.searchParams.set('pdca', entryId.toString());
window.history.replaceState({}, '', url.toString());
```

### For URL Reading (Read):
```typescript
// React hook for reading URL state
const { urlState } = useUrlState();
useEffect(() => {
  if (urlState.pdca) {
    // Update component state based on URL
  }
}, [urlState]);
```

### Dialog State Management
URL parameters should control dialog visibility, not internal React state:

```typescript
// Open dialog when URL parameter is missing
if (!urlState.workline && state.workLines.length > 0 && !state.dialogs.worklineSelection.open) {
  actions.setWorklineDialogState({ open: true });
}
// Close dialog when URL parameter exists (handles initialization edge cases)
else if (urlState.workline && state.dialogs.worklineSelection.open) {
  actions.setWorklineDialogState({ open: false });
}
```

## Authentication Session Persistence

### Silent Authentication Workflow
The application now uses a "validate-first" approach instead of "refresh-first" for session initialization:

```typescript
// New session initialization flow
Page Refresh → Silent Auth Check → Access Token Valid? → Proceed
                                 → Access Token Expired? → Try Refresh → Success/Login
                                 → No Tokens? → Login
```

### Implementation
```typescript
// Silent authentication check
async silentAuthCheck(): Promise<boolean> {
  // Quick check: if no auth cookies exist, skip API call
  if (!this.hasAuthCookies()) return false;
  
  // Test access token with lightweight API call
  const response = await fetch('/auth/verify', {
    method: 'GET',
    credentials: 'include'
  });
  
  if (response.ok) {
    // Access token valid - no refresh needed
    return true;
  }
  
  if (response.status === 401) {
    // Access token expired - try refresh
    return await this.refreshToken();
  }
  
  return false;
}
```

### Benefits of Silent Authentication
- ✅ **No unnecessary logins**: Users stay logged in across page refreshes
- ✅ **Faster app startup**: Lightweight auth check vs. full token refresh  
- ✅ **Reduced server load**: Only refresh when actually needed
- ✅ **Graceful fallback**: Falls back to refresh if `/auth/verify` doesn't exist

## Benefits
- ✅ No circular dependencies
- ✅ Immediate URL updates
- ✅ Works with browser back/forward
- ✅ Supports deep linking
- ✅ Simple and predictable
- ✅ URL parameters preserved across view changes
- ✅ Dialog state driven by URL, not initialization order
- ✅ Session persistence across page refreshes

## When to Use
Use this pattern when:
- URL parameters need to update immediately on user actions
- Complex state synchronization is causing race conditions
- Deep linking and URL sharing are requirements
- React state management becomes overly complex
- Dialog visibility should be determined by URL state
- Session persistence across page refreshes is required

## Key Insights
- **URL as Authority**: Let URL parameters determine UI state, not the other way around
- **Handle Edge Cases**: Actively close dialogs that shouldn't be open based on URL state
- **Preserve Parameters**: Maintain URL parameters when navigating between views
- **Avoid Blocking**: Don't use `alert()` or other blocking operations during URL updates
- **Validate Before Refresh**: Check access token validity before attempting refresh
- **Graceful Degradation**: Provide fallbacks for missing backend endpoints

## Debugging
Use the global debug function in browser console:
```javascript
// Check authentication state
debugAuth()
```

## Files
- `src/hooks/useUrlState.ts` - React hook for reading URL state
- `src/app/AppMain.tsx` - URL effect for state synchronization
- `src/app/views/daily-routine/widgets/PDCATableWidget.tsx` - Example implementation
- `src/auth/useAuthenticatedApi.ts` - Silent authentication implementation 