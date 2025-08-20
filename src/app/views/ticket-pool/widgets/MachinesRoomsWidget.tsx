import React, { useState, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Chip,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useMachines, Machine, MachineBasic, MachineFilters as MachineFiltersType, MachinePagination as MachinePaginationType } from '@/app/hooks/useMachines';
import MachineDialog from '@/app/dialogs/MachineDialog';
import MachinePagination from '@/app/components/MachinePagination';

interface Props {
  onSelect?: (machine: Machine) => void;
  selectedId?: string;
}

// Styled components matching existing table design patterns
const MachineListHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  borderBottom: `2px solid ${theme.palette.grey[300]}`,
  padding: '12px 16px',
  fontWeight: 'bold',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  padding: '12px 16px',
  borderRadius: 0,
  margin: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
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

const MachineItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
});

const MachinesRoomsWidget: React.FC<Props> = ({ onSelect, selectedId }) => {
  const { 
    loadMachines,
    addMachine, 
    updateMachine, 
    deleteMachine, 
    getMachine 
  } = useMachines();
  
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
  const [machineDialogOpen, setMachineDialogOpen] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<MachineBasic | null>(null);

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

  const handleMachineSelect = (machine: MachineBasic) => {
    onSelect?.(machine as Machine); // Cast for compatibility with existing interface
  };

  const handleAddMachine = () => {
    setEditMachine(null);
    setMachineDialogOpen(true);
  };

  const handleEditMachine = async (machine: MachineBasic) => {
    // Open dialog immediately with basic data
    setEditMachine(machine as Machine);
    setMachineDialogOpen(true);
    
    try {
      // Load full machine data in the background
      const fullMachineData = await getMachine(machine.equipment_number);
      setEditMachine(fullMachineData);
    } catch (error) {
      console.error('Failed to load machine data for editing:', error);
      // Keep the basic machine data that's already set
    }
  };

  const handleDeleteMachine = (machine: MachineBasic) => {
    setMachineToDelete(machine);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!machineToDelete) return;
    
    try {
      await deleteMachine(machineToDelete.equipment_number);
      setDeleteDialogOpen(false);
      setMachineToDelete(null);
    } catch (error) {
      console.error('Error deleting machine:', error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setMachineToDelete(null);
  };

  const handleMachineSave = (machine: Machine) => {
    if (editMachine) {
      updateMachine(machine.equipment_number, machine);
    } else {
      addMachine(machine);
    }
    setMachineDialogOpen(false);
    setEditMachine(null);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with search and add button */}
      <Paper sx={{ border: 1, borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <MachineListHeader sx={{ gap: 1 }}>
          <TextField
            size="small"
            placeholder="Maschinen durchsuchen..."
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
              minWidth: 0,
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
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddMachine}
            variant="contained"
            sx={{ 
              minWidth: 'auto',
              height: '40px'
            }}
          >
            Hinzufügen
          </Button>
        </MachineListHeader>

        {/* Machine List */}
        {loading ? (
          <Box sx={{ textAlign: 'center', mt: 4, p: 2 }}>
            <Typography color="text.secondary">
              Maschinen werden geladen...
            </Typography>
          </Box>
        ) : machines.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, p: 2 }}>
            <Typography color="text.secondary">
              Keine Maschinen gefunden
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Verwenden Sie die Filter oder klicken Sie auf "Hinzufügen"
            </Typography>
          </Box>
        ) : (
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {machines.map((machine) => {
              const isSelected = selectedId === machine.equipment_number;
              // Task count not available in MachineBasic, would need separate query
              const taskCount = 0;
              
              return (
                <ListItem key={machine.equipment_number} disablePadding>
                  <StyledListItemButton
                    selected={isSelected}
                    onClick={() => handleMachineSelect(machine)}
                  >
                    <MachineItem>
                      <Box sx={{ flex: 1 }}>
                        <ListItemText
                          sx={{ my: 0 }}
                          disableTypography
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0 }}>
                              <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'} sx={{ m: 0 }}>
                                {machine.equipment_description}
              </Typography>
                              <Chip
                                label={machine.equipment_number}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 15,
                                  color: 'primary.main',
                                  borderColor: 'primary.main',
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={`${taskCount} Wartungsaufgaben`}
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
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                            handleEditMachine(machine);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                            handleDeleteMachine(machine);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      </Box>
                  </MachineItem>
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

      {/* Machine Dialog */}
      <MachineDialog
        open={machineDialogOpen}
        onClose={() => {
          setMachineDialogOpen(false);
          setEditMachine(null);
        }}
        initial={editMachine}
        onSave={handleMachineSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Maschine löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie die Maschine <strong>{machineToDelete?.equipment_description}</strong> löschen möchten?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MachinesRoomsWidget; 