import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  IconButton, 
  Collapse, 
  List, 
  ListItem, 
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useMachines, Machine, Room } from '@/app/hooks/useMachines';
import MachineDialog from '@/app/dialogs/MachineDialog';
import AddIcon from '@mui/icons-material/Add';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import MemoryIcon from '@mui/icons-material/Memory';

const RoomCard = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: 8,
  overflow: 'hidden',
}));

const RoomHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.grey[50],
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
  },
}));

const MachineItem = styled(ListItem)<{ selected?: boolean }>(({ theme, selected }) => ({
  paddingLeft: theme.spacing(4),
  borderLeft: selected ? `4px solid ${theme.palette.primary.main}` : `4px solid transparent`,
  backgroundColor: selected ? theme.palette.action.selected : undefined,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

interface Props {
  onSelect?: (machine: Machine & { roomId: string }) => void;
  selectedId?: string;
}

const MachinesRoomsWidget: React.FC<Props> = ({ onSelect, selectedId }) => {
  const { 
    rooms, 
    addRoom, 
    updateRoom, 
    deleteRoom,
    addMachine, 
    updateMachine, 
    deleteMachine 
  } = useMachines();
  
  const [search, setSearch] = useState('');
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(['r1', 'r2'])); // Default expanded
  
  // Room dialog state
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  
  // Machine dialog state
  const [machineDialogOpen, setMachineDialogOpen] = useState(false);
  const [editMachine, setEditMachine] = useState<{ machine: Machine; roomId: string } | null>(null);
  const [selectedRoomForNewMachine, setSelectedRoomForNewMachine] = useState<string | null>(null);

  // Filter rooms and machines based on search
  const filteredRooms = rooms.map(room => ({
    ...room,
    machines: room.machines.filter(machine => 
      machine.name.toLowerCase().includes(search.toLowerCase()) ||
      room.name.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(room => 
    room.name.toLowerCase().includes(search.toLowerCase()) ||
    room.machines.length > 0
  );

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const handleMachineSelect = (machine: Machine, roomId: string) => {
    onSelect?.({ ...machine, roomId });
  };

  const handleAddRoom = () => {
    setEditRoom(null);
    setRoomDialogOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditRoom(room);
    setRoomDialogOpen(true);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (window.confirm('Raum und alle enthaltenen Maschinen löschen?')) {
      deleteRoom(roomId);
    }
  };

  const handleAddMachine = (roomId: string) => {
    setEditMachine(null);
    setSelectedRoomForNewMachine(roomId);
    setMachineDialogOpen(true);
  };

  const handleEditMachine = (machine: Machine, roomId: string) => {
    setEditMachine({ machine, roomId });
    setSelectedRoomForNewMachine(null);
    setMachineDialogOpen(true);
  };

  const handleDeleteMachine = (roomId: string, machineId: string) => {
    if (window.confirm('Maschine löschen?')) {
      deleteMachine(roomId, machineId);
    }
  };

  const handleRoomSave = (roomData: { name: string }) => {
    if (editRoom) {
      updateRoom(editRoom.id, { name: roomData.name });
    } else {
      addRoom({ 
        id: Date.now().toString(), 
        name: roomData.name, 
        machines: [] 
      });
    }
    setRoomDialogOpen(false);
  };

  const handleMachineSave = (machine: Machine) => {
    if (editMachine) {
      updateMachine(editMachine.roomId, machine.id, machine);
    } else if (selectedRoomForNewMachine) {
      addMachine(selectedRoomForNewMachine, machine);
    }
    setMachineDialogOpen(false);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TextField 
          size="small" 
          placeholder="Suchen..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          fullWidth 
        />
        <IconButton 
          color="primary" 
          onClick={handleAddRoom}
          title="Neuer Raum"
        >
          <AddIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredRooms.map(room => (
          <RoomCard key={room.id}>
            <RoomHeader onClick={() => toggleRoom(room.id)}>
              <FolderIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography fontWeight={600} sx={{ flex: 1 }}>
                {room.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                {room.machines.length} Maschinen
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddMachine(room.id);
                }}
                title="Maschine hinzufügen"
              >
                <AddIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditRoom(room);
                }}
                title="Raum bearbeiten"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRoom(room.id);
                }}
                title="Raum löschen"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              {expandedRooms.has(room.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </RoomHeader>
            
            <Collapse in={expandedRooms.has(room.id)}>
              <List disablePadding>
                {room.machines.map(machine => (
                  <MachineItem
                    key={machine.id}
                    selected={machine.id === selectedId}
                    onClick={() => handleMachineSelect(machine, room.id)}
                  >
                    <MemoryIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText primary={machine.name} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMachine(machine, room.id);
                        }}
                        title="Maschine bearbeiten"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMachine(room.id, machine.id);
                        }}
                        title="Maschine löschen"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </MachineItem>
                ))}
                {room.machines.length === 0 && (
                  <ListItem sx={{ pl: 4 }}>
                    <ListItemText 
                      primary="Keine Maschinen" 
                      secondary="Klicken Sie auf + um eine Maschine hinzuzufügen"
                    />
                  </ListItem>
                )}
              </List>
            </Collapse>
          </RoomCard>
        ))}
        
        {filteredRooms.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography color="text.secondary">
              {search ? 'Keine Ergebnisse gefunden' : 'Keine Räume vorhanden'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Room Dialog */}
      <Dialog open={roomDialogOpen} onClose={() => setRoomDialogOpen(false)} maxWidth="sm" fullWidth>
        <RoomDialog
          room={editRoom}
          onSave={handleRoomSave}
          onCancel={() => setRoomDialogOpen(false)}
        />
      </Dialog>

      {/* Machine Dialog */}
      <MachineDialog
        open={machineDialogOpen}
        onClose={() => setMachineDialogOpen(false)}
        initial={editMachine?.machine || null}
        onSave={handleMachineSave}
      />
    </Box>
  );
};

// Simple Room Dialog Component
interface RoomDialogProps {
  room: Room | null;
  onSave: (data: { name: string }) => void;
  onCancel: () => void;
}

const RoomDialog: React.FC<RoomDialogProps> = ({ room, onSave, onCancel }) => {
  const [name, setName] = useState(room?.name || '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim() });
  };

  return (
    <>
      <DialogTitle>
        {room ? 'Raum bearbeiten' : 'Neuer Raum'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Raum Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Werk 1 – Raum 101"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Abbrechen</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          Speichern
        </Button>
      </DialogActions>
    </>
  );
};

export default MachinesRoomsWidget; 