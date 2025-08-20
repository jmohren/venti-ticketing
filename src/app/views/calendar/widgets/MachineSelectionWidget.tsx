import React, { useState, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Typography,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { useTickets } from '@/app/hooks/useTickets';
import { useMachines, MachineBasic, MachineFilters as MachineFiltersType, MachinePagination as MachinePaginationType } from '@/app/hooks/useMachines';
import MachinePagination from '@/app/components/MachinePagination';

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
  onMachineSelect: (machineNumber: string | null) => void;
}

const MachineSelectionWidget: React.FC<MachineSelectionWidgetProps> = ({ 
  selectedMachine, 
  onMachineSelect 
}) => {
  const { tickets } = useTickets();
  const { loadMachines } = useMachines();

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
  const [searchTerm, setSearchTerm] = useState('');

  // Load machines function
  const searchMachines = async () => {
    try {
      setLoading(true);
      const newFilters = { search: searchTerm.trim() || undefined };
      setFilters(newFilters);
      const result = await loadMachines(newFilters, 0);
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

  // Count tickets per machine (using equipment_description to match tickets)
  const getTicketCount = (machineDescription: string) => {
    return tickets.filter(ticket => ticket.machine === machineDescription).length;
  };

  const handleMachineSelect = (machine: MachineBasic) => {
    const isCurrentlySelected = selectedMachine === machine.equipment_number;
    onMachineSelect(isCurrentlySelected ? null : machine.equipment_number);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderColor: 'divider' }}>
        <MachineListHeader sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Suche nach Name oder Nummer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMachines()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white'
              }
            }}
          />
          <Button
            size="small"
            onClick={searchMachines}
            variant="outlined"
            disabled={loading}
            sx={{ 
              minWidth: 80,
              height: '40px'
            }}
          >
            Suchen
          </Button>
        </MachineListHeader>
        
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Maschinen werden geladen...
            </Typography>
          </Box>
        ) : machines.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Keine Maschinen gefunden
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Verwenden Sie die Filter oder "Suchen" Button
            </Typography>
          </Box>
        ) : (
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {machines.map((machine) => {
            const ticketCount = getTicketCount(machine.equipment_description);
            const isSelected = selectedMachine === machine.equipment_number;
            
            return (
              <ListItem key={machine.equipment_number} disablePadding sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <StyledListItemButton
                  selected={isSelected}
                  onClick={() => handleMachineSelect(machine)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'}>
                          {machine.equipment_description}
                        </Typography>
                        <Chip
                          label={machine.equipment_number}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 18,
                            minWidth: 'auto',
                            color: 'primary.main',
                            borderColor: 'primary.main',
                          }}
                        />
                      </Box>
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

      {/* Pagination */}
      <MachinePagination
        pagination={pagination}
        onPageChange={handleSetPagination}
        loading={loading}
      />
    </Box>
  );
};

export default MachineSelectionWidget; 