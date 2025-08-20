import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  FirstPage,
  LastPage,
} from '@mui/icons-material';
import { MachinePagination as PaginationType } from '@/app/state/MachineProvider';

interface Props {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const MachinePagination: React.FC<Props> = ({ pagination, onPageChange, loading = false }) => {
  const { page, limit, total, totalPages } = pagination;
  
  const startItem = page * limit + 1;
  const endItem = Math.min((page + 1) * limit, total);
  
  const handleFirstPage = () => onPageChange(0);
  const handlePrevPage = () => onPageChange(Math.max(0, page - 1));
  const handleNextPage = () => onPageChange(Math.min(totalPages - 1, page + 1));
  const handleLastPage = () => onPageChange(totalPages - 1);
  
  return (
    <Paper 
      sx={{ 
        position: 'sticky',
        bottom: 0,
        zIndex: 1,
        borderTop: 1,
        borderColor: 'divider',
        borderRadius: 0,
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'background.paper'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {total > 0 ? `${startItem}-${endItem} von ${total}` : '0 von 0'}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          onClick={handleFirstPage}
          disabled={loading || page === 0}
        >
          <FirstPage />
        </IconButton>
        
        <IconButton
          size="small"
          onClick={handlePrevPage}
          disabled={loading || page === 0}
        >
          <ChevronLeft />
        </IconButton>
        
        <Typography variant="body2" sx={{ mx: 2, minWidth: 60, textAlign: 'center' }}>
          {totalPages > 0 ? `${page + 1} / ${totalPages}` : '0 / 0'}
        </Typography>
        
        <IconButton
          size="small"
          onClick={handleNextPage}
          disabled={loading || page >= totalPages - 1}
        >
          <ChevronRight />
        </IconButton>
        
        <IconButton
          size="small"
          onClick={handleLastPage}
          disabled={loading || page >= totalPages - 1}
        >
          <LastPage />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default MachinePagination;
