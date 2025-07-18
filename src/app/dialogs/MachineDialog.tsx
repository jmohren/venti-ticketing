import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, IconButton, Select, MenuItem, InputLabel, FormControl, Typography, List, ListItem, ListItemText } from '@mui/material';
import { Machine, Task } from '@/app/hooks/useMachines';
import AddIcon from '@mui/icons-material/Add';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (machine: Machine) => void;
  initial?: Machine | null;
}

const MachineDialog: React.FC<Props> = ({ open, onClose, onSave, initial }) => {
  const [name, setName] = useState(initial?.name || '');
  const [tasks, setTasks] = useState<Task[]>(initial?.tasks || []);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const handleSave = () => {
    if (!name.trim()) return;
    const machine: Machine = initial ? { ...initial, name, tasks } : { id: Date.now().toString(), name, tasks };
    onSave(machine);
    onClose();
  };

  const handleTaskSave = (task: Task) => {
    setTasks(prev => {
      if (editTask) return prev.map(t => t.id === task.id ? task : t);
      return [...prev, task];
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{initial ? 'Maschine bearbeiten' : 'Neue Maschine'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Machine name */}
          <TextField 
            label="Maschine Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            size="small" 
            fullWidth
            placeholder="z.B. Presse 1"
          />

          {/* Wartungsplan section */}
          <Box>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
              <Typography variant="subtitle1">Wartungsplan</Typography>
              <IconButton size="small" color="primary" onClick={()=>{ setEditTask(null); setTaskDialogOpen(true); }}><AddIcon fontSize="small" /></IconButton>
            </Box>
            {tasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Keine Aufgaben hinzugefügt.</Typography>
            ) : (
              <List dense>
                {tasks.map(t => (
                  <ListItem key={t.id} button onClick={()=>{ setEditTask(t); setTaskDialogOpen(true); }}>
                    <ListItemText primary={t.title} secondary={`Intervall: ${t.recurrence}`} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>Speichern</Button>
        </DialogActions>
      </Dialog>

      {/* Task Dialog */}
      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen}
          onClose={()=>setTaskDialogOpen(false)}
          onSave={handleTaskSave}
          initial={editTask}
        />
      )}
    </>
  );
};

/* Task Dialog Component */
interface TDProps { open:boolean; onClose:()=>void; onSave:(t:Task)=>void; initial:Task|null; }

const TaskDialog: React.FC<TDProps> = ({ open, onClose, onSave, initial }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [recurrence, setRecurrence] = useState<Task['recurrence']>(initial?.recurrence || 'daily');

  const handleSave = () => {
    if(!title.trim()) return;
    const task: Task = initial ? { ...initial, title, recurrence } : { id: Date.now().toString(), title, recurrence };
    onSave(task);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Aufgabe {initial ? 'bearbeiten' : 'hinzufügen'}</DialogTitle>
      <DialogContent sx={{ display:'flex', flexDirection:'column', gap:2 }}>
        <TextField label="Aufgabe" value={title} onChange={e=>setTitle(e.target.value)} size="small" fullWidth />
        <FormControl size="small" fullWidth>
          <InputLabel>Intervall</InputLabel>
          <Select value={recurrence} label="Intervall" onChange={e=>setRecurrence(e.target.value as any)}>
            <MenuItem value="daily">Täglich</MenuItem>
            <MenuItem value="weekly">Wöchentlich</MenuItem>
            <MenuItem value="yearly">Jährlich</MenuItem>
            <MenuItem value="custom">Benutzerdefiniert</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={handleSave} disabled={!title.trim()}>Speichern</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MachineDialog; 