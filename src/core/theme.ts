// Centralized breakpoint system (Material Design standard)
export const BREAKPOINTS = {
  xs: 0,      // 0px+: phones (portrait)
  sm: 600,    // 600px+: phones (landscape), small tablets
  md: 960,    // 960px+: tablets, small laptops  
  lg: 1280,   // 1280px+: desktops
  xl: 1920,   // 1920px+: large desktops
} as const;

// Design tokens - centralized spacing system
export const SPACING = {
  standard: '12px',
  small: '8px',
  large: '16px',
  gap: '12px',
} as const;

// Header height constants
export const HEADER_HEIGHTS = {
  appBar: {
    small: 56, // Mobile AppBar
    standard: 64, // Desktop AppBar
  },
  navigator: {
    small: 56, // Mobile NavigatorBar  
    standard: 64, // Desktop NavigatorBar
  },
  get totalSmall() {
    return this.appBar.small + this.navigator.small;
  },
  get totalStandard() {
    return this.appBar.standard + this.navigator.standard;
  },
} as const;

// Responsive utility functions
export const responsive = {
  // Mobile-first breakpoint utilities
  up: (breakpoint: keyof typeof BREAKPOINTS) => `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`,
  down: (breakpoint: keyof typeof BREAKPOINTS) => `@media (max-width: ${BREAKPOINTS[breakpoint] - 1}px)`,
  between: (start: keyof typeof BREAKPOINTS, end: keyof typeof BREAKPOINTS) => 
    `@media (min-width: ${BREAKPOINTS[start]}px) and (max-width: ${BREAKPOINTS[end] - 1}px)`,
  only: (breakpoint: keyof typeof BREAKPOINTS) => {
    const keys = Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[];
    const index = keys.indexOf(breakpoint);
    const next = keys[index + 1];
    return next 
      ? `@media (min-width: ${BREAKPOINTS[breakpoint]}px) and (max-width: ${BREAKPOINTS[next] - 1}px)`
      : `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`;
  },
};

// Common responsive style mixins
export const mixins = {
  // Standard spacing that stays consistent across all devices
  consistentSpacing: {
    padding: SPACING.standard,
    gap: SPACING.gap,
  },

  // Mobile layout reset - removes flex behavior for natural content sizing
  mobileLayoutReset: {
    [responsive.down('md')]: {
      flex: 'none',
      height: 'auto',
      width: '100%',
    },
  },

  // Mobile stacking - converts horizontal layouts to vertical
  mobileStack: {
    [responsive.down('md')]: {
      flexDirection: 'column',
      height: 'auto',
      minHeight: 'auto',
      gap: SPACING.gap,
      alignItems: 'stretch',
    },
  },

  // Cross-browser smooth scrolling
  smoothScrolling: {
    [responsive.down('md')]: {
      overflow: 'auto',
      scrollBehavior: 'smooth',
      overscrollBehavior: 'contain',
      WebkitOverflowScrolling: 'touch',
    },
  },

  // Clean margins - prevents unwanted spacing
  cleanMargins: {
    margin: 0,
    '& > *:first-child': {
      marginTop: 0,
    },
    '& > *:last-child': {
      marginBottom: 0,
    },
  },
};

// Helper function for calculating remaining screen height
const getRemainingHeight = (breakpoint: 'small' | 'standard' = 'standard'): { base: string; dynamic: string } => {
  const headerHeight = breakpoint === 'small' 
    ? HEADER_HEIGHTS.totalSmall 
    : HEADER_HEIGHTS.totalStandard;
  const padding = parseInt(SPACING.standard) * 2; // Top and bottom padding
  
  return {
    base: `calc(100vh - ${headerHeight}px - ${padding}px)`,
    dynamic: `calc(100dvh - ${headerHeight}px - ${padding}px)`, // Safari support
  };
};

// Widget-specific responsive utilities
export const widgetStyles = {
  // Calculate remaining screen height after headers and padding
  getRemainingHeight,

  // Mobile widget sizing with min/max height constraints
  mobileResponsiveSizing: (() => {
    const smallHeight = getRemainingHeight('small');
    const standardHeight = getRemainingHeight('standard');
    
    return {
      [responsive.down('sm')]: {
        maxHeight: smallHeight.base,
        minHeight: `calc((100vh - 120px - 24px) * 0.2)`,
        '@supports (height: 100dvh)': {
          maxHeight: smallHeight.dynamic,
          minHeight: `calc((100dvh - 120px - 24px) * 0.2)`,
        },
      },
      [responsive.between('sm', 'md')]: {
        maxHeight: standardHeight.base,
        minHeight: `calc((100vh - 128px - 24px) * 0.2)`,
        '@supports (height: 100dvh)': {
          maxHeight: standardHeight.dynamic,
          minHeight: `calc((100dvh - 128px - 24px) * 0.2)`,
        },
      },
    };
  })(),

  // Progressive typography scaling
  responsiveText: {
    fontSize: '0.875rem',
    lineHeight: 1.4,
    [responsive.down('sm')]: {
      fontSize: '0.75rem',
      lineHeight: 1.3,
    },
    [responsive.between('sm', 'md')]: {
      fontSize: '0.8125rem',
      lineHeight: 1.35,
    },
    [responsive.up('lg')]: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    [responsive.up('xl')]: {
      fontSize: '1.125rem',
      lineHeight: 1.6,
    },
  },

  // Header padding that matches overall spacing system
  headerPadding: {
    padding: `6px ${SPACING.standard}`,
    [responsive.down('sm')]: {
      padding: `4px ${SPACING.standard}`,
    },
    [responsive.between('sm', 'lg')]: {
      padding: `6px ${SPACING.standard}`,
    },
    [responsive.up('xl')]: {
      padding: `8px ${SPACING.standard}`,
    },
  },
};

// Layout-specific utilities
export const layoutStyles = {
  // Container that maintains aspect ratio and proper spacing
  flexContainer: (direction: 'row' | 'column' = 'row') => ({
    display: 'flex',
    flexDirection: direction,
    height: '100%',
    width: '100%',
    padding: SPACING.standard, // Outer container padding
    gap: SPACING.gap,
    minHeight: 0,
    ...mixins.mobileStack,
  }),

  // Grid item that responds properly to mobile
  gridItem: (weight: number = 1) => ({
    flex: `${weight} 1 0%`,
    ...mixins.mobileLayoutReset,
  }),
};

// Export everything for easy importing
export default {
  BREAKPOINTS,
  SPACING,
  HEADER_HEIGHTS,
  responsive,
  mixins,
  widgetStyles,
  layoutStyles,
}; 