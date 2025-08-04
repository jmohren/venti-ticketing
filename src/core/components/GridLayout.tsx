import React from 'react';
import { Box } from '@mui/material';
import { NavigatorBar } from '@/core/components/NavigatorBar';
import { Widget } from '@/core/components/Widget';
import { SPACING, mixins, layoutStyles } from '@/core/theme';

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

// Clean, centralized styles using our responsive system
const STYLES = {
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
    ...mixins.consistentSpacing,
    paddingBottom: 0,
  },
  contentArea: {
    flex: 1,
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    ...mixins.smoothScrolling,
  },
  container: (direction: 'row' | 'column', gap: string = SPACING.gap) => ({
    display: 'flex',
    flexDirection: direction,
    height: '100%',
    width: '100%',
    gap,
    minHeight: 0,
    minWidth: 0,
    ...mixins.mobileStack,
  }),
} as const;

/**
 * GridLayout - provides NavigatorBar and content area
 * Uses centralized responsive styling system
 */
const GridLayout: React.FC<GridLayoutProps> = ({ 
  availableViews,
  currentView,
  onViewChange,
  useStyledToggle = true,
  children
}) => {
  return (
    <Box sx={STYLES.root}>
      <Box sx={STYLES.navContainer}>
        <NavigatorBar 
          currentView={currentView}
          onViewChange={onViewChange}
          availableViews={availableViews}
          useStyledToggle={useStyledToggle}
        />
      </Box>
      <Box sx={STYLES.contentArea}>
        {children}
      </Box>
    </Box>
  );
};

/**
 * Layout - main container with explicit direction
 * Automatically stacks vertically on mobile devices
 */
const Layout: React.FC<LayoutProps> = ({ children, direction = 'row' }) => {
  return (
    <Box sx={layoutStyles.flexContainer(direction)}>
      {children}
    </Box>
  );
};

/**
 * Row - horizontal flexbox container
 * Automatically resets to natural sizing on mobile
 */
const Row: React.FC<RowProps> = ({ children, weight = 1 }) => {
  return (
    <Box sx={layoutStyles.gridItem(weight)}>
      <Box sx={STYLES.container('row')}>
        {children}
      </Box>
    </Box>
  );
};

/**
 * Column - vertical flexbox container  
 * Automatically resets to natural sizing on mobile
 */
const Column: React.FC<ColumnProps> = ({ children, weight = 1 }) => {
  return (
    <Box sx={layoutStyles.gridItem(weight)}>
      <Box sx={STYLES.container('column')}>
        {children}
      </Box>
    </Box>
  );
};

export { GridLayout, Layout, Row, Column, Widget };