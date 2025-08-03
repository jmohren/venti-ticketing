import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { GridLayout } from '@/core/components/GridLayout';
import { useUrlAwareNavigation } from '@/core/hooks/useUrlState';
import { TicketProvider } from '@/app/state/TicketProvider';
import { MachineProvider } from '@/app/state/MachineProvider';
import { TechnicianProvider } from '@/app/state/TechnicianProvider';
import { Box, CircularProgress, Typography } from '@mui/material';

// Lazy load views for better performance
const AddTicketView = React.lazy(() => import('@/app/views/add-ticket/AddTicketView'));
const MaschinenView = React.lazy(() => import('@/app/views/maschinen/MaschinenView'));
const TicketPoolView = React.lazy(() => import('@/app/views/ticket-pool/TicketPoolView'));
const InstandhaltungView = React.lazy(() => import('@/app/views/instandhaltung/InstandhaltungView'));
const LohnscheineView = React.lazy(() => import('@/app/views/lohnscheine/LohnscheineView'));
const WissensdatenbankView = React.lazy(() => import('@/app/views/wissensdatenbank/WissensdatenbankView'));
const CalendarView = React.lazy(() => import('@/app/views/calendar/CalendarView'));

// Single source of truth for all views
const BASE_VIEWS = [
  { value: 'add-ticket', label: 'Ticket anlegen', component: AddTicketView },
  { value: 'maschinen', label: 'Maschinen', component: MaschinenView },
  { value: 'ticket-pool', label: 'Ticket Pool', component: TicketPoolView },
  { value: 'lohnscheine', label: 'Lohnscheine', component: LohnscheineView },
  { value: 'instandhaltung', label: 'Instandhaltung', component: InstandhaltungView },
  { value: 'wissensdatenbank', label: 'Wissensdatenbank', component: WissensdatenbankView },
  { value: 'calendar', label: 'Kalender', component: CalendarView },
  // { value: 'konfiguration', label: 'Konfiguration', component: KonfigurationView }, // TODO: Re-enable when we have a proper KonfigurationView
] as const;

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
  const location = useLocation();
  const { navigateWithParams } = useUrlAwareNavigation();
  
  // Extract available views for header (no components)
  const VIEW_REGISTRY = BASE_VIEWS;

  const availableViews = VIEW_REGISTRY.map(({ value, label }) => ({ value, label }));
  
  // Get default route (first view)
  const defaultRoute = VIEW_REGISTRY[0].value;

  // Handle view changes through routing (preserves URL params)
  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, newView: string | null) => {
    if (newView) {
      navigateWithParams(`/${newView}`);
    }
  };

  // Get current view from path
  const currentView = location.pathname.substring(1) || defaultRoute;

  // Handle default route - redirect root to first view (preserves params)
  React.useEffect(() => {
    if (location.pathname === '/') {
      navigateWithParams(`/${defaultRoute}`);
    }
  }, [location.pathname, navigateWithParams, defaultRoute]);

  // Find and render the current view component
  const currentViewConfig = BASE_VIEWS.find(view => view.value === location.pathname.substring(1));
  const ViewComponent = currentViewConfig?.component;

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