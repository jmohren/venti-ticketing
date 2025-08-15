import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment,
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMachines, Machine } from '@/app/hooks/useMachines';
import MachineDialog from '@/app/dialogs/MachineDialog';

interface Props {
  onSelect?: (machine: Machine) => void;
  selectedId?: number;
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
  const { machines, addMachine, updateMachine, deleteMachine } = useMachines();
  
  const [search, setSearch] = useState('');
  const [machineDialogOpen, setMachineDialogOpen] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);

  // Filter machines based on search
  const filteredMachines = machines.filter(machine => 
      machine.name.toLowerCase().includes(search.toLowerCase()) ||
    machine.machineNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleMachineSelect = (machine: Machine) => {
    onSelect?.(machine);
  };

  const handleAddMachine = () => {
    setEditMachine(null);
    setMachineDialogOpen(true);
  };

  const handleEditMachine = (machine: Machine) => {
    setEditMachine(machine);
    setMachineDialogOpen(true);
  };

  const handleDeleteMachine = (machine: Machine) => {
    setMachineToDelete(machine);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!machineToDelete) return;
    
    try {
      await deleteMachine(machineToDelete.id);
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
      updateMachine(machine.id, machine);
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 0 }}
          />
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddMachine}
            variant="contained"
            sx={{ minWidth: 'auto' }}
          >
            Hinzufügen
          </Button>
        </MachineListHeader>

        {/* Machine List */}
        {filteredMachines.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, p: 2 }}>
            <Typography color="text.secondary">
              {search ? 'Keine Maschinen gefunden' : 'Keine Maschinen verfügbar'}
            </Typography>
            {!search && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Klicken Sie auf "Hinzufügen" um eine neue Maschine zu erstellen
              </Typography>
            )}
          </Box>
        ) : (
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {filteredMachines.map((machine) => {
              const isSelected = selectedId === machine.id;
              const taskCount = machine.tasks?.length || 0;
              
              return (
                <ListItem key={machine.id} disablePadding>
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
                                {machine.name}
              </Typography>
                              <Chip
                                label={machine.machineNumber}
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
            Sind Sie sicher, dass Sie die Maschine <strong>{machineToDelete?.name}</strong> löschen möchten?
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