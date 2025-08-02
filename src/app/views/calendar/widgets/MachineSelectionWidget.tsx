import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Typography,
  Chip,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTickets } from '@/app/hooks/useTickets';
import { useMachines } from '@/app/hooks/useMachines';

// Styled components matching table design patterns
const MachineListHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  borderBottom: `2px solid ${theme.palette.grey[300]}`,
  padding: '8px 16px',
  fontWeight: 'bold',
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  padding: '8px 16px',
  borderRadius: 0,
  margin: 0,
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  '&.Mui-selected': {
    backgroundColor: `${theme.palette.primary.light}20`,
    '&:hover': {
      backgroundColor: `${theme.palette.primary.light}30`,
    },
  },
}));

interface MachineSelectionWidgetProps {
  selectedMachine: string | null;
  onMachineSelect: (machine: string | null) => void;
}

const MachineSelectionWidget: React.FC<MachineSelectionWidgetProps> = ({ 
  selectedMachine, 
  onMachineSelect 
}) => {
  const { tickets } = useTickets();
  const { machines } = useMachines();

  // Get all machines from database
  const machineNames = React.useMemo(() => {
    return machines.map(machine => machine.name).sort();
  }, [machines]);

  // Count tickets per machine
  const getTicketCount = (machine: string) => {
    return tickets.filter(ticket => ticket.machine === machine).length;
  };

  const handleMachineSelect = (machine: string) => {
    onMachineSelect(machine === selectedMachine ? null : machine);
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderColor: 'divider' }}>
      <MachineListHeader>
        <Typography variant="subtitle2" fontWeight="bold">
          Maschinen
        </Typography>
      </MachineListHeader>
      
      {machineNames.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Keine Maschinen gefunden
          </Typography>
        </Box>
      ) : (
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {machineNames.map((machine) => {
            const ticketCount = getTicketCount(machine);
            const isSelected = selectedMachine === machine;
            
            return (
              <ListItem key={machine} disablePadding sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <StyledListItemButton
                  selected={isSelected}
                  onClick={() => handleMachineSelect(machine)}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'}>
                        {machine}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={`${ticketCount} Tickets`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 18,
                            color: 'text.secondary',
                            borderColor: 'text.secondary',
                          }}
                        />
                      </Box>
                    }
                  />
                </StyledListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
};

export default MachineSelectionWidget; 