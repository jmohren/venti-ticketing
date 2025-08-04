import React, { useMemo } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { SPACING, mixins, widgetStyles, responsive } from '@/core/theme';

interface WidgetProps {
  title?: string;
  elevation?: number;
  children: React.ReactNode;
  noPadding?: boolean;
  showDate?: boolean;
  allowHorizontalScroll?: boolean;
}

// Static shadow definitions - cross-browser compatible
const SHADOW_STYLES = {
  1: '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
  2: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
  3: '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)',
  4: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
  5: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 5px 8px 0px rgba(0,0,0,0.14), 0px 1px 14px 0px rgba(0,0,0,0.12)',
};

// Clean widget styles using our responsive system
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
    ...mixins.cleanMargins,
    ...widgetStyles.responsiveText,
    ...widgetStyles.mobileResponsiveSizing,
  },
  header: {
    backgroundColor: '#286982',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    minHeight: '40px',
    ...widgetStyles.headerPadding,
  },
  headerText: {
    fontWeight: 500,
    fontSize: '1.25rem',
    [responsive.down('sm')]: {
      fontSize: '0.875rem',
    },
    [responsive.between('sm', 'lg')]: {
      fontSize: '1rem',
    },
    [responsive.up('xl')]: {
      fontSize: '1.375rem',
    },
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
  },
  contentScrollable: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    minWidth: 0,
    padding: SPACING.standard,
    ...mixins.smoothScrolling,
  },
  contentNoPadding: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    minWidth: 0,
    padding: 0,
    ...mixins.smoothScrolling,
  },
} as const;

// Progressive content styles - device-aware typography
const getContentStyles = (allowHorizontalScroll: boolean) => ({
  ...mixins.cleanMargins,
  '& > *': {
    fontSize: 'inherit',
    lineHeight: 'inherit',
  },
  '& h1': {
    fontSize: '2.5rem',
    lineHeight: 1.2,
    marginBottom: '1rem',
    ...(allowHorizontalScroll ? { whiteSpace: 'nowrap' } : {}),
    [responsive.down('sm')]: {
      fontSize: '1.5rem',
      marginBottom: '0.5rem',
    },
    [responsive.between('sm', 'lg')]: {
      fontSize: '2rem',
    },
    [responsive.up('xl')]: {
      fontSize: '3rem',
    },
  },
  '& h2': {
    fontSize: '2rem',
    lineHeight: 1.3,
    marginBottom: '0.8rem',
    ...(allowHorizontalScroll ? { whiteSpace: 'nowrap' } : {}),
    [responsive.down('sm')]: {
      fontSize: '1.25rem',
      marginBottom: '0.4rem',
    },
    [responsive.between('sm', 'lg')]: {
      fontSize: '1.5rem',
    },
    [responsive.up('xl')]: {
      fontSize: '2.25rem',
    },
  },
  '& h3': {
    fontSize: '1.5rem',
    lineHeight: 1.4,
    marginBottom: '0.6rem',
    ...(allowHorizontalScroll ? { whiteSpace: 'nowrap' } : {}),
    [responsive.down('sm')]: {
      fontSize: '1.1rem',
      marginBottom: '0.3rem',
    },
    [responsive.between('sm', 'lg')]: {
      fontSize: '1.25rem',
    },
    [responsive.up('xl')]: {
      fontSize: '1.75rem',
    },
  },
  '& h4': {
    fontSize: '1.25rem',
    lineHeight: 1.4,
    marginBottom: '0.5rem',
    ...(allowHorizontalScroll ? { whiteSpace: 'nowrap' } : {}),
    [responsive.down('sm')]: {
      fontSize: '1rem',
      marginBottom: '0.25rem',
    },
    [responsive.between('sm', 'lg')]: {
      fontSize: '1.125rem',
    },
    [responsive.up('xl')]: {
      fontSize: '1.5rem',
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
    [responsive.down('sm')]: {
      marginBottom: '0.5rem',
    },
  },
  '& ul, & ol': {
    paddingLeft: '1.5rem',
    marginBottom: '1rem',
    [responsive.down('sm')]: {
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
    [responsive.down('sm')]: {
      marginBottom: '0.125rem',
    },
  },
  '& table': {
    width: allowHorizontalScroll ? 'auto' : '100%',
    minWidth: allowHorizontalScroll ? 'max-content' : '100%',
    fontSize: '1rem',
    [responsive.down('sm')]: {
      fontSize: '0.75rem',
    },
    [responsive.between('sm', 'lg')]: {
      fontSize: '0.875rem',
    },
    [responsive.up('xl')]: {
      fontSize: '1.125rem',
    },
  },
  '& th, & td': {
    padding: '8px',
    fontSize: 'inherit',
    ...(allowHorizontalScroll 
      ? { whiteSpace: 'nowrap', minWidth: 'max-content' }
      : { wordWrap: 'break-word', maxWidth: '200px' }
    ),
    [responsive.down('sm')]: {
      padding: '4px',
      ...(!allowHorizontalScroll ? { maxWidth: '100px' } : {}),
    },
    [responsive.between('sm', 'lg')]: {
      padding: '6px',
      ...(!allowHorizontalScroll ? { maxWidth: '150px' } : {}),
    },
    [responsive.up('xl')]: {
      padding: '10px',
      ...(!allowHorizontalScroll ? { maxWidth: '300px' } : {}),
    },
  },
  '& > div': {
    marginBottom: '1rem',
    ...(allowHorizontalScroll ? { 
      minWidth: 'max-content',
      overflow: 'visible' 
    } : {}),
    [responsive.down('sm')]: {
      marginBottom: '0.5rem',
    },
    '&:last-child': {
      marginBottom: 0,
    },
  },
  // Support for visual components across all browsers
  '& canvas, & svg, & img': {
    maxWidth: allowHorizontalScroll ? 'none' : '100%',
    height: 'auto',
  },
  // Chart containers and visualizations
  '& .recharts-wrapper, & .chart-container, & .visualization-container': {
    minWidth: allowHorizontalScroll ? 'max-content' : 'auto',
    overflow: 'visible',
  },
}) as const;

/**
 * Cross-browser responsive Widget component
 * Uses centralized responsive styling system for clean, maintainable code
 */
const Widget: React.FC<WidgetProps> = ({ 
  title, 
  elevation = 3, 
  children,
  noPadding = true,
  showDate = false,
  allowHorizontalScroll = false,
}) => {
  // Memoize date formatting
  const currentDate = useMemo(() => {
    if (!showDate) return '';
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  }, [showDate]);

  // Cross-browser shadow support
  const boxShadow = SHADOW_STYLES[elevation as keyof typeof SHADOW_STYLES] || SHADOW_STYLES[3];

  // Memoize content styles
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