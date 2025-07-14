import React from 'react';
import { useLocation } from 'react-router-dom';
import { GridLayout } from '@/core/components/GridLayout';
import AddTicketView from '@/app/views/add-ticket/AddTicketView';
import TicketPoolView from '@/app/views/ticket-pool/TicketPoolView';
import InstandhaltungView from '@/app/views/instandhaltung/InstandhaltungView';
import KonfigurationView from '@/app/views/konfiguration/KonfigurationView';
import { useUrlAwareNavigation } from '@/core/hooks/useUrlState';

// Single source of truth for all views
const BASE_VIEWS = [
  { value: 'add-ticket', label: 'Ticket anlegen', component: AddTicketView },
  { value: 'ticket-pool', label: 'Ticket Pool', component: TicketPoolView },
  { value: 'instandhaltung', label: 'Instandhaltung', component: InstandhaltungView },
  { value: 'konfiguration', label: 'Konfiguration', component: KonfigurationView },
] as const;

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
    <GridLayout 
      title={`App Management - ${currentView.replace('-', ' ')}`}
      availableViews={availableViews}
      currentView={currentView}
      onViewChange={handleViewChange}
      useStyledToggle={true}
    >
      {/* Dynamic view rendering */}
      {ViewComponent && <ViewComponent />}
    </GridLayout>
  );
};

export default AppMain; 