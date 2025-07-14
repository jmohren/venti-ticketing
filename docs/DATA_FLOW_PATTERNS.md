# Data Flow Design Patterns

## Overview

This document defines the standardized data flow patterns for our React application architecture. These patterns ensure consistent, maintainable, and scalable data management across all projects.

## Core Data Flow

```
core/api (generic clients) → app/state (providers) → app/hooks (business logic + queries) → widgets (positioned by WidgetContainer in views)
```

Data flows from generic API clients (`restApiClient`, `storageApiClient`, etc.) through state providers when sharing is needed, then through hooks that define business-specific queries and logic, directly to widgets. Views compose WidgetContainer components for positioning. All views are lazy-loaded for optimal performance.

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

// app/views/tickets/TicketPoolView.tsx - Default export for lazy loading
const TicketPoolView = () => {
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

export default TicketPoolView; // Required for React.lazy()

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
const TicketPoolView = () => {
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

export default TicketPoolView; // Required for React.lazy()

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
const DashboardView = () => {
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

export default DashboardView; // Required for React.lazy()

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

## Pattern 3: Lazy Loading + Provider Composition

**Use when**: Building scalable applications with optimal performance

### Flow Diagram
```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│ App Boot    │───▶│ Provider     │───▶│ Lazy Load    │───▶│ Suspense    │───▶│ View        │
│             │    │ Composition  │    │ Views        │    │ Boundary    │    │ Rendering   │
│ Initial     │    │              │    │              │    │             │    │             │
│ bundle      │    │ Nested state │    │ Code split   │    │ Loading     │    │ Hydrated    │
│ (minimal)   │    │ providers    │    │ bundles      │    │ fallback    │    │ components  │
└─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
```

### Implementation Example

```ts
// app/AppMain.tsx
import React, { Suspense } from 'react';
import { TicketProvider } from '@/app/state/TicketProvider';
import { MachineProvider } from '@/app/state/MachineProvider';
import { TechnicianProvider } from '@/app/state/TechnicianProvider';

// Lazy load views for better performance
const AddTicketView = React.lazy(() => import('@/app/views/add-ticket/AddTicketView'));
const TicketPoolView = React.lazy(() => import('@/app/views/ticket-pool/TicketPoolView'));
const InstandhaltungView = React.lazy(() => import('@/app/views/instandhaltung/InstandhaltungView'));

// Provider composition - add new providers here
const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <TicketProvider>
    <MachineProvider>
      <TechnicianProvider>
        {children}
      </TechnicianProvider>
    </MachineProvider>
  </TicketProvider>
);

// Loading fallback component
const ViewLoading = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '200px',
      gap: 2
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      Loading view...
    </Typography>
  </Box>
);

const AppMain: React.FC = () => {
  // ... navigation logic ...

  return (
    <AppProviders>
      <GridLayout 
        title={`App Management - ${currentView.replace('-', ' ')}`}
        availableViews={availableViews}
        currentView={currentView}
        onViewChange={handleViewChange}
        useStyledToggle={true}
      >
        {/* Lazy loaded view rendering with Suspense */}
        <Suspense fallback={<ViewLoading />}>
          {ViewComponent && <ViewComponent />}
        </Suspense>
      </GridLayout>
    </AppProviders>
  );
};

export default AppMain;
```

### When to Use
- ✅ Multiple state providers needed
- ✅ Large application with many views
- ✅ Performance optimization is critical
- ✅ Code splitting requirements
- ✅ Scalable architecture needed

## Performance Optimization Patterns

### 1. Lazy Loading Implementation
```ts
// ✅ Correct lazy loading pattern
const ViewComponent = React.lazy(() => import('./ViewComponent'));

// View must have default export
const ViewComponent = () => {
  return <div>View content</div>;
};
export default ViewComponent;

// Usage with Suspense
<Suspense fallback={<LoadingComponent />}>
  <ViewComponent />
</Suspense>
```

### 2. Provider Composition Pattern
```ts
// ✅ Organized provider composition
const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>      {/* Authentication state */}
    <TicketProvider>  {/* Business domain 1 */}
      <MachineProvider> {/* Business domain 2 */}
        {children}
      </MachineProvider>
    </TicketProvider>
  </AuthProvider>
);

// ❌ Inline provider nesting (hard to maintain)
<AuthProvider>
  <TicketProvider>
    <MachineProvider>
      <App />
    </MachineProvider>
  </TicketProvider>
</AuthProvider>
```

### 3. Loading State Management
```ts
// ✅ Consistent loading component
const ViewLoading = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">Loading view...</Typography>
  </Box>
);

// ✅ Proper error boundary (recommended)
const ViewErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong while loading the view.</div>}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## View vs Widget Responsibilities

### Views: Pure Layout Containers
- **Purpose**: Route-level components that only handle layout
- **Responsibilities**: 
  - Compose WidgetContainer components for positioning
  - Define widget positioning and sizing via gridPosition props
  - Handle routing and navigation
  - Export default for lazy loading
- **Anti-patterns**:
  - ❌ No data fetching or business logic
  - ❌ No state management
  - ❌ No direct API calls

```ts
// ✅ Good: Pure composition with positioning and default export
const TicketPoolView = () => {
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

export default TicketPoolView; // Required for React.lazy()

// ❌ Bad: Business logic in view
const TicketPoolView = () => {
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
| Large application with many views | Lazy Loading + Provider | Performance optimization |

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

### 2. Provider Composition
```ts
// ✅ Good: Organized composition with documentation
const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>      {/* Global authentication */}
    <TicketProvider>  {/* Business domain: tickets */}
      <MachineProvider> {/* Business domain: machines */}
        <TechnicianProvider> {/* Business domain: technicians */}
          {children}
        </TechnicianProvider>
      </MachineProvider>
    </TicketProvider>
  </AuthProvider>
);
```

### 3. Provider Placement
```tsx
// AppMain.tsx - Use provider composition
const AppMain = () => {
  return (
    <AppProviders>
      <GridLayout>
        <Suspense fallback={<ViewLoading />}>
          {ViewComponent && <ViewComponent />}
        </Suspense>
      </GridLayout>
    </AppProviders>
  );
};
```

### 4. Hook Composition
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

## Performance Considerations

### 1. Lazy Loading Benefits
- **Code Splitting**: Each view becomes a separate bundle
- **Faster Initial Load**: Only load what's needed immediately
- **Better Caching**: Views can be cached independently
- **Reduced Memory Usage**: Views are loaded on-demand

### 2. Provider Optimization
```ts
// ✅ Good: Memoize context value
const value = useMemo(() => ({ 
  tickets, 
  loading, 
  fetchTickets 
}), [tickets, loading]);

return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
```

### 3. Selective Context Consumption
```ts
// ✅ Good: Only subscribe to needed data
const { tickets } = useTickets(); // Only re-render when tickets change

// ❌ Bad: Subscribe to everything
const ticketContext = useTickets(); // Re-render on any context change
```

### 4. Loading State Optimization
```ts
// ✅ Good: Consistent loading experience
const ViewLoading = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">Loading view...</Typography>
  </Box>
);
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

### Testing Lazy Loading
```ts
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';

const LazyComponent = React.lazy(() => import('./LazyComponent'));

test('should show loading state', () => {
  render(
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
  expect(screen.getByText('Loading...')).toBeInTheDocument();
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

### Adding Lazy Loading
1. Convert view to default export
2. Add React.lazy() import in AppMain
3. Wrap with Suspense boundary
4. Test loading states

## Best Practices Summary

1. **Start simple**: Use Hook-Only pattern by default
2. **Upgrade when needed**: Add state providers only when sharing is required
3. **Optimize performance**: Use lazy loading for all views
4. **Keep providers focused**: One domain per provider
5. **Compose providers**: Use AppProviders pattern for organization
6. **Co-locate types**: Keep interfaces with their hooks
7. **Test all patterns**: Ensure consistent behavior across patterns
8. **Document decisions**: Record why you chose each pattern for future reference
9. **Default exports**: Required for lazy loading
10. **Loading states**: Provide consistent loading experience 