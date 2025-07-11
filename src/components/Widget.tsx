import React, { ReactNode } from 'react';
import { Paper, Typography, Box, styled, Divider } from '@mui/material';

// Styled component for dashboard Widgets
const StyledWidget = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: theme.shadows[3], // Use theme shadow
}));

const WidgetHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  flexShrink: 0, // Prevent header from shrinking
}));

const WidgetContent = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignWidgets: 'center',
  overflow: 'hidden',
  padding: 0, // No padding by default
}));

// Interface for grid positioning
interface GridPosition {
  columnStart?: number | string;
  columnSpan?: number;
  rowStart?: number | string; // min 2
  rowSpan?: number; // max 12
}

interface WidgetProps {
  title?: string;
  elevation?: number;
  children: ReactNode;
  noPadding?: boolean;
  gridPosition?: GridPosition;
  showDate?: boolean;
}

/**
 * A reusable component for individual dashboard panels.
 * It provides consistent styling and layout for dashboard Widgets.
 * 
 * @param title - Optional title for the dashboard Widget
 * @param elevation - Optional elevation for the Paper component (default: 3)
 * @param children - The content of the dashboard Widget
 * @param noPadding - If true, removes padding from the content area (useful for charts)
 * @param gridPosition - Optional grid positioning configuration (column/row start/span)
 * @param showDate - If true, displays the current date in the header (DD.MM.YY format)
 */
const Widget: React.FC<WidgetProps> = ({ 
  title, 
  elevation = 3, 
  children,
  noPadding = true, // Default to no padding
  gridPosition,
  showDate = false,
}) => {
  // Format current date as dd.mm.yy with dots
  const formatDateWithDots = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };
  
  const currentDate = showDate ? formatDateWithDots(new Date()) : '';

  // Grid styling based on provided grid position
  const gridStyle = gridPosition ? {
    gridColumn: gridPosition.columnStart !== undefined 
      ? `${gridPosition.columnStart} / span ${gridPosition.columnSpan || 1}`
      : `span ${gridPosition.columnSpan || 1}`,
    gridRow: gridPosition.rowStart !== undefined
      ? `${gridPosition.rowStart} / span ${gridPosition.rowSpan || 1}`
      : `span ${gridPosition.rowSpan || 1}`,
    height: '100%',
  } : {};

  return (
    <Box sx={gridStyle}>
      <StyledWidget elevation={elevation}>
        {title && (
          <>
            <WidgetHeader sx={{ p: 0.5, paddingLeft: 1, backgroundColor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignWidgets: 'center' }}>
              <Typography variant="h6" noWrap>
                {showDate ? `${title} - ${currentDate}` : title}
              </Typography>
            </WidgetHeader>
            <Divider />
          </>
        )}
        
        <WidgetContent sx={{ padding: noPadding ? 0 : 1 }}>
          {/* CSS approach that maintains aspect ratio while maximizing space */}
          <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignWidgets: 'center',
          }}>
            <Box sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignWidgets: 'center',
              '& > *': {
                position: 'relative',
                maxWidth: '100%', 
                maxHeight: '100%',
                // Use auto for both to maintain aspect ratio
                width: 'auto', 
                height: 'auto',
                // But ensure at least one dimension is 100%
                // This is the key - will scale to either 100% width or 100% height
                // while maintaining aspect ratio
                objectFit: 'contain'
              }
            }}>
              {children}
            </Box>
          </Box>
        </WidgetContent>
      </StyledWidget>
    </Box>
  );
};

export default Widget; 