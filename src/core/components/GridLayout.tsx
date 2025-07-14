import React, { ReactNode } from 'react';
import { Box, styled, Grid } from '@mui/material';
import { AppHeader } from '@/core/components/AppHeader';

// Styled components for the Grid
const GridContainer = styled(Box)(({ }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const GridContent = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2), // Increased padding from 0.5 to 2 (16px)
  overflow: 'hidden',
}));

// New grid interface to define grid dimensions
interface GridDimensions {
  columns?: number;
  rows?: number;
  gap?: string | number;
}

interface GridLayoutProps {
  title: string;
  // Header-related props
  availableViews: Array<{ value: string; label: string }>;
  currentView: string;
  onViewChange: (event: React.MouseEvent<HTMLElement>, newView: string | null) => void;
  useStyledToggle?: boolean;
  children: ReactNode;
  gridDimensions?: GridDimensions;
}

/**
 * A reusable Grid layout component that provides consistent styling for all Grids.
 * It includes a header with title and optional subtitle, and a content area for Grid components.
 * 
 * @param title - The Grid title
 * @param children - The Grid content (typically Grid items positioned in the grid)
 * @param gridDimensions - Optional grid dimensions configuration (defaults to 12x12 grid with 12px gap)
 */
const GridLayout: React.FC<GridLayoutProps> = ({ 
  availableViews,
  currentView,
  onViewChange,
  useStyledToggle = true,
  children,
  gridDimensions = { columns: 12, rows: 13, gap: '12px' }
}) => {
  const { columns = 12, rows = 13, gap = '12px' } = gridDimensions;
  
  return (
    <GridContainer>      
      <GridContent>
        <Box sx={{ position: 'relative', height: '100%' }}>
          <Grid 
            container 
            sx={{ 
              height: '100%',
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gap: gap
            }}
          >
            {/* Header Widget */}
            <AppHeader 
              currentView={currentView}
              onViewChange={onViewChange}
              availableViews={availableViews}
              useStyledToggle={useStyledToggle}
            />
            {children}
          </Grid>
        </Box>
      </GridContent>
    </GridContainer>
  );
};

export { GridLayout }; 