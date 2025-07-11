import React from 'react';
import { useLocation } from 'react-router-dom';
import GridLayout from '../components/GridLayout';
import StartView from './views/start/StartView';
import { useUrlAwareNavigation } from '../hooks/useUrlState';

// Single source of truth for all views
const BASE_VIEWS = [
  { value: 'start', label: 'Start', component: StartView },
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