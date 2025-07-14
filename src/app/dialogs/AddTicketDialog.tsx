import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useAuth } from '@/core/hooks/useAuth';
import { IconButton } from '@mui/material';
import { CloudUpload, Delete, ZoomIn, Clear, ExpandMore, ContentCopy } from '@mui/icons-material';
import { TicketEvent } from '@/app/hooks/useTickets';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useMachines } from '@/app/hooks/useMachines';
import { useTechnicians } from '@/app/hooks/useTechnicians';

interface TicketData {
  machine?: string;
  description?: string;
  priority?: 'rot' | 'gelb' | 'gruen';
  location?: string;
  status?: 'backlog' | 'progress' | 'done';
  responsible?: string;
  events?: TicketEvent[];
  plannedCompletion?: string | null;
}

interface AddTicketDialogProps {
  open: boolean;
  onClose: () => void;
  readOnly?: boolean;
  initialData?: TicketData;
  showStatus?: boolean;
  onSave?: (data: TicketData) => void;
  allowResponsibleEdit?: boolean;
  allowPlanEdit?: boolean;
  ticketId?: number;
}

/**
 * Minimal dialog for creating a maintenance ticket.
 * The full form will be expanded later – for now we only collect
 * a short description and priority so that we can wire up the workflow.
 */
