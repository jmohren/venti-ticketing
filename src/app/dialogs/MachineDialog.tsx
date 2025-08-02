import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, IconButton, Select, MenuItem, InputLabel, FormControl, Typography, List, ListItem, ListItemText, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import { Machine, Task } from '@/app/hooks/useMachines';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (machine: Machine) => void;
  initial?: Machine | null;
}

const MachineDialog: React.FC<Props> = ({ open, onClose, onSave, initial }) => {
  const [name, setName] = useState(initial?.name || '');
  const [machineNumber, setMachineNumber] = useState(initial?.machineNumber || '');
  const [tasks, setTasks] = useState<Task[]>(initial?.tasks || []);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Update state when initial data changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setMachineNumber(initial?.machineNumber || '');
      setTasks(initial?.tasks || []);
      setTaskDialogOpen(false);
      setEditTask(null);
    }
  }, [open, initial]);

  const handleSave = () => {
    if (!name.trim() || !machineNumber.trim()) return;
    const machine: Machine = initial ? { ...initial, name, machineNumber, tasks } : { id: Date.now().toString(), name, machineNumber, tasks };
    onSave(machine);
    onClose();
  };

  const handleTaskSave = (task: Task) => {
    setTasks(prev => {
      if (editTask) return prev.map(t => t.id === task.id ? task : t);
      return [...prev, task];
    });
    setTaskDialogOpen(false);
    setEditTask(null);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
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

          {/* Machine number */}
          <TextField 
            label="Maschinen Nummer" 
            value={machineNumber} 
            onChange={e => setMachineNumber(e.target.value)} 
            size="small" 
            fullWidth
            placeholder="z.B. M-001"
          />

          {/* Wartungsplan section */}
          <Box>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
              <Typography variant="subtitle1">Wartungsplan</Typography>
              <IconButton size="small" color="primary" onClick={()=>{ setEditTask(null); setTaskDialogOpen(true); }}><AddIcon fontSize="small" /></IconButton>
            </Box>
            {tasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Keine Wartungsaufgaben hinzugefügt.</Typography>
            ) : (
              <List dense>
                {tasks.map(t => (
                  <ListItem key={t.id} sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemText 
                      primary={t.title} 
                      secondary={`${t.recurrence === 'daily' ? 'Täglich' : 
                                  t.recurrence === 'weekly' ? 'Wöchentlich' : 
                                  t.recurrence === 'monthly' ? 'Monatlich' : 'Jährlich'} - alle ${t.interval} ${
                                  t.recurrence === 'daily' ? 'Tag(e)' : 
                                  t.recurrence === 'weekly' ? 'Woche(n)' : 
                                  t.recurrence === 'monthly' ? 'Monat(e)' : 'Jahr(e)'}`} 
                    />
                    <IconButton size="small" onClick={()=>{ setEditTask(t); setTaskDialogOpen(true); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={()=>handleTaskDelete(t.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained" disabled={!name.trim() || !machineNumber.trim()}>Speichern</Button>
        </DialogActions>
      </Dialog>

      {/* Task Dialog */}
      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen}
          onClose={()=>{setTaskDialogOpen(false); setEditTask(null);}}
          onSave={handleTaskSave}
          initial={editTask}
        />
      )}
    </>
  );
};

// Enhanced Task Dialog Component for recurring maintenance tasks
interface TaskDialogProps { 
  open: boolean; 
  onClose: () => void; 
  onSave: (task: Task) => void; 
  initial: Task | null; 
}

const TaskDialog: React.FC<TaskDialogProps> = ({ open, onClose, onSave, initial }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [startDate, setStartDate] = useState<Date>(initial?.startDate ? new Date(initial.startDate) : new Date());
  const [recurrence, setRecurrence] = useState<Task['recurrence']>(initial?.recurrence || 'weekly');
  const [interval, setInterval] = useState(initial?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initial?.daysOfWeek || [1]); // Default to Monday
  const [dayOfMonth, setDayOfMonth] = useState(initial?.dayOfMonth || 1);
  const [month, setMonth] = useState(initial?.month || 1);
  const [endDate, setEndDate] = useState<Date | null>(initial?.endDate ? new Date(initial.endDate) : null);
  const [hasEndDate, setHasEndDate] = useState(!!initial?.endDate);

  const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  const handleDayToggle = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = () => {
    if (!title.trim()) return;
    if (recurrence === 'weekly' && daysOfWeek.length === 0) return;
    
    const task: Task = {
      id: initial?.id || Date.now().toString(),
      title,
      startDate: startDate.toISOString(),
      recurrence,
      interval,
      daysOfWeek: recurrence === 'weekly' ? daysOfWeek : undefined,
      dayOfMonth: recurrence === 'monthly' || recurrence === 'yearly' ? dayOfMonth : undefined,
      month: recurrence === 'yearly' ? month : undefined,
      endDate: hasEndDate && endDate ? endDate.toISOString() : undefined,
    };
    
    onSave(task);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Wartungsaufgabe {initial ? 'bearbeiten' : 'hinzufügen'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {/* Task Title */}
          <TextField 
            label="Aufgabe" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            size="small" 
            fullWidth 
            placeholder="z.B. Ölwechsel, Filter ersetzen"
          />

          {/* Start Date */}
          <DatePicker
            label="Startdatum"
            value={startDate}
            onChange={(date) => date && setStartDate(date)}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />

          {/* Recurrence Type */}
          <FormControl size="small" fullWidth>
            <InputLabel>Wiederholung</InputLabel>
            <Select value={recurrence} label="Wiederholung" onChange={e => setRecurrence(e.target.value as Task['recurrence'])}>
              <MenuItem value="daily">Täglich</MenuItem>
              <MenuItem value="weekly">Wöchentlich</MenuItem>
              <MenuItem value="monthly">Monatlich</MenuItem>
              <MenuItem value="yearly">Jährlich</MenuItem>
            </Select>
          </FormControl>

          {/* Interval */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Alle"
              type="number"
              value={interval}
              onChange={e => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
              size="small"
              sx={{ width: 100 }}
              inputProps={{ min: 1 }}
            />
            <Typography variant="body2">
              {recurrence === 'daily' ? 'Tag(e)' : 
               recurrence === 'weekly' ? 'Woche(n)' : 
               recurrence === 'monthly' ? 'Monat(e)' : 'Jahr(e)'}
            </Typography>
          </Box>

          {/* Days of Week (for weekly) */}
          {recurrence === 'weekly' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>An folgenden Wochentagen:</Typography>
              <FormGroup row>
                {dayLabels.map((label, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={daysOfWeek.includes(index)}
                        onChange={() => handleDayToggle(index)}
                        size="small"
                      />
                    }
                    label={label}
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {/* Day of Month (for monthly/yearly) */}
          {(recurrence === 'monthly' || recurrence === 'yearly') && (
            <TextField
              label="Tag des Monats"
              type="number"
              value={dayOfMonth}
              onChange={e => setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
              size="small"
              inputProps={{ min: 1, max: 31 }}
            />
          )}

          {/* Month (for yearly) */}
          {recurrence === 'yearly' && (
            <FormControl size="small" fullWidth>
              <InputLabel>Monat</InputLabel>
              <Select value={month} label="Monat" onChange={e => setMonth(e.target.value as number)}>
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {new Date(2024, i, 1).toLocaleDateString('de-DE', { month: 'long' })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* End Date */}
          <FormControlLabel
            control={
              <Checkbox
                checked={hasEndDate}
                onChange={e => setHasEndDate(e.target.checked)}
              />
            }
            label="Enddatum festlegen"
          />

          {hasEndDate && (
            <DatePicker
              label="Enddatum"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={!title.trim() || (recurrence === 'weekly' && daysOfWeek.length === 0)}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default MachineDialog; 