import React from 'react';
import { Box } from '@mui/material';
import { NavigatorBar } from '@/core/components/NavigatorBar';
import { Widget } from '@/core/components/Widget';

interface LayoutProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
}

interface RowProps {
  children: React.ReactNode;
  weight?: number;
}

interface ColumnProps {
  children: React.ReactNode;
  weight?: number;
}

interface GridLayoutProps {
  title: string;
  availableViews: Array<{ value: string; label: string }>;
  currentView: string;
  onViewChange: (event: React.MouseEvent<HTMLElement>, newView: string | null) => void;
  useStyledToggle?: boolean;
  children: React.ReactNode;
}

// Completely static styles - no dynamic calculations
const STATIC_STYLES = {
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  navContainer: {
    flexShrink: 0,
    minHeight: '64px',
    width: '100%',
    padding: '12px',
    paddingBottom: 0,
  },
  contentArea: {
    flex: 1,
    padding: '12px',
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    // Add scrolling for phones only (both portrait and landscape)
    '@media (max-width: 896px)': {
      overflow: 'auto',
    },
  },
  rowContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    gap: '12px',
    minHeight: 0,
    minWidth: 0,
    // On phones: stack vertically, one widget per row (both portrait and landscape)
    '@media (max-width: 896px)': {
      flexDirection: 'column',
      height: 'auto',
      minHeight: 'auto',
    },
  },
  columnContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '12px',
    minHeight: 0,
    minWidth: 0,
    // On phones: ensure full width and auto height (both portrait and landscape)
    '@media (max-width: 896px)': {
      height: 'auto',
      minHeight: 'auto',
    },
  },
} as const;

/**
 * GridLayout - provides NavigatorBar and content area
 * Completely static, no dynamic calculations
 */
const GridLayout: React.FC<GridLayoutProps> = ({ 
  availableViews,
  currentView,
  onViewChange,
  useStyledToggle = true,
  children
}) => {
  return (
    <Box sx={STATIC_STYLES.root}>
      <Box sx={STATIC_STYLES.navContainer}>
        <NavigatorBar 
          currentView={currentView}
          onViewChange={onViewChange}
          availableViews={availableViews}
          useStyledToggle={useStyledToggle}
        />
      </Box>
      <Box sx={STATIC_STYLES.contentArea}>
        {children}
      </Box>
    </Box>
  );
};

/**
 * Layout - main container with explicit direction
 * DEFAULT: direction="row" → children arranged horizontally (for Column children)
 * direction="column" → children arranged vertically (for Row children)
 * RESPONSIVE: On phones, always stacks vertically regardless of direction
 */
const Layout: React.FC<LayoutProps> = ({ children, direction = 'row' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: direction,
        height: '100%',
        width: '100%',
        gap: '12px',
        minHeight: 0,
        // On phones: always stack vertically and allow auto height (both portrait and landscape)
        '@media (max-width: 896px)': {
          flexDirection: 'column',
          height: 'auto',
          minHeight: 'auto',
        },
      }}
    >
      {children}
    </Box>
  );
};

/**
 * Row - horizontal flexbox container
 * Uses weight as flex-grow directly
 * RESPONSIVE: On phones, becomes full-width vertical container
 */
const Row: React.FC<RowProps> = ({ children, weight = 1 }) => {
  return (
    <Box
      sx={{
        ...STATIC_STYLES.rowContainer,
        flex: `${weight} 1 0%`, // flex-grow: weight, flex-shrink: 1, flex-basis: 0%
        // On phones: take full width and auto height (both portrait and landscape)
        '@media (max-width: 896px)': {
          flex: '0 0 auto',
          width: '100%',
        },
      }}
    >
      {children}
    </Box>
  );
};

/**
 * Column - vertical flexbox container
 * Uses weight as flex-grow directly  
 * RESPONSIVE: On phones, becomes full-width with auto height
 */
const Column: React.FC<ColumnProps> = ({ children, weight = 1 }) => {
  return (
    <Box
      sx={{
        ...STATIC_STYLES.columnContainer,
        flex: `${weight} 1 0%`, // flex-grow: weight, flex-shrink: 1, flex-basis: 0%
        // On phones: take full width and auto height (both portrait and landscape)
        '@media (max-width: 896px)': {
          flex: '0 0 auto',
          width: '100%',
        },
      }}
    >
      {children}
    </Box>
  );
};

export { GridLayout, Layout, Row, Column, Widget };