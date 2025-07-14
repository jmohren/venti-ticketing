import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useMachines, Machine } from '@/core/hooks/useMachines';
import MachineDialog from '@/app/views/konfiguration/dialogs/MachineDialog';
import AddIcon from '@mui/icons-material/Add';

const Card = styled(Paper)<{ selected?: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderRadius: 8,
  cursor: 'pointer',
  borderLeft: selected ? `4px solid ${theme.palette.primary.main}` : `4px solid transparent`,
  backgroundColor: selected ? theme.palette.action.selected : undefined,
}));

interface Props {
  onSelect: (machine: Machine) => void;
  selectedId?: string;
}

const MachinesRoomsWidget: React.FC<Props> = ({ onSelect, selectedId }) => {
  const { machines, addMachine, updateMachine } = useMachines();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);

  const filtered = machines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
        <TextField size="small" placeholder="Suchen..." value={search} onChange={e=>setSearch(e.target.value)} fullWidth />
        <IconButton color="primary" onClick={()=>{ setEditMachine(null); setDialogOpen(true); }}><AddIcon/></IconButton>
      </Box>
      <Box sx={{ flex:1, overflowY:'auto' }}>
        {filtered.map(m => (
          <Card key={m.id} selected={m.id===selectedId}
            onClick={()=>onSelect(m)}
            onDoubleClick={()=>{ setEditMachine(m); setDialogOpen(true); }}
          >
            <Typography fontWeight={600}>{m.name}</Typography>
            <Typography variant="body2" color="text.secondary">{m.room}</Typography>
          </Card>
        ))}
      </Box>

      <MachineDialog
        open={dialogOpen}
        onClose={()=>setDialogOpen(false)}
        initial={editMachine}
        onSave={(machine)=>{
          if(editMachine) updateMachine(machine.id, machine);
          else addMachine(machine);
        }}
      />
    </Box>
  );
};

export default MachinesRoomsWidget; 