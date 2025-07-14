import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Widget } from 'core/components';

interface AppHeaderProps {
  currentView?: string;
  onViewChange?: (event: React.MouseEvent<HTMLElement>, newView: string | null) => void;
  availableViews?: Array<{ value: string; label: string }>;
  useStyledToggle?: boolean;
  gridPosition?: {
    columnStart?: number | string;
    columnSpan?: number;
    rowStart?: number | string;
    rowSpan?: number;
  };
}

const AppHeader: React.FC<AppHeaderProps> = ({
  currentView = 'daily-routine',
  onViewChange,
  availableViews = [{ value: 'daily-routine', label: 'Daily Routine' }],
  useStyledToggle = true,
  gridPosition = { columnStart: 1, columnSpan: 12, rowStart: 1, rowSpan: 1 },
}) => {
  const toggleButtonStyles = useStyledToggle ? {
    border: 'none',
    '& .MuiToggleButton-root': {
      border: 'none',
      borderRadius: 0,
      position: 'relative',
      color: 'text.secondary',
      backgroundColor: 'transparent',
      fontWeight: 500,
      fontSize: (theme: any) => theme.typography.h6.fontSize,
      textTransform: 'none',
      paddingLeft: 0,
      paddingRight: 0,
      marginLeft: 1,
      marginRight: 1,
      marginBottom: 0,
      outline: 'none',
      '&:hover': {
        backgroundColor: 'transparent',
        color: 'primary.main',
      },
      '&:active': {
        backgroundColor: 'transparent',
      },
      '&:focus': {
        backgroundColor: 'transparent',
        outline: 'none',
      },
      '&.Mui-selected': {
        backgroundColor: 'transparent',
        color: 'primary.main',
        fontWeight: 500,
        outline: 'none',
        '&:after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: 'primary.main',
          borderRadius: '1.5px 1.5px 0 0',
        },
        '&:hover': {
          backgroundColor: 'transparent',
          color: 'primary.main',
        },
        '&:active': {
          backgroundColor: 'transparent',
        },
        '&:focus': {
          backgroundColor: 'transparent',
          outline: 'none',
        },
      },
    },
  } : {};

  return (
    <Widget gridPosition={gridPosition}>
      <Box sx={{ 
        width: '100%',
        height: '100%',
        '& > div': {
          padding: '16px 24px',
          height: '100%',
          boxSizing: 'border-box'
        }
      }}>
        <Box sx={{ p: 2 }}>
          {/* View Toggle Buttons */}
          <ToggleButtonGroup
            value={currentView}
            exclusive
            onChange={onViewChange}
            aria-label="View selection"
            sx={toggleButtonStyles}
          >
            {availableViews.map((view) => (
              <ToggleButton key={view.value} value={view.value} disableRipple={useStyledToggle}>
                {view.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>
    </Widget>
  );
};

export { AppHeader }; 