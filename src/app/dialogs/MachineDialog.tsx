import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, IconButton, Select, MenuItem, InputLabel, FormControl, Typography, List, ListItem, ListItemText, Checkbox, FormControlLabel, FormGroup, Tabs, Tab, Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import { Machine, Task } from '@/app/state/MachineProvider';
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
  // Basic fields
  const [equipmentDescription, setEquipmentDescription] = useState(initial?.equipment_description || '');
  const [equipmentNumber, setEquipmentNumber] = useState(initial?.equipment_number || '');
  const [tasks, setTasks] = useState<Task[]>(initial?.tasks || []);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  
  // Expanded fields
  const [equipmentType, setEquipmentType] = useState(initial?.equipment_type || '');
  const [location, setLocation] = useState(initial?.location || '');
  const [sortField, setSortField] = useState(initial?.sort_field || '');
  const [manufacturerSerialNumber, setManufacturerSerialNumber] = useState(initial?.manufacturer_serial_number || '');
  const [workplace, setWorkplace] = useState(initial?.work_station || '');
  const [typeDesignation, setTypeDesignation] = useState(initial?.type_designation || '');
  const [manufacturerPartNumber, setManufacturerPartNumber] = useState(initial?.manufacturer_part_number || '');
  const [constructionYear, setConstructionYear] = useState<number | undefined>(initial?.construction_year);
  const [sizeDimensions, setSizeDimensions] = useState(initial?.size_dimensions || '');
  const [manufacturer, setManufacturer] = useState(initial?.manufacturer || '');
  const [abcClassification, setAbcClassification] = useState<'A' | 'B' | 'C' | 'D' | ''>(initial?.abc_classification || '');
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Update state when initial data changes or dialog opens
  useEffect(() => {
    if (open) {
      // Basic fields
      setEquipmentDescription(initial?.equipment_description || '');
      setEquipmentNumber(initial?.equipment_number || '');
      setTasks(initial?.tasks || []);
      setTaskDialogOpen(false);
      setEditTask(null);
      
      // Expanded fields
      setEquipmentType(initial?.equipment_type || '');
      setLocation(initial?.location || '');
      setSortField(initial?.sort_field || '');
      setManufacturerSerialNumber(initial?.manufacturer_serial_number || '');
      setWorkplace(initial?.work_station || '');
      setTypeDesignation(initial?.type_designation || '');
      setManufacturerPartNumber(initial?.manufacturer_part_number || '');
      setConstructionYear(initial?.construction_year);
      setSizeDimensions(initial?.size_dimensions || '');
      setManufacturer(initial?.manufacturer || '');
      setAbcClassification(initial?.abc_classification || '');
      
      // Reset tab to first
      setTabValue(0);
    }
  }, [open, initial]);

  const handleSave = () => {
    if (!equipmentDescription.trim() || !equipmentNumber.trim()) return;
    
    const machine: Machine = {
      ...(initial || { equipment_number: equipmentNumber }),
      equipment_description: equipmentDescription,
      equipment_number: equipmentNumber,
      tasks,
      equipment_type: equipmentType || undefined,
      location: location || undefined,
      sort_field: sortField || undefined,
      manufacturer_serial_number: manufacturerSerialNumber || undefined,
      work_station: workplace || undefined,
      type_designation: typeDesignation || undefined,
      manufacturer_part_number: manufacturerPartNumber || undefined,
      construction_year: constructionYear || undefined,
      size_dimensions: sizeDimensions || undefined,
      manufacturer: manufacturer || undefined,
      abc_classification: abcClassification || undefined,
    };
    
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
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{initial ? 'Maschine bearbeiten' : 'Neue Maschine'}</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Grunddaten" />
            <Tab label="Technische Daten" />
            <Tab label="Wartungsplan" />
          </Tabs>
          
          <Box sx={{ p: 3 }}>
            {/* Tab 0: Basic Information */}
            {tabValue === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Name" 
                    value={equipmentDescription} 
                    onChange={e => setEquipmentDescription(e.target.value)} 
                    size="small" 
                    fullWidth
                    required
                    placeholder="z.B. BBM Tafelblechschere"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Equipment Nummer" 
                    value={equipmentNumber} 
                    onChange={e => setEquipmentNumber(e.target.value)} 
                    size="small" 
                    fullWidth
                    required
                    placeholder="z.B. 101"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Equipmenttyp" 
                    value={equipmentType} 
                    onChange={e => setEquipmentType(e.target.value)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. TS-H3050-16"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Sortierfeld" 
                    value={sortField} 
                    onChange={e => setSortField(e.target.value)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. 3311"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Standort" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. Halle A"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Arbeitsplatz" 
                    value={workplace} 
                    onChange={e => setWorkplace(e.target.value)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. AP-001"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Sortierfeld" 
                    value={sortField} 
                    onChange={e => setSortField(e.target.value)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. 3311"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>ABC-Klassifizierung</InputLabel>
                    <Select value={abcClassification} label="ABC-Klassifizierung" onChange={e => setAbcClassification(e.target.value as any)}>
                      <MenuItem value="">Keine</MenuItem>
                      <MenuItem value="A">A - Hoch</MenuItem>
                      <MenuItem value="B">B - Mittel</MenuItem>
                      <MenuItem value="C">C - Niedrig</MenuItem>
                      <MenuItem value="D">D - Sonstige</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>


              </Grid>
            )}

            {/* Tab 1: Technical Data */}
            {tabValue === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Hersteller" 
                    value={manufacturer} 
                    onChange={e => setManufacturer(e.target.value)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. BBM Braunschweig"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Typ Bezeichnung" 
                    value={typeDesignation} 
                    onChange={e => setTypeDesignation(e.target.value)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. TS-H3050-16"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Hersteller Seriennummer" 
                    value={manufacturerSerialNumber} 
                    onChange={e => setManufacturerSerialNumber(e.target.value)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. 0007"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Hersteller Teilnummer" 
                    value={manufacturerPartNumber} 
                    onChange={e => setManufacturerPartNumber(e.target.value)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. FV D500-D3600-16-T60"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Baujahr" 
                    type="number"
                    value={constructionYear || ''} 
                    onChange={e => setConstructionYear(e.target.value ? parseInt(e.target.value) : undefined)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. 2004"
                    inputProps={{ min: 1900, max: new Date().getFullYear() + 5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Größe/Abmessungen" 
                    value={sizeDimensions} 
                    onChange={e => setSizeDimensions(e.target.value)} 
                    size="small" 
                    fullWidth
                    placeholder="z.B. 3000x1500x2000mm"
                  />
                </Grid>
              </Grid>
            )}

            {/* Tab 2: Maintenance Plan */}
            {tabValue === 2 && (
              <Box>
                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                  <Typography variant="h6">Wartungsplan</Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={()=>{ setEditTask(null); setTaskDialogOpen(true); }}
                    variant="contained"
                  >
                    Aufgabe hinzufügen
                  </Button>
                </Box>
                {tasks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">Keine Wartungsaufgaben hinzugefügt.</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Klicken Sie auf "Aufgabe hinzufügen" um eine neue Wartungsaufgabe zu erstellen.
                    </Typography>
                  </Box>
                ) : (
                  <List dense>
                    {tasks.map(t => (
                      <ListItem key={t.id} sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
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
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained" disabled={!equipmentDescription.trim() || !equipmentNumber.trim()}>Speichern</Button>
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
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(initial?.recurrence || 'weekly');
  const [interval, setInterval] = useState(initial?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initial?.daysOfWeek || [1]);
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
            <Select value={recurrence} label="Wiederholung" onChange={e => setRecurrence(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}>
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