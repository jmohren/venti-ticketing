import React, { useMemo } from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface WidgetProps {
  title?: string;
  elevation?: number;
  children: React.ReactNode;
  noPadding?: boolean;
  showDate?: boolean;
  allowHorizontalScroll?: boolean; // New prop to control horizontal scrolling behavior
}

// Static shadow definitions - HMR-friendly
const SHADOW_STYLES = {
  1: '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
  2: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
  3: '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)',
  4: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
  5: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 5px 8px 0px rgba(0,0,0,0.14), 0px 1px 14px 0px rgba(0,0,0,0.12)',
};

// Static styles - avoid complex responsive calculations
const WIDGET_STYLES = {
  container: {
    height: '100%',
    width: '100%',
    maxHeight: '100%',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    fontSize: '0.875rem',
    lineHeight: 1.4,
    // Responsive via CSS media queries
    '@media (max-width: 600px)': {
      fontSize: '0.75rem',
      lineHeight: 1.3,
    },
    '@media (min-width: 900px)': {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    // Phone-specific: minimum height of 20% viewport height
    '@media (max-width: 896px)': {
      minHeight: '20vh',
    },
  },
  header: {
    backgroundColor: '#286982', // Direct color instead of theme
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    padding: '6px 16px',
    minHeight: '40px',
    // Responsive
    '@media (max-width: 600px)': {
      padding: '4px 8px',
      minHeight: '32px',
    },
    '@media (max-width: 900px)': {
      padding: '6px 12px',
      minHeight: '36px',
    },
  },
  headerText: {
    fontWeight: 500,
    fontSize: '1.25rem',
    // Responsive
    '@media (max-width: 600px)': {
      fontSize: '0.875rem',
    },
    '@media (max-width: 900px)': {
      fontSize: '1rem',
    },
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0, // Important for horizontal scrolling
  },
  contentScrollable: {
    flex: 1,
    overflow: 'auto', // Enables both vertical and horizontal scrolling
    minHeight: 0,
    minWidth: 0, // Important for horizontal scrolling
    padding: '8px',
    // Responsive padding
    '@media (max-width: 600px)': {
      padding: '4px',
    },
    '@media (max-width: 900px)': {
      padding: '6px',
    },
  },
  contentNoPadding: {
    flex: 1,
    overflow: 'auto', // Enables both vertical and horizontal scrolling
    minHeight: 0,
    minWidth: 0, // Important for horizontal scrolling
    padding: 0,
  },
} as const;

// Static responsive content styles - with word wrapping control
const getContentStyles = (allowHorizontalScroll: boolean) => ({
  '& > *': {
    fontSize: 'inherit',
    lineHeight: 'inherit',
  },
  '& h1': {
    fontSize: '2.5rem',
    lineHeight: 1.2,
    marginBottom: '1rem',
    ...(allowHorizontalScroll ? { whiteSpace: 'nowrap' } : {}),
    '@media (max-width: 600px)': {
      fontSize: '1.5rem',
      marginBottom: '0.5rem',
    },
    '@media (max-width: 900px)': {
      fontSize: '2rem',
    },
  },
  '& h2': {
    fontSize: '2rem',
    lineHeight: 1.3,
    marginBottom: '0.8rem',
    ...(allowHorizontalScroll ? { whiteSpace: 'nowrap' } : {}),
    '@media (max-width: 600px)': {
      fontSize: '1.25rem',
      marginBottom: '0.4rem',
    },
    '@media (max-width: 900px)': {
      fontSize: '1.5rem',
    },
  },
  '& h3': {
    fontSize: '1.5rem',
    lineHeight: 1.4,
    marginBottom: '0.6rem',
    ...(allowHorizontalScroll ? { whiteSpace: 'nowrap' } : {}),
    '@media (max-width: 600px)': {
      fontSize: '1.1rem',
      marginBottom: '0.3rem',
    },
    '@media (max-width: 900px)': {
      fontSize: '1.25rem',
    },
  },
  '& h4': {
    fontSize: '1.25rem',
    lineHeight: 1.4,
    marginBottom: '0.5rem',
    ...(allowHorizontalScroll ? { whiteSpace: 'nowrap' } : {}),
    '@media (max-width: 600px)': {
      fontSize: '1rem',
      marginBottom: '0.25rem',
    },
    '@media (max-width: 900px)': {
      fontSize: '1.125rem',
    },
  },
  '& p': {
    fontSize: 'inherit',
    lineHeight: 'inherit',
    marginBottom: '1rem',
    ...(allowHorizontalScroll 
      ? { whiteSpace: 'nowrap', overflow: 'visible' }
      : { wordWrap: 'break-word', hyphens: 'auto' }
    ),
    '@media (max-width: 600px)': {
      marginBottom: '0.5rem',
    },
  },
  '& ul, & ol': {
    paddingLeft: '1.5rem',
    marginBottom: '1rem',
    '@media (max-width: 600px)': {
      paddingLeft: '1rem',
      marginBottom: '0.5rem',
    },
  },
  '& li': {
    fontSize: 'inherit',
    lineHeight: 'inherit',
    marginBottom: '0.25rem',
    ...(allowHorizontalScroll 
      ? { whiteSpace: 'nowrap', overflow: 'visible' }
      : { wordWrap: 'break-word' }
    ),
    '@media (max-width: 600px)': {
      marginBottom: '0.125rem',
    },
  },
  '& table': {
    width: allowHorizontalScroll ? 'auto' : '100%',
    minWidth: allowHorizontalScroll ? 'max-content' : '100%',
    fontSize: '1rem',
    '@media (max-width: 600px)': {
      fontSize: '0.75rem',
    },
    '@media (max-width: 900px)': {
      fontSize: '0.875rem',
    },
  },
  '& th, & td': {
    padding: '8px',
    fontSize: 'inherit',
    ...(allowHorizontalScroll 
      ? { whiteSpace: 'nowrap', minWidth: 'max-content' }
      : { wordWrap: 'break-word', maxWidth: '200px' }
    ),
    '@media (max-width: 600px)': {
      padding: '4px',
      ...(!allowHorizontalScroll ? { maxWidth: '100px' } : {}),
    },
    '@media (max-width: 900px)': {
      padding: '6px',
      ...(!allowHorizontalScroll ? { maxWidth: '150px' } : {}),
    },
  },
  '& > div': {
    marginBottom: '1rem',
    // Allow wide components to overflow horizontally
    ...(allowHorizontalScroll ? { 
      minWidth: 'max-content',
      overflow: 'visible' 
    } : {}),
    '@media (max-width: 600px)': {
      marginBottom: '0.5rem',
    },
    '&:last-child': {
      marginBottom: 0,
    },
  },
  // Support for common wide components
  '& canvas, & svg, & img': {
    maxWidth: allowHorizontalScroll ? 'none' : '100%',
    height: 'auto',
  },
  // Chart containers and other visual components
  '& .recharts-wrapper, & .chart-container, & .visualization-container': {
    minWidth: allowHorizontalScroll ? 'max-content' : 'auto',
    overflow: 'visible',
  },
}) as const;

/**
 * Robust Widget component with static styles
 * - HMR-stable with minimal dynamic calculations
 * - Responsive via CSS media queries
 * - Static shadow definitions
 * - Supports both vertical and horizontal scrolling
 * - Optional horizontal scroll mode for wide visual components
 */
const Widget: React.FC<WidgetProps> = ({ 
  title, 
  elevation = 3, 
  children,
  noPadding = true,
  showDate = false,
  allowHorizontalScroll = false,
}) => {
  // Memoize date formatting to avoid recalculation
  const currentDate = useMemo(() => {
    if (!showDate) return '';
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  }, [showDate]);

  // Get stable shadow
  const boxShadow = SHADOW_STYLES[elevation as keyof typeof SHADOW_STYLES] || SHADOW_STYLES[3];

  // Memoize content styles based on horizontal scroll setting
  const contentStyles = useMemo(() => getContentStyles(allowHorizontalScroll), [allowHorizontalScroll]);

  return (
    <Box
      sx={{
        ...WIDGET_STYLES.container,
        boxShadow,
      }}
    >
      {/* Header */}
      {title && (
        <>
          <Box sx={WIDGET_STYLES.header}>
            <Typography 
              variant="h6"
              noWrap
              sx={WIDGET_STYLES.headerText}
            >
              {showDate ? `${title} - ${currentDate}` : title}
            </Typography>
          </Box>
          <Divider />
        </>
      )}
      
      {/* Content Container */}
      <Box sx={WIDGET_STYLES.contentContainer}>
        <Box 
          sx={{
            ...(noPadding ? WIDGET_STYLES.contentNoPadding : WIDGET_STYLES.contentScrollable),
            ...contentStyles,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export { Widget }; 