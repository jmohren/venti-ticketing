import React from 'react';
import { Paper, Typography, Box, PaperProps } from '@mui/material';

export interface SummaryCardProps extends Omit<PaperProps, 'title'> {
  title: string;
  description?: string;
  /** Color of the left border, e.g. based on priority */
  borderColor?: string;
  /** Bottom left meta text */
  bottomLeft?: string;
  /** Bottom right meta text */
  bottomRight?: string;
  onClick?: () => void;
  draggable?: boolean;
  /** Data to set to DataTransfer when drag starts */
  dragData?: string;
}

/**
 * Generic condensed card with title, short description and a meta row.
 * Useful for list/kanban previews of any entity (tickets, tasks, etc.).
 */
const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  description,
  borderColor,
  bottomLeft,
  bottomRight,
  onClick,
  draggable,
  dragData,
  ...paperProps
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        mb: 1,
        p: 1,
        borderRadius: 2,
        borderLeft: borderColor ? `6px solid ${borderColor}` : undefined,
        cursor: onClick ? 'pointer' : undefined,
      }}
      onClick={onClick}
      draggable={draggable}
      onDragStart={(e) => {
        if (dragData) e.dataTransfer.setData('text/plain', dragData);
      }}
      {...paperProps}
    >
      {/* Main */}
      <Typography variant="subtitle2" fontWeight={600} noWrap>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </Typography>
      )}

      {/* Divider */}
      {(bottomLeft || bottomRight) && (
        <>
          <Box sx={{ height: 1, backgroundColor: 'divider', my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {bottomLeft}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {bottomRight}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SummaryCard; 