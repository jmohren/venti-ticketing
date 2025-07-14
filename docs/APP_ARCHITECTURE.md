# App Architecture Guide

## Overview

The `src/app/` folder contains all business-specific code for the application. This is the **feature module** that gets customized for each project, while `src/core/` remains the unchanged template shell.

## Folder Structure

```
src/app/
├─ hooks/                    # Business logic + API calls + types
│  ├─ useTickets.ts          # Ticket domain: types, API calls, state
│  ├─ useMachines.ts         # Machine domain: types, API calls, state
│  ├─ useConfig.ts           # Config domain: types, API calls, state
│  └─ useAppNavigation.ts    # App routing and navigation logic
│
├─ state/                    # Global app state providers (when sharing needed)
│  ├─ TicketProvider.tsx     # Shared ticket state across multiple views
│  ├─ MachineProvider.tsx    # Shared machine state across multiple views
│  └─ ConfigProvider.tsx     # Shared config state across multiple views
│
├─ views/                    # Top-level view components (one per route)
│  ├─ tickets/
│  │   ├─ TicketPoolView.tsx
│  │   ├─ AddTicketView.tsx
│  │   └─ widgets/           # View-specific widgets (not reusable)
│  │       ├─ TicketPoolWidget.tsx
│  │       ├─ TechnicianLoadWidget.tsx
│  │       └─ AddTicketWidget.tsx
│  ├─ machines/
│  │   ├─ InstandhaltungView.tsx
│  │   └─ widgets/
│  │       └─ InstandhaltungWidget.tsx
│  └─ config/
│      ├─ KonfigurationView.tsx
│      └─ widgets/
│          ├─ MachineCalendarWidget.tsx
│          ├─ MachinesRoomsWidget.tsx
│          └─ PlaceholderWidget.tsx
│
├─ dialogs/                  # App-specific dialog components
│  ├─ TicketDialog.tsx
│  ├─ MachineDialog.tsx
│  └─ ConfirmDeleteDialog.tsx
│
└─ AppMain.tsx               # Main app orchestrator and routing
```

## Design Principles

### 1. Domain-Driven Organization
- Each business domain (tickets, machines, config) has its own hook
- Related functionality stays together
- Clear ownership and responsibility

### 2. Co-location of Related Code
- Types live with hooks that use them
- Widgets live with views that use them
- No hunting across multiple folders for related code

### 3. Enforced Patterns
- **Hooks**: All business logic and API integration
- **State**: Only when sharing data across multiple views
- **Views**: Pure composition, no business logic
- **Widgets**: View-specific building blocks
- **Dialogs**: Dedicated UX pattern enforcement

### 4. Performance Optimization
- **Lazy Loading**: Views are loaded on-demand using React.lazy()
- **Provider Composition**: Centralized state management with clear provider hierarchy
- **Code Splitting**: Automatic bundle splitting for each view

### 5. Import Patterns
```ts
// Direct imports using absolute paths
import { useTickets, Ticket } from '@/app/hooks/useTickets'
import { TicketPoolWidget } from '@/app/views/tickets/widgets/TicketPoolWidget'
import { TicketDialog } from '@/app/dialogs/TicketDialog'
```

## File Responsibilities

### AppMain.tsx
**Purpose**: Main application orchestrator
- Implements lazy loading for all views using React.lazy()
- Defines provider composition for shared state
- Handles view routing and navigation
- Provides loading fallbacks for lazy-loaded views

**Implementation Pattern**:
```ts
// Lazy load views for better performance
const AddTicketView = React.lazy(() => import('@/app/views/add-ticket/AddTicketView'));
const TicketPoolView = React.lazy(() => import('@/app/views/ticket-pool/TicketPoolView'));

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
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">Loading view...</Typography>
  </Box>
);

// Main component with Suspense wrapper
<AppProviders>
  <GridLayout>
    <Suspense fallback={<ViewLoading />}>
      {ViewComponent && <ViewComponent />}
    </Suspense>
  </GridLayout>
</AppProviders>
```

### Hooks (`/hooks/`)
**Purpose**: Central business logic layer
- Define TypeScript interfaces and types
- Handle API calls using generic `core/api` clients (rest, storage, etc.)
- Define business queries and data transformations
- Manage local component state
- Provide business logic functions
- Export both types and hooks

