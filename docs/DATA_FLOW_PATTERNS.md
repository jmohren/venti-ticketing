# Data Flow Design Patterns

## Overview

This document defines the standardized data flow patterns for our React application architecture. These patterns ensure consistent, maintainable, and scalable data management across all projects.

## Core Data Flow

```
core/api (generic clients) → app/hooks (business logic + queries) → widgets (positioned by WidgetContainer in views)
```

Data flows from generic API clients (`restApiClient`, `storageApiClient`, etc.) through hooks that define business-specific queries and logic, directly to widgets. Views compose WidgetContainer components for positioning. State providers are optional for shared data scenarios.

### Key Principle: Generic API Clients Only
- ❌ **No business-specific API clients** like `ticketApiClient` or `userApiClient`
- ✅ **Use generic clients** like `restApiClient.get('tickets', {...})` 
- ✅ **Business logic lives in hooks** that define queries and transformations
- ✅ **Hooks are responsible** for mapping generic API responses to business types

**Available Generic Clients:**
```ts
import { restApiClient } from '@/core/api/rest/RestApiClient';
import { storageApiClient } from '@/core/api/storage/StorageApiClient';
import { authApiClient } from '@/core/api/auth/AuthApiClient';

// Examples of proper usage in hooks:
const tickets = await restApiClient.get('tickets', { status: 'eq.open' });
const file = await storageApiClient.upload('documents', fileData);
const user = await authApiClient.getCurrentUser();
```

## Pattern 1: Hook-Only (Simple)

**Use when**: Single view consumes the data

### Flow Diagram
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│  core/api   │───▶│  app/hooks   │───▶│ app/views   │───▶│   widgets   │
│             │    │              │    │             │    │             │
│ Generic     │    │ Business     │    │ Widget      │    │ Data + UI   │
│ clients     │    │ queries +    │    │ Container   │    │ logic +     │
│ (rest,      │    │ logic +      │    │ positioning │    │ presentation│
│ storage)    │    │ state        │    │             │    │             │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
```

### Implementation Example

```ts
// app/hooks/useTickets.ts
import { restApiClient } from '@/core/api/rest/RestApiClient';

export interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in-progress' | 'closed';
  created_at: string;
  updated_at: string;
}

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Use generic REST client with business-specific query
      const data = await restApiClient.get<Ticket>('tickets', {
        select: ['id', 'title', 'status', 'created_at'],
        order: ['created_at.desc']
      });
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTicket = await restApiClient.create<Ticket>('tickets', ticketData);
      setTickets(prev => [newTicket, ...prev]);
      return newTicket;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      throw error;
    }
  };

  return { tickets, loading, fetchTickets, createTicket };
};

// app/views/tickets/TicketPoolView.tsx
export const TicketPoolView = () => {
  return (
    <>
      <WidgetContainer
        title="Ticket Pool"
        gridPosition={{ columnStart: 1, columnSpan: 8, rowStart: 2, rowSpan: 6 }}
      >
        <TicketPoolWidget />
      </WidgetContainer>
    </>
  );
};

// app/views/tickets/widgets/TicketPoolWidget.tsx
export const TicketPoolWidget = () => {
  const { tickets, loading, fetchTickets } = useTickets();

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div>
      {loading ? <CircularProgress /> : <TicketList tickets={tickets} />}
    </div>
  );
};
```

### When to Use
- ✅ Data is only used by one view
- ✅ Simple CRUD operations
- ✅ No complex data relationships
- ✅ State doesn't need to persist across navigation

## Pattern 2: Hook + State (Shared)

**Use when**: Multiple views need the same data

### Flow Diagram
```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│  core/api   │───▶│  app/state   │───▶│  app/hooks   │───▶│ app/views   │───▶│   widgets   │
│             │    │              │    │              │    │             │    │             │
│ Generic     │    │ Global state │    │ Business     │    │ Widget      │    │ Data + UI   │
│ clients     │    │ providers    │    │ logic +      │    │ Container   │    │ logic +     │
│ (rest,      │    │ + business   │    │ context API  │    │ positioning │    │ presentation│
│ storage)    │    │ queries      │    │              │    │             │    │             │
└─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
```

### Implementation Example

```ts
// app/state/TicketProvider.tsx
import { restApiClient } from '@/core/api/rest/RestApiClient';

