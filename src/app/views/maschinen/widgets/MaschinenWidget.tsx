import React, { useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useMachines } from '@/app/hooks/useMachines';
import { useTickets } from '@/app/hooks/useTickets';

const MachineCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
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

const MachineHeader = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
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
  const { machines } = useMachines();
  const { tickets } = useTickets();

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
        ticket.machine === machine.name && 
        ticket.status !== 'done' && 
        ticket.status !== 'archived'
      );

      acc[machine.name] = {
        rot: { count: machineTickets.filter(t => t.priority === 'rot').length },
        gelb: { count: machineTickets.filter(t => t.priority === 'gelb').length },
        gruen: { count: machineTickets.filter(t => t.priority === 'gruen').length }
      };

      return acc;
    }, {} as Record<string, { rot: { count: number }, gelb: { count: number }, gruen: { count: number } }>);
  }, [machines, tickets]);

  const handleMachineClick = (machine: any) => {
    console.log('Machine clicked:', machine.name);
    // TODO: Navigate to machine detail or open machine dialog
  };

  if (!machines) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Laden...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        height: '100%',
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
          const ticketData = machineTicketData[machine.name] || { rot: { count: 0 }, gelb: { count: 0 }, gruen: { count: 0 } };

          return (
            <MachineCard 
              elevation={1}
              onClick={() => handleMachineClick(machine)}
              key={machine.id}
            >
              <MachineHeader>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      color: 'text.primary'
                    }}
                  >
                    {machine.name}
                  </Typography>
                  <Chip
                    label={machine.machineNumber}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
                
                {/* Urgency badges in top right */}
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
              </MachineHeader>


            </MachineCard>
          );
        })}
      </Box>
    </Box>
  );
};

export default MaschinenWidget; 