**Example**:
```ts
// useTickets.ts
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
```

### State (`/state/`)
**Purpose**: Shared state management
- Only create when data needs to be shared across multiple views
- Wrap app sections that need shared state
- Keep providers focused on single domains
- Implement Hook + State pattern for shared data

**When to use**: 
- ✅ Data used by 2+ views or widgets
- ✅ Complex data relationships
- ✅ State needs to persist across navigation
- ❌ Single widget usage (use hooks instead)

**Provider Pattern**:
```ts
// TicketProvider.tsx
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

  const value = useMemo(() => ({ 
    tickets, 
    loading, 
    fetchTickets, 
    createTicket 
  }), [tickets, loading]);

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};
```

### Views (`/views/`)
**Purpose**: Route-level components
- Pure composition using WidgetContainer components for positioning
- No business logic or state management
- Handle widget positioning via WidgetContainer gridPosition props
- Own their specific widgets
- Lazy-loaded for optimal performance

**Example**:
```ts
// TicketPoolView.tsx - Default export for lazy loading
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

export default TicketPoolView; // Default export required for React.lazy()
```

### Widgets (`/views/*/widgets/`)
**Purpose**: View-specific UI building blocks
- Handle their own data needs via hooks
- Contain UI logic and presentation
- Use hooks for business logic and API calls
- Not intended for reuse across views
- Live close to their consuming view
- Wrapped by WidgetContainer in views for positioning

**Example**:
```ts
// ✅ Good: Widget manages its own data
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

### Dialogs (`/dialogs/`)
**Purpose**: Modal and overlay components
- Reusable across multiple views
- Handle user interactions and confirmations
- Follow consistent UX patterns
- Separate from core UI components

## Performance Architecture

### Lazy Loading Implementation
All views are lazy-loaded using React.lazy() to optimize initial bundle size and improve loading performance:

```ts
// Lazy load views for better performance
const AddTicketView = React.lazy(() => import('@/app/views/add-ticket/AddTicketView'));
const TicketPoolView = React.lazy(() => import('@/app/views/ticket-pool/TicketPoolView'));
const InstandhaltungView = React.lazy(() => import('@/app/views/instandhaltung/InstandhaltungView'));

// Views must export default for lazy loading
export default TicketPoolView;
```

### Provider Composition
Centralized provider composition for clean state management:

```ts
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
```

### Loading States
Consistent loading experience across all lazy-loaded views:

```ts
const ViewLoading = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">Loading view...</Typography>
  </Box>
);

// Usage with Suspense
<Suspense fallback={<ViewLoading />}>
  {ViewComponent && <ViewComponent />}
</Suspense>
```

## Architecture Summary

### Key Principles
1. **Views = Layout Only**: Views compose WidgetContainer components for positioning
2. **WidgetContainer = Positioning**: Handles grid positioning and visual container styling
3. **Widgets = Data + UI**: Widgets manage their own data needs via hooks
4. **Hooks = Business Logic**: All API calls and business logic live in hooks using generic API clients
5. **Generic API Clients Only**: No business-specific API clients (use `restApiClient`, `storageApiClient`, etc.)
6. **State = Sharing**: Only create state providers when multiple views need the same data
7. **Lazy Loading = Performance**: All views are lazy-loaded for optimal bundle splitting
8. **Provider Composition = Organization**: Centralized state management with clear hierarchy

### Data Flow
```
Generic API Clients → State Providers → Hooks (Business Queries) → Widgets (positioned by WidgetContainer in Views)
```

### Performance Flow
```
Initial Load → Lazy Load Views → Provider State → Widget Rendering
```

### File Organization
- **Co-location**: Related code stays together (types with hooks, widgets with views)
- **Domain separation**: Each business domain has its own hook and folder structure
- **Clear ownership**: Every file has a single, clear responsibility
- **Lazy loading**: Views are loaded on-demand for better performance
- **Provider composition**: Centralized state management with clear organization

### Import Strategy
- Use `@/` absolute paths for all imports
- No barrel files (index.ts) - import directly from source files
- Named exports throughout the codebase
- Default exports only for lazy-loaded views
- Provider composition in AppMain.tsx with clear documentation