interface TicketContextValue {
  tickets: Ticket[];
  loading: boolean;
  fetchTickets: () => Promise<void>;
  createTicket: (data: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => Promise<Ticket>;
}

const TicketContext = createContext<TicketContextValue | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Use generic REST client with business-specific query
      const data = await restApiClient.get<Ticket>('tickets', {
        select: ['id', 'title', 'status', 'created_at'],
        order: ['created_at.desc']
      });
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTicket = await restApiClient.create<Ticket>('tickets', ticketData);
      setTickets(prev => [newTicket, ...prev]);
      return newTicket;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({ 
    tickets, 
    loading, 
    fetchTickets, 
    createTicket 
  }), [tickets, loading]);

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};

// app/hooks/useTickets.ts
export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within TicketProvider');
  }
  return context;
};

// Multiple views can now use the same data
// app/views/tickets/TicketPoolView.tsx
export const TicketPoolView = () => {
  return (
    <>
      <WidgetContainer
        title="Ticket Pool"
        gridPosition={{ columnStart: 1, columnSpan: 8, rowStart: 2, rowSpan: 6 }}
      >
        <TicketPoolWidget />
      </WidgetContainer>
    </>
  );
};

// app/views/tickets/widgets/TicketPoolWidget.tsx
export const TicketPoolWidget = () => {
  const { tickets, loading } = useTickets();
  return (
    <div>
      {loading ? <CircularProgress /> : <TicketList tickets={tickets} />}
    </div>
  );
};

// app/views/dashboard/DashboardView.tsx
export const DashboardView = () => {
  return (
    <>
      <WidgetContainer
        title="Open Tickets"
        gridPosition={{ columnStart: 1, columnSpan: 6, rowStart: 2, rowSpan: 4 }}
      >
        <TicketSummaryWidget />
      </WidgetContainer>
    </>
  );
};

// app/views/dashboard/widgets/TicketSummaryWidget.tsx
export const TicketSummaryWidget = () => {
  const { tickets } = useTickets(); // Same data, no refetch
  const openTickets = tickets.filter(t => t.status === 'open');
  return (
    <div>
      <Typography variant="h2">{openTickets.length}</Typography>
    </div>
  );
};
```

### When to Use
- ✅ Data is used by 2+ views
- ✅ State needs to persist across navigation
- ✅ Complex data relationships between domains
- ✅ Real-time updates need to sync across components

## View vs Widget Responsibilities

### Views: Pure Layout Containers
- **Purpose**: Route-level components that only handle layout
- **Responsibilities**: 
  - Compose WidgetContainer components for positioning
  - Define widget positioning and sizing via gridPosition props
  - Handle routing and navigation
- **Anti-patterns**:
  - ❌ No data fetching or business logic
  - ❌ No state management
  - ❌ No direct API calls

```ts
// ✅ Good: Pure composition with positioning
export const TicketPoolView = () => {
  return (
    <>
      <WidgetContainer
        title="Ticket Pool"
        gridPosition={{ columnStart: 1, columnSpan: 8, rowStart: 2, rowSpan: 6 }}
      >
        <TicketPoolWidget />
      </WidgetContainer>
      <WidgetContainer
        title="Technician Load"
        gridPosition={{ columnStart: 9, columnSpan: 4, rowStart: 2, rowSpan: 6 }}
      >
        <TechnicianLoadWidget />
      </WidgetContainer>
    </>
  );
};

// ❌ Bad: Business logic in view
export const TicketPoolView = () => {
  const { tickets, fetchTickets } = useTickets(); // Should be in widget
  // ...
};
```

### Widgets: Data + UI Logic
- **Purpose**: Self-contained UI components with their own data needs
- **Responsibilities**:
  - Fetch and manage their own data via hooks
  - Handle UI state and interactions
  - Render content and handle loading/error states
  - Focus purely on business logic and presentation
- **Benefits**:
  - ✅ Encapsulated data management
  - ✅ Reusable within view context
  - ✅ Independent testing
  - ✅ No positioning concerns (handled by WidgetContainer)

```ts
// ✅ Good: Widget manages its own data, no positioning
export const TicketPoolWidget = () => {
  const { tickets, loading, fetchTickets } = useTickets();
  
  useEffect(() => {
    fetchTickets();
  }, []);
  
  return (
    <div>
      {loading ? <CircularProgress /> : <TicketList tickets={tickets} />}
    </div>
  );
};
```

## Decision Matrix

| Scenario | Pattern | Reasoning |
|----------|---------|-----------|
| Single view uses tickets | Hook-Only | Simple, no overhead |
| Dashboard + TicketPool both show tickets | Hook + State | Avoid duplicate API calls |
| User settings used everywhere | Hook + State | Global configuration |
| Widget-specific filters | Hook-Only | Local to that widget |
| Real-time notifications | Hook + State | Need to update multiple views |

## State Provider Guidelines

### 1. Provider Scope
```ts
// ✅ Good: Domain-focused provider
export const TicketProvider = () => {
  // Only ticket-related state
};

