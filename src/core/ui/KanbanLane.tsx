import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Typography } from '@mui/material';

const StyledLane = styled(Box)(({ theme }) => ({
  flex: 1,
  border: `1px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  minHeight: 300,
  backgroundColor: theme.palette.grey[100],
  overflowY: 'auto',
}));

export type KanbanLaneProps = BoxProps & {
  /** Optional override for padding inside the lane (defaults to theme.spacing(2)) */
  paddingOverride?: number;
  /** Optional header/title displayed at the top of the lane */
  header?: React.ReactNode;
};

/**
 * Pure presentational component representing a column / lane in a kanban-style board.
 * Contains no business logic – just renders its children with consistent styling.
 */
const KanbanLane: React.FC<KanbanLaneProps> = ({ children, paddingOverride, header, sx, ...rest }) => {
  const pValue = paddingOverride !== undefined ? paddingOverride : 2;
  return (
    <StyledLane
      sx={{ pt: 0, px: pValue, pb: pValue, ...sx }}
      {...rest}
    >
      {header && (
        <Box sx={(theme) => ({
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            backgroundColor: theme.palette.grey[100],
            px: pValue,
            py: 1,
            // Extend header to edge by negating lane horizontal padding
            mx: -pValue,
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 1,
          })}>
          {typeof header === 'string' ? (
            <Typography variant="subtitle1" fontWeight={700}>{header}</Typography>
          ) : (
            header
          )}
        </Box>
      )}
      {children}
    </StyledLane>
  );
};

export default KanbanLane; 