const AddTicketDialog: React.FC<AddTicketDialogProps> = ({ open, onClose, readOnly = false, initialData, showStatus = false, onSave, allowResponsibleEdit = false, allowPlanEdit = false, ticketId }) => {
  const { getCurrentUser } = useAuth();
  const { rooms } = useMachines();
  const { getTechnicianNames } = useTechnicians();

  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<'rot' | 'gelb' | 'gruen'>(initialData?.priority || 'rot');
  const [location, setLocation] = useState(initialData?.location || '');
  const [machine, setMachine] = useState(initialData?.machine || '');
  const [responsible, setResponsible] = useState(initialData?.responsible || '');
  const [plannedDate, setPlannedDate] = useState<Date | null>(initialData?.plannedCompletion ? new Date(initialData.plannedCompletion) : null);

  // Image upload state (allow up to 3 images)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Copy URL state
  const [copyButtonText, setCopyButtonText] = useState('Link kopieren');

  const previewItems = selectedFiles.map(file => URL.createObjectURL(file));

  const canSelectMore = !readOnly && selectedFiles.length < 3;

  // Get location options from rooms
  const locationOptions = rooms.map(room => room.name);

  // Get machines for selected location
  const availableMachines = useMemo(() => {
    const selectedRoom = rooms.find(room => room.name === location);
    return selectedRoom ? selectedRoom.machines.map(m => m.name) : [];
  }, [location, rooms]);

  // Get technician names
  const technicianNames = getTechnicianNames();

  const createdAt = useMemo(() => new Date(), []);
  const creatorEmail = getCurrentUser()?.email ?? '–';

  const formValidBase = description.trim().length > 0 && location && machine;
  const formValid = readOnly && allowResponsibleEdit ? true : formValidBase;

  const handleSave = () => {
    // TODO: integrate API once backend is ready
    console.log('Create ticket', {
      created_at: createdAt.toISOString(),
      created_by: creatorEmail,
      location,
      machine,
      description,
      priority,
      images: selectedFiles.length,
      responsible,
    });
    if (onSave) onSave({ description, priority, location, machine, status: initialData?.status, responsible, plannedCompletion: plannedDate ? plannedDate.toISOString() : null });
    onClose();
  };

  const handleCopyUrl = async () => {
    if (!ticketId) return;
    
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('ticket', ticketId.toString());
      
      await navigator.clipboard.writeText(currentUrl.toString());
      setCopyButtonText('Kopiert!');
      
      // Reset button text after 2 seconds
      setTimeout(() => {
        setCopyButtonText('Link kopieren');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      setCopyButtonText('Fehler');
      setTimeout(() => {
        setCopyButtonText('Link kopieren');
      }, 2000);
    }
  };

  const statusLabelMap: Record<string, string> = { backlog: 'Backlog', progress: 'In Bearbeitung', done: 'Erledigt' };

  const eventLabel = (ev: TicketEvent) => {
    if (ev.type === 'create') return 'Ticket erstellt';
    if (ev.type === 'assign') return ev.details ?? 'Zugewiesen';
    if (ev.type === 'status_update') return ev.details ?? 'Status geändert';
    return ev.type;
  };

  return (
    <>
     <Dialog 
      open={open} 
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onClose();
      }}
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>Neues Ticket erstellen</DialogTitle>
      <DialogContent>
        {/* Read-only meta information */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Row: Erstellungsinfo */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Erstellt am"
              value={format(createdAt, 'dd.MM.yyyy HH:mm')}
              size="small"
              InputProps={{ readOnly: true }}
              sx={{ flex: 1 }}
            />

            <TextField
              label="Erstellt von"
              value={creatorEmail}
              size="small"
              InputProps={{ readOnly: true }}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Standort Auswahl */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Standort / Raum</InputLabel>
              <Select
                label="Standort / Raum"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value as string);
                  setMachine('');
                }}
              >
                {locationOptions.map((loc) => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!location || readOnly}>
              <InputLabel>Maschine / Gerät</InputLabel>
              <Select
                label="Maschine / Gerät"
                value={machine}
                onChange={(e) => setMachine(e.target.value as string)}
              >
                {availableMachines.map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Statusanzeige (nur Pool) */}
          {showStatus && initialData?.status && (
            <TextField
              label="Status"
              value={statusLabelMap[initialData.status]}
              size="small"
              InputProps={{ readOnly: true }}
            />
          )}

          {/* Problem Beschreibung */}
          <TextField
            label="Kurzbeschreibung"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={readOnly}
          />

          <FormControl fullWidth disabled={readOnly}>
            <InputLabel>Dringlichkeit</InputLabel>
            <Select
              label="Dringlichkeit"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <MenuItem value="rot">Rot (hoch)</MenuItem>
              <MenuItem value="gelb">Gelb (mittel)</MenuItem>
              <MenuItem value="gruen">Grün (niedrig)</MenuItem>
            </Select>
          </FormControl>

          {/* Responsible */}
          <FormControl fullWidth disabled={readOnly && !allowResponsibleEdit}>
            <InputLabel>Verantwortlich</InputLabel>
            <Select
              label="Verantwortlich"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value as string)}
            >
              <MenuItem value=""><em>Niemand</em></MenuItem>
              {technicianNames.map(emp => (
                <MenuItem key={emp} value={emp}>{emp}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Planned completion date (Pool) */}
          {allowPlanEdit && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Geplantes Abschlussdatum"
                value={plannedDate}
                onChange={(newVal) => setPlannedDate(newVal)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          )}

          {/* Image Upload (disabled in read-only) */}
          <Box sx={{ width: '100%' }}>
            <input
              id="ticket-image-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length) return;

                const remainingSlots = 3 - selectedFiles.length;
                if (remainingSlots <= 0) return;

                const filesToAdd = files.slice(0, remainingSlots);
                setSelectedFiles(prev => [...prev, ...filesToAdd]);
              }}
              style={{ display: 'none' }}
            />

            {canSelectMore && (
              <Button
                variant="outlined"
                component="label"
                htmlFor="ticket-image-input"
                startIcon={<CloudUpload />}
                size="small"
                fullWidth
                sx={{ mb: 1 }}
              >
                {selectedFiles.length === 0 ? 'Bild auswählen' : 'Weiteres Bild hinzufügen'}
              </Button>
            )}

            {previewItems.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {previewItems.map((src, idx) => (
                  <Box key={idx} sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={src}
                      alt={`Bild ${idx + 1}`}
                      sx={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 1 }}
                      onClick={() => {
                        setPreviewIndex(idx);
                        setPreviewOpen(true);
                      }}
                    />

                    {!readOnly && (
                    <IconButton
                      onClick={() => {
                        setPreviewIndex(idx);
                        setPreviewOpen(true);
                      }}
                      sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.8)' }}
                      size="small"
                    >
                      <ZoomIn fontSize="small" />
                    </IconButton>
                    )}

                    <IconButton
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                      sx={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.8)', color: 'error.main' }}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Audit Trail */}
          {initialData?.events && initialData.events.length > 0 && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">Historie</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {initialData.events.map((ev, idx) => (
                    <Typography key={idx} variant="body2">
                      {format(new Date(ev.timestamp), 'dd.MM.yyyy HH:mm')} – {eventLabel(ev)}
                    </Typography>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        {/* Left side - Copy URL button (only show for existing tickets) */}
        <Box>
          {ticketId && (
            <Button 
              onClick={handleCopyUrl} 
              startIcon={<ContentCopy />}
              size="small"
              variant="outlined"
            >
              {copyButtonText}
            </Button>
          )}
        </Box>

        {/* Right side - Action buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} color="inherit">{readOnly ? 'Schließen' : 'Abbrechen'}</Button>
          {(!readOnly || allowResponsibleEdit) && (
            <Button onClick={handleSave} variant="contained" disabled={!formValid}>Speichern</Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>

    {/* Preview Dialog */}
    {selectedFiles.length > 0 && (
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Bildvorschau
          <IconButton onClick={() => setPreviewOpen(false)} sx={{ position: 'absolute', top: 8, right: 8 }}>
            <Clear />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 0 }}>
          <Box
            component="img"
            src={previewItems[previewIndex]}
            alt="Bildvorschau"
            sx={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
          />
        </DialogContent>
      </Dialog>
    )}
    </>
  );
};

export default AddTicketDialog; 