// ❌ Bad: Kitchen sink provider
export const AppProvider = () => {
  // tickets, users, settings, notifications...
};
```

### 2. Provider Placement
```tsx
// main.tsx - Wrap entire app for global state
<AuthProvider>
  <UserProvider>
    <TicketProvider>  {/* Global ticket state */}
      <App />
    </TicketProvider>
  </UserProvider>
</AuthProvider>

// Or wrap specific sections for scoped state
<Route path="/tickets/*" element={
  <TicketProvider>  {/* Scoped to ticket section */}
    <TicketRoutes />
  </TicketProvider>
} />
```

### 3. Hook Composition
```ts
// ✅ Good: Hook adds business logic to provider data
export const useTicketFilters = () => {
  const { tickets } = useTickets(); // From provider
  const [filters, setFilters] = useState({}); // Local state
  
  const filteredTickets = useMemo(() => 
    tickets.filter(ticket => /* filter logic */), 
    [tickets, filters]
  );
  
  return { filteredTickets, filters, setFilters };
};
```

## Error Handling Patterns

### Hook-Level Error Handling
```ts
export const useTickets = () => {
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setError(null);
      // API call
    } catch (err) {
      setError(err.message);
    }
  };

  return { tickets, error, fetchTickets };
};
```

### Provider-Level Error Handling
```ts
export const TicketProvider = () => {
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Global error handling for all ticket operations
  const handleError = (error: Error) => {
    setGlobalError(error.message);
    // Could also integrate with global error reporting
  };
};
```

## Performance Considerations

### 1. Prevent Unnecessary Re-renders
```ts
// ✅ Good: Memoize context value
const value = useMemo(() => ({ 
  tickets, 
  loading, 
  fetchTickets 
}), [tickets, loading]);

return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
```

### 2. Selective Context Consumption
```ts
// ✅ Good: Only subscribe to needed data
const { tickets } = useTickets(); // Only re-render when tickets change

// ❌ Bad: Subscribe to everything
const ticketContext = useTickets(); // Re-render on any context change
```

### 3. Local State When Possible
```ts
// ✅ Good: Keep form state local
const [formData, setFormData] = useState({});

// ❌ Bad: Put form state in global provider
// (unless multiple components need access)
```

## Testing Patterns

### Testing Hook-Only Pattern
```ts
import { renderHook } from '@testing-library/react';
import { useTickets } from './useTickets';

test('should fetch tickets', async () => {
  const { result } = renderHook(() => useTickets());
  await act(() => result.current.fetchTickets());
  expect(result.current.tickets).toHaveLength(2);
});
```

### Testing Hook + State Pattern
```ts
const wrapper = ({ children }) => (
  <TicketProvider>{children}</TicketProvider>
);

test('should share state between hooks', () => {
  const { result } = renderHook(() => useTickets(), { wrapper });
  // Test shared state behavior
});
```

## Migration Guidelines

### From Hook-Only to Hook + State
1. Create provider with existing hook logic
2. Update hook to consume from provider
3. Wrap components with provider
4. Test that behavior remains the same

### From State back to Hook-Only
1. Move provider logic back to hook
2. Remove provider wrapper
3. Update hook consumers
4. Remove unused provider file

## Best Practices Summary

1. **Start simple**: Use Hook-Only pattern by default
2. **Upgrade when needed**: Add state providers only when sharing is required
3. **Keep providers focused**: One domain per provider
4. **Co-locate types**: Keep interfaces with their hooks
5. **Test both patterns**: Ensure consistent behavior across patterns
6. **Document decisions**: Record why you chose each pattern for future reference 