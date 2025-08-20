import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useMachines, MachineBasic, MachineFilters as MachineFiltersType, MachinePagination as MachinePaginationType } from '@/app/hooks/useMachines';
import { useTickets } from '@/app/hooks/useTickets';
import MachineFilters from './MachineFilters';
import MachinePagination from '@/app/components/MachinePagination';

const MachineCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.grey[200]}`,
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },
  minHeight: '120px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxShadow: theme.shadows[2],
}));



const UrgencyBadge = styled(Box)<{ urgencyColor: string }>(({ theme, urgencyColor }) => ({
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: urgencyColor,
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 600,
  boxShadow: theme.shadows[1],
}));

const MaschinenWidget: React.FC = () => {
  const { loadMachines, filterOptions, filterOptionsLoading } = useMachines();
  const { tickets } = useTickets();

  // Local state for this view
  const [machines, setMachines] = useState<MachineBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MachineFiltersType>({});
  const [pagination, setPagination] = useState<MachinePaginationType>({
    page: 0,
    limit: 100,
    total: 0,
    totalPages: 0
  });

  // Load machines function
  const searchMachines = async () => {
    try {
      setLoading(true);
      const result = await loadMachines(filters, 0); // Always start from first page on search
      setMachines(result.data);
      setPagination(prev => ({
        ...prev,
        page: 0,
        total: result.count,
        totalPages: result.totalPages
      }));
    } catch (error) {
      console.error('Failed to load machines:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination changes
  const handleSetPagination = async (page: number) => {
    try {
      setLoading(true);
      const result = await loadMachines(filters, page);
      setMachines(result.data);
      setPagination(prev => ({
        ...prev,
        page,
        total: result.count,
        totalPages: result.totalPages
      }));
    } catch (error) {
      console.error('Failed to load machines:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    searchMachines();
  }, []); // Only run once on mount

  const priorityColors = {
    rot: '#f44336',
    gelb: '#ff9800', 
    gruen: '#4caf50'
  };

  const priorityLabels = {
    rot: 'Kritisch',
    gelb: 'Mittel',
    gruen: 'Niedrig'
  };

  const machineTicketData = useMemo(() => {
    if (!machines || !tickets) return {};

    return machines.reduce((acc, machine) => {
      const machineTickets = tickets.filter(ticket => 
        ticket.machine === machine.equipment_description && 
        ticket.status !== 'done' && 
        ticket.status !== 'archived'
      );

      acc[machine.equipment_number] = {
        rot: { count: machineTickets.filter(t => t.priority === 'rot').length },
        gelb: { count: machineTickets.filter(t => t.priority === 'gelb').length },
        gruen: { count: machineTickets.filter(t => t.priority === 'gruen').length }
      };

      return acc;
    }, {} as Record<string, { rot: { count: number }, gelb: { count: number }, gruen: { count: number } }>);
  }, [machines, tickets]);

  const handleMachineClick = (machine: any) => {
    console.log('Machine clicked:', machine.equipment_description);
    // TODO: Navigate to machine detail or open machine dialog
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filters - Sticky Header */}
      <Box 
        sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 2,
          backgroundColor: 'grey.100',
          borderBottom: 1,
          borderColor: 'divider',
          px: 2,
          py: 1
        }}
      >
        <MachineFilters
          filters={filters}
          filterOptions={filterOptions}
          filterOptionsLoading={filterOptionsLoading}
          onFiltersChange={setFilters}
          onSearch={searchMachines}
          loading={loading}
        />
      </Box>

      {/* Machine Grid */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          overflow: 'auto',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { backgroundColor: 'grey.100', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'grey.400',
            borderRadius: '4px',
            '&:hover': { backgroundColor: 'grey.500' },
          },
        }}
      >
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Maschinen werden geladen...
            </Typography>
          </Box>
        ) : machines.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Keine Maschinen gefunden.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Versuchen Sie, die Filter zu ändern.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              '& > *': {
                width: 'calc(20% - 24px)', // Fixed width for 5 items per row
                minWidth: '250px',
                flexShrink: 0,
              },
            }}
          >
            {machines.map((machine) => {
          const ticketData = machineTicketData[machine.equipment_number] || { rot: { count: 0 }, gelb: { count: 0 }, gruen: { count: 0 } };

          return (
            <MachineCard 
              elevation={1}
              onClick={() => handleMachineClick(machine)}
              key={machine.equipment_number}
            >
              {/* Row 1: Machine Number (left) + Ticket badges (right) */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={machine.equipment_number}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }}
                />
                
                {/* Ticket badges */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {Object.entries(priorityColors).map(([priority, color]) => {
                    const count = ticketData[priority as keyof typeof priorityColors].count;
                    if (count === 0) return null;

                    return (
                      <UrgencyBadge
                        key={priority}
                        urgencyColor={color}
                        title={`${count} ${priorityLabels[priority as keyof typeof priorityLabels]} Priorität Tickets`}
                      >
                        {count}
                      </UrgencyBadge>
                    );
                  })}
                </Box>
              </Box>

              {/* Row 2: Machine description (left aligned) */}
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: 'text.primary',
                  textAlign: 'left'
                }}
              >
                {machine.equipment_description}
              </Typography>
            </MachineCard>
          );
        })}
          </Box>
        )}
      </Box>

      {/* Pagination */}
      <MachinePagination
        pagination={pagination}
        onPageChange={handleSetPagination}
        loading={loading}
      />
    </Box>
  );
};

export default MaschinenWidget; 