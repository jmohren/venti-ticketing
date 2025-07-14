# Import Guidelines

## Path Aliases

This project uses absolute imports with path aliases to avoid relative path complexity.

### Available Aliases

- `@/*` - Points to `src/*` (recommended for new code)
- `core/*` - Points to `src/core/*` (legacy, being phased out)

### Import Style

**✅ Preferred (use for all new code):**
```ts
import { Button } from '@/core/ui/Button'
import { useAuth } from '@/core/hooks/useAuth'
import { AuthProvider } from '@/core/state/AuthProvider'
import { AddTicketView } from '@/app/views/add-ticket/AddTicketView'
```

**⚠️ Legacy (existing code, migrate when touching files):**
```ts
import { Button } from 'core/ui'
import { useAuth } from 'core/hooks'
```

**❌ Avoid (relative paths):**
```ts
import { Button } from '../../../core/ui/Button'
import { useAuth } from '../../../../core/hooks/useAuth'
```

### Import Order

Group imports in this order:

```ts
// 1. External libraries
import React from 'react'
import { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'

// 2. Internal imports (sorted by path depth)
import { Button } from '@/core/ui/Button'
import { useAuth } from '@/core/hooks/useAuth'
import { ApiService } from '@/core/api/ApiService'
import { AddTicketWidget } from '@/app/views/add-ticket/widgets/AddTicketWidget'

// 3. Relative imports (same directory only)
import { helper } from './utils'
import './styles.css'
```

### File Naming

- **Components**: PascalCase (`AddTicketDialog.tsx`, `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`, `useTickets.ts`)
- **Utils/Services**: camelCase (`apiClient.ts`, `dateUtils.ts`)
- **Pages/Views**: PascalCase with suffix (`LoginPage.tsx`, `TicketPoolView.tsx`)

### Migration Strategy

When editing existing files:
1. Keep existing imports working
2. Add new imports using `@/` style
3. Gradually migrate old imports when convenient
4. Remove barrel files (`index.ts`) when all imports are migrated

### Benefits

- **No relative path counting**: Same import regardless of file location
- **Easy refactoring**: Moving files doesn't break imports  
- **Better IDE support**: Autocomplete and navigation work better
- **Consistent**: All team members use the same import style 