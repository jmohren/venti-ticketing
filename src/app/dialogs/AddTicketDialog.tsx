import React, { useState, useMemo, useEffect } from 'react';
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
  Autocomplete,
} from '@mui/material';
import { format } from 'date-fns';
import { useUser } from '@/core/state/UserProvider';
import { IconButton } from '@mui/material';
import { CloudUpload, Delete, ZoomIn, Clear, ExpandMore, ContentCopy, Archive, Send, Close, CameraAlt, Image, PlayArrow, Pause } from '@mui/icons-material';
import { TicketEvent, useTickets } from '@/app/hooks/useTickets';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useTechnicians } from '@/app/hooks/useTechnicians';
import { useMachines } from '@/app/hooks/useMachines';
import { storageApiClient } from '@/core/api/storage/StorageApiClient';
import { compressImage } from '@/app/utils/imageCompression';
import { useTicketCreationUrlState } from '@/app/hooks/useTicketUrlState';

interface TicketData {
  machine?: string;
  description?: string;
  priority?: 'rot' | 'gelb' | 'gruen';
  status?: 'backlog' | 'progress' | 'done' | 'archived';
  type?: 'verwaltung' | 'betrieb';
  category?: 'elektrisch' | 'mechanisch';
  responsible?: string;
  events?: TicketEvent[];
  plannedCompletion?: string | null;
  images?: string[];
  // Verwaltung specific fields
  raumnummer?: string;
  // Betrieb specific fields
  equipmentNummer?: string;
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
  showArchiveButton?: boolean;
  onArchive?: () => void;
  allowWorkTracking?: boolean; // Only show work tracking in specific views
}

/**
 * Minimal dialog for creating a maintenance ticket.
 * The full form will be expanded later – for now we only collect
 * a short description and priority so that we can wire up the workflow.
 */
const AddTicketDialog: React.FC<AddTicketDialogProps> = ({ open, onClose, readOnly = false, initialData, showStatus = false, onSave, allowResponsibleEdit = false, allowPlanEdit = false, ticketId, showArchiveButton = false, onArchive, allowWorkTracking = false }) => {
  const { user, profile } = useUser();
  const { updateTicket } = useTickets();
  const { getTechnicianNames } = useTechnicians();
  const { machines } = useMachines();
  
  // URL state management for new ticket creation (single source of truth)
  const { getFormData, updateType, updateMachine, updateEquipment, updateRoom } = useTicketCreationUrlState();
  
  // Determine if this is a new ticket
  const isNewTicket = !initialData && !ticketId;

  // Get user display name from enhanced profile
  const getUserDisplayName = () => {
    if (profile?.fullName) return profile.fullName;
    if (user?.email) return user.email.split('@')[0];
    return 'Demo User';
  };

  // Autocomplete options for machines and equipment numbers
  const machineOptions = useMemo(() => {
    return machines.map(m => ({
      label: m.name,
      value: m.name,
      equipmentNumber: m.machineNumber
    }));
  }, [machines]);

  const equipmentOptions = useMemo(() => {
    return machines.map(m => ({
      label: m.machineNumber,
      value: m.machineNumber,
      machineName: m.name
    }));
  }, [machines]);

  // Handle machine selection - auto-fill equipment number
  const handleMachineSelect = (selectedMachine: string | null) => {
    const machineValue = selectedMachine || '';
    
    if (isNewTicket) {
      // For new tickets, update URL (single source of truth)
      updateMachine(machineValue);
    } else {
      // For existing tickets, use local state
      setMachine(machineValue);
      if (selectedMachine) {
        const machineData = machines.find(m => m.name === selectedMachine);
        if (machineData) {
          setEquipmentNummer(machineData.machineNumber);
        }
      }
    }
  };

  // Handle equipment number selection - auto-fill machine
  const handleEquipmentSelect = (selectedEquipment: string | null) => {
    const equipmentValue = selectedEquipment || '';
    
    if (isNewTicket) {
      // For new tickets, update URL (single source of truth)
      updateEquipment(equipmentValue);
    } else {
      // For existing tickets, use local state
      setEquipmentNummer(equipmentValue);
      if (selectedEquipment) {
        const machineData = machines.find(m => m.machineNumber === selectedEquipment);
        if (machineData) {
          setMachine(machineData.name);
        }
      }
    }
  };
  
  // Handle ticket type change
  const handleTicketTypeChange = (newType: 'verwaltung' | 'betrieb') => {
    if (isNewTicket) {
      // For new tickets, update URL (single source of truth)
      updateType(newType);
    } else {
      // For existing tickets, use local state
      setTicketType(newType);
      // Reset fields when changing type
      setMachine('');
      setRaumnummer('');
      setEquipmentNummer('');
    }
  };
  
  // Handle room number change
  const handleRaumnummerChange = (value: string) => {
    if (isNewTicket) {
      // For new tickets, update URL (single source of truth)
      updateRoom(value);
    } else {
      // For existing tickets, use local state
      setRaumnummer(value);
    }
  };

  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<'rot' | 'gelb' | 'gruen'>(initialData?.priority || 'gruen');

  // For new tickets, use URL state; for existing tickets, use local state
  const [machine, setMachine] = useState(initialData?.machine || '');
  const [responsible, setResponsible] = useState(initialData?.responsible || '');
  const [plannedDate, setPlannedDate] = useState<Date | null>(initialData?.plannedCompletion ? new Date(initialData.plannedCompletion) : null);
  const [ticketType, setTicketType] = useState<'verwaltung' | 'betrieb'>(initialData?.type || 'betrieb');
  const [category, setCategory] = useState<'elektrisch' | 'mechanisch'>(initialData?.category || 'mechanisch');
  const [raumnummer, setRaumnummer] = useState(initialData?.raumnummer || '');
  const [equipmentNummer, setEquipmentNummer] = useState(initialData?.equipmentNummer || '');
  
  // Get current values (URL for new tickets, state for existing)
  const getCurrentValues = () => {
    if (isNewTicket) {
      // For new tickets, always use URL data (even if empty)
      const urlData = getFormData();
      return {
        ticketType: urlData.type,
        machine: urlData.machine,
        equipmentNummer: urlData.equipmentNummer,
        raumnummer: urlData.raumnummer
      };
    }
    return { ticketType, machine, equipmentNummer, raumnummer };
  };
  
  const currentValues = getCurrentValues();

  // Image upload state (allow up to 3 images total)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Copy URL state
  const [copyButtonText, setCopyButtonText] = useState('Link kopieren');
  
  // Chat functionality state
  const [commentText, setCommentText] = useState('');
  const [localEvents, setLocalEvents] = useState<TicketEvent[]>(initialData?.events || []);
  const [commentImages, setCommentImages] = useState<File[]>([]);
  
  // Save loading state
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);

  // Detect if user is on mobile device
  const isMobile = useMemo(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Check if work is currently in progress
  const isWorkInProgress = useMemo(() => {
    const userDisplayName = getUserDisplayName();
    
    // Find the most recent work event for the current user
    const workEvents = localEvents.filter(event => 
      (event.type === 'work_started' || event.type === 'work_paused') &&
      event.details?.startsWith(userDisplayName)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const lastWorkEvent = workEvents[0];
    return lastWorkEvent?.type === 'work_started';
  }, [localEvents, profile, user]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Reset all form fields to initial values when dialog opens
      setDescription(initialData?.description || '');
      setPriority(initialData?.priority || 'gruen');

      setMachine(initialData?.machine || '');
      setResponsible(initialData?.responsible || '');
      setPlannedDate(initialData?.plannedCompletion ? new Date(initialData.plannedCompletion) : null);
      setTicketType(initialData?.type || 'betrieb');
      setCategory(initialData?.category || 'mechanisch');
      setRaumnummer(initialData?.raumnummer || '');
      setEquipmentNummer(initialData?.equipmentNummer || '');
      setSelectedFiles([]);
      setExistingImages(initialData?.images || []);
      setPreviewOpen(false);
      setPreviewIndex(0);
      setCopyButtonText('Link kopieren');
      setCommentText('');
      setLocalEvents(initialData?.events || []);
      setCommentImages([]);
    }
  }, [open, initialData]);

  // Combine existing images and new uploads for preview
  const newFileItems = selectedFiles.map(file => URL.createObjectURL(file));
  const previewItems = [...existingImages, ...newFileItems];

  const canSelectMore = !readOnly && previewItems.length < 3;



  // Get technician names
  const technicianNames = getTechnicianNames();

  const createdAt = useMemo(() => new Date(), []);
  const creatorName = getUserDisplayName();



  const formValidBase = description.trim().length > 0 && 
    (currentValues.ticketType === 'verwaltung' ? (currentValues.raumnummer || '').trim().length > 0 : 
     currentValues.ticketType === 'betrieb' ? (currentValues.machine || '').trim().length > 0 && (currentValues.equipmentNummer || '').trim().length > 0 : false);
  const formValid = readOnly && allowResponsibleEdit ? true : formValidBase;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Upload new images to storage and get URLs
      const uploadedImageUrls: string[] = [];
      
      // Keep existing images (already URLs)
      uploadedImageUrls.push(...existingImages);
      
      // Upload new files to storage with compression
      for (const file of selectedFiles) {
        try {
          // Compress image before upload
          const compressedFile = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            format: 'jpeg'
          });

          // Generate unique filename: tickets/uuid.extension
          const fileExtension = 'jpg'; // Always use jpg after compression
          const uniqueId = crypto.randomUUID();
          const filePath = `tickets/${uniqueId}.${fileExtension}`;
          
          // Upload compressed image to storage
          await storageApiClient.uploadFile(compressedFile, filePath);
          // Use authenticated API URL instead of direct blob URL
          const authenticatedUrl = storageApiClient.getFileUrl(filePath);
          uploadedImageUrls.push(authenticatedUrl);
        } catch (error) {
          console.error('Failed to compress or upload image:', error);
          // Continue with other images even if one fails
        }
      }

    console.log('Create ticket', {
      created_at: createdAt.toISOString(),
              created_by: creatorName,
      machine,
      description,
      priority,
        images: uploadedImageUrls.length,
      responsible,
    });
      
      if (onSave) await onSave({ 
      description, 
      priority, 
        machine: currentValues.ticketType === 'verwaltung' ? 'Verwaltung' : currentValues.machine, 
      status: initialData?.status, 
        type: currentValues.ticketType,
        category,
      responsible, 
      plannedCompletion: plannedDate ? plannedDate.toISOString() : null,
        images: uploadedImageUrls, // Pass uploaded image URLs
        raumnummer: currentValues.ticketType === 'verwaltung' ? currentValues.raumnummer : undefined,
        equipmentNummer: currentValues.ticketType === 'betrieb' ? currentValues.equipmentNummer : undefined
    });
    onClose();
    } catch (error) {
      console.error('Failed to save ticket:', error);
      // You could show an error message to the user here
    } finally {
      setIsSaving(false);
    }
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

  const statusLabelMap: Record<string, string> = { backlog: 'Backlog', progress: 'In Bearbeitung', done: 'Erledigt', archived: 'Archiviert' };

  const eventLabel = (ev: TicketEvent) => {
    if (ev.type === 'create') return 'Ticket erstellt';
    if (ev.type === 'assign') return ev.details ?? 'Zugewiesen';
    if (ev.type === 'status_update') return ev.details ?? 'Status geändert';
    if (ev.type === 'comment') return ev.details ?? 'Kommentar';
    if (ev.type === 'work_started') return ev.details ?? 'Arbeit begonnen';
    if (ev.type === 'work_paused') return ev.details ?? 'Arbeit pausiert';
    return ev.type;
  };

  const handleSendComment = async () => {
    if ((!commentText.trim() && commentImages.length === 0) || !ticketId) return;
    
    setIsSendingComment(true);
    try {
      // For development/demo purposes, use a more meaningful fallback
      const userDisplayName = getUserDisplayName();
      
      // Upload images to storage with compression and get URLs
      const imageUrls: string[] = [];
      for (const file of commentImages) {
        try {
          // Compress image before upload
          const compressedFile = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            format: 'jpeg'
          });

          // Generate unique filename: tickets/uuid.extension
          const fileExtension = 'jpg'; // Always use jpg after compression
          const uniqueId = crypto.randomUUID();
          const filePath = `tickets/${uniqueId}.${fileExtension}`;
          
          // Upload compressed image to storage
          await storageApiClient.uploadFile(compressedFile, filePath);
          // Use authenticated API URL instead of direct blob URL
          const authenticatedUrl = storageApiClient.getFileUrl(filePath);
          imageUrls.push(authenticatedUrl);
        } catch (error) {
          console.error('Failed to compress or upload image:', error);
          // Continue with other images even if one fails
        }
      }
      
      const newEvent: TicketEvent = {
        timestamp: new Date().toISOString(),
        type: 'comment',
        details: `${userDisplayName}: ${commentText.trim()}`,
        images: imageUrls.length > 0 ? imageUrls : undefined
      };

      // Update local state for immediate UI update
      const updatedEvents = [...localEvents, newEvent];
      setLocalEvents(updatedEvents);
      
      // Update the ticket in the backend
      await updateTicket(ticketId, { events: updatedEvents });
      
      // Clear the comment text and images
      setCommentText('');
      setCommentImages([]);
    } catch (error) {
      console.error('Failed to send comment:', error);
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleStartWork = () => {
    if (!ticketId) return;
    
    const userDisplayName = getUserDisplayName();
    
    const newEvent: TicketEvent = {
      timestamp: new Date().toISOString(),
      type: 'work_started',
      details: `${userDisplayName}: Arbeit begonnen`
    };

    // Update local state for immediate UI update
    const updatedEvents = [...localEvents, newEvent];
    setLocalEvents(updatedEvents);
    
    // Update the ticket in the backend
    updateTicket(ticketId, { events: updatedEvents });
  };

  const handlePauseWork = () => {
    if (!ticketId) return;
    
    const userDisplayName = getUserDisplayName();
    
    const newEvent: TicketEvent = {
      timestamp: new Date().toISOString(),
      type: 'work_paused',
      details: `${userDisplayName}: Arbeit pausiert`
    };

    // Update local state for immediate UI update
    const updatedEvents = [...localEvents, newEvent];
    setLocalEvents(updatedEvents);
    
    // Update the ticket in the backend
    updateTicket(ticketId, { events: updatedEvents });
  };

  return (
    <>
     <Dialog 
      open={open} 
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onClose();
      }}
      maxWidth={isMobile ? false : "sm"} 
      fullWidth={!isMobile}
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        ...(isMobile && { 
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        })
      }}>
        Neues Ticket erstellen
        {isMobile && (
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent sx={{
        ...(isMobile && { 
          padding: '16px 16px 0 16px',
          flex: 1
        })
      }}>
        {/* Read-only meta information */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Row: Erstellungsinfo */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            ...(isMobile && { flexDirection: 'column', gap: 1.5 })
          }}>
            <TextField
              label="Erstellt am"
              value={format(createdAt, 'dd.MM.yyyy HH:mm')}
              size={isMobile ? "medium" : "small"}
              InputProps={{ readOnly: true }}
              sx={{ flex: 1 }}
            />

            <TextField
              label="Erstellt von"
              value={creatorName}
              size={isMobile ? "medium" : "small"}
              InputProps={{ readOnly: true }}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Ticket Type Selection */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            ...(isMobile && { flexDirection: 'column', gap: 1.5 })
          }}>
            <FormControl fullWidth disabled={readOnly}>
              <InputLabel>Ticket Typ</InputLabel>
              <Select
                label="Ticket Typ"
                value={currentValues.ticketType}
                onChange={(e) => handleTicketTypeChange(e.target.value as 'verwaltung' | 'betrieb')}
                size={isMobile ? "medium" : "small"}
              >
                <MenuItem value="betrieb">Betrieb</MenuItem>
                <MenuItem value="verwaltung">Verwaltung</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={readOnly && !allowResponsibleEdit}>
              <InputLabel>Kategorie</InputLabel>
              <Select
                label="Kategorie"
                value={category}
                onChange={(e) => setCategory(e.target.value as 'elektrisch' | 'mechanisch')}
                size={isMobile ? "medium" : "small"}
              >
                <MenuItem value="mechanisch">Mechanisch</MenuItem>
                <MenuItem value="elektrisch">Elektrisch</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Conditional fields based on ticket type */}
          {currentValues.ticketType === 'verwaltung' ? (
            // Verwaltung fields
            <TextField
              label="Raumnummer"
              value={currentValues.raumnummer}
              onChange={(e) => handleRaumnummerChange(e.target.value)}
              size="small"
              fullWidth
              disabled={readOnly}
              placeholder="z.B. A-204, B-101"
            />
          ) : (
            // Betrieb fields
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Autocomplete
                options={equipmentOptions.map(option => option.label)}
                value={currentValues.equipmentNummer}
                onChange={(_, newValue) => handleEquipmentSelect(newValue)}
                onInputChange={(event, newInputValue) => {
                  // Allow free typing while maintaining auto-complete
                  if (event?.type === 'change') {
                    handleEquipmentSelect(newInputValue);
                  }
                }}
                freeSolo
                disabled={readOnly}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Equipment Nummer"
                    size="small"
                    placeholder="z.B. EQ-001, EQ-205"
                  />
                )}
                sx={{ flex: 1 }}
              />
              
              <Autocomplete
                options={machineOptions.map(option => option.label)}
                value={currentValues.machine}
                onChange={(_, newValue) => handleMachineSelect(newValue)}
                onInputChange={(event, newInputValue) => {
                  // Allow free typing while maintaining auto-complete
                  if (event?.type === 'change') {
                    handleMachineSelect(newInputValue);
                  }
                }}
                freeSolo
                disabled={readOnly}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Maschine"
                    size="small"
                    placeholder="z.B. Presse 1, Fräse A"
                  />
                )}
                sx={{ flex: 1 }}
              />
            </Box>
          )}

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

          {/* Responsible - show when explicitly allowed for editing OR in read-only mode */}
          {(allowResponsibleEdit || readOnly) && (
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
          )}

          {/* Work tracking controls */}
          {ticketId && allowWorkTracking && (
            <Box sx={{ 
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              mt: 1
            }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
                Arbeitszeit:
              </Typography>
              {!isWorkInProgress ? (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<PlayArrow />}
                  onClick={handleStartWork}
                >
                  Arbeit beginnen
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  startIcon={<Pause />}
                  onClick={handlePauseWork}
                >
                  Arbeit pausieren
                </Button>
              )}
            </Box>
          )}

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

                const remainingSlots = 3 - previewItems.length;
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
              >
                {selectedFiles.length === 0 ? 'Bild auswählen' : 'Weiteres Bild hinzufügen'}
              </Button>
            )}

            {previewItems.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                {previewItems.map((src, idx) => {
                  const isExisting = idx < existingImages.length;
                  
                  return (
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

                      {!readOnly && (
                        <IconButton
                          onClick={() => {
                            if (isExisting) {
                              // Remove from existing images
                              setExistingImages(prev => prev.filter((_, i) => i !== idx));
                            } else {
                              // Remove from new files
                              const newFileIndex = idx - existingImages.length;
                              setSelectedFiles(prev => prev.filter((_, i) => i !== newFileIndex));
                            }
                          }}
                          sx={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.8)', color: 'error.main' }}
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Audit Trail */}
          {initialData?.events && initialData.events.length > 0 && (
            <Box>
              <Box sx={{ 
                height: '1px', 
                backgroundColor: 'grey.300', 
                mb: 1 
              }} />
              <Accordion sx={{ 
                boxShadow: 'none', 
                border: 'none',
                margin: '0 !important',
                backgroundColor: 'grey.50',
                borderRadius: '8px !important',
                '&:before': {
                  display: 'none'
                },
                '&.Mui-expanded': {
                  margin: '0 !important'
                },
                '&.MuiAccordion-root': {
                  margin: '0 !important'
                },
                '&.MuiAccordion-root.Mui-expanded': {
                  margin: '0 !important'
                },
                '& .MuiAccordionSummary-root': {
                  borderRadius: '8px 8px 0 0 !important'
                },
                '& .MuiAccordionDetails-root': {
                  borderRadius: '0 0 8px 8px !important'
                }
              }}>
                <AccordionSummary 
                  expandIcon={<ExpandMore />}
                  sx={{
                    '&.Mui-expanded': {
                      borderBottom: '1px solid',
                      borderColor: 'grey.300'
                    },
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0 !important'
                    },
                    '& .MuiAccordionSummary-content.Mui-expanded': {
                      margin: '12px 0 !important'
                    }
                  }}
                >
                  <Typography variant="subtitle1">Historie</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {localEvents.map((ev, idx) => {
                      const timestamp = format(new Date(ev.timestamp), 'dd.MM.yyyy HH:mm');
                      
                      // Extract user name and content from details
                      const getUserAndContent = (event: TicketEvent) => {
                        const details = event.details || '';
                        
                        if (event.type === 'comment') {
                          // Format: "user@email.com: message"
                          const colonIndex = details.indexOf(':');
                          if (colonIndex > 0) {
                            return {
                              userName: details.substring(0, colonIndex).trim(),
                              content: details.substring(colonIndex + 1).trim()
                            };
                          }
                        } else if (event.type === 'create') {
                          // Format: "user@email.com: Ticket erstellt" or just "Ticket erstellt"
                          const colonIndex = details.indexOf(':');
                          if (colonIndex > 0) {
                            return {
                              userName: details.substring(0, colonIndex).trim(),
                              content: details.substring(colonIndex + 1).trim()
                            };
                          } else {
                            return {
                              userName: 'System',
                              content: eventLabel(event)
                            };
                          }
                        } else {
                          // Other events: "user@email.com: action" or just "action"
                          const colonIndex = details.indexOf(':');
                          if (colonIndex > 0) {
                            return {
                              userName: details.substring(0, colonIndex).trim(),
                              content: details.substring(colonIndex + 1).trim()
                            };
                          } else {
                            return {
                              userName: 'System',
                              content: details || eventLabel(event)
                            };
                          }
                        }
                        
                        return {
                          userName: 'System',
                          content: eventLabel(event)
                        };
                      };
                      
                      const { userName, content } = getUserAndContent(ev);
                      
                      return (
                        <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {/* User Name - Datetime header */}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'grey.600',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          >
                            {userName} - {timestamp}
                          </Typography>
                          
                          {/* Content */}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'grey.800',
                              fontSize: '0.875rem',
                              fontWeight: 'normal',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.4
                            }}
                          >
                            {content}
                      </Typography>
                          
                          {/* Comment Images */}
                          {ev.images && ev.images.length > 0 && (
                            <Box sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 1, 
                              mt: 1 
                            }}>
                              {ev.images.map((imageUrl, imgIdx) => (
                                <Box
                                  key={imgIdx}
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: 'grey.300',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      opacity: 0.8
                                    }
                                  }}
                                  onClick={() => {
                                    // TODO: Open image preview
                                    window.open(imageUrl, '_blank');
                                  }}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Comment image ${imgIdx + 1}`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                  
                  {/* Chat input field */}
                  {ticketId && (
                    <Box sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'grey.300'
                    }}>
                      {/* Comment Images Preview */}
                      {commentImages.length > 0 && (
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1, 
                          mb: 2 
                        }}>
                          {commentImages.map((file, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                position: 'relative',
                                width: 60,
                                height: 60,
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'grey.300'
                              }}
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Comment preview ${idx + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                              <IconButton
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: -4,
                                  right: -4,
                                  backgroundColor: 'error.main',
                                  color: 'white',
                                  width: 20,
                                  height: 20,
                                  '&:hover': {
                                    backgroundColor: 'error.dark'
                                  }
                                }}
                                onClick={() => {
                                  setCommentImages(prev => prev.filter((_, i) => i !== idx));
                                }}
                              >
                                <Close sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {/* Hidden file input for comment images */}
                      <input
                        id="comment-image-input"
                        type="file"
                        accept="image/*"
                        multiple={!isMobile} // Single image on mobile for camera
                        {...(isMobile && { capture: "environment" })} // Use rear camera on mobile
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (!files.length) return;
                          
                          // Limit to 5 images per comment
                          const remainingSlots = 5 - commentImages.length;
                          if (remainingSlots <= 0) return;
                          
                          const filesToAdd = files.slice(0, remainingSlots);
                          setCommentImages(prev => [...prev, ...filesToAdd]);
                        }}
                        style={{ display: 'none' }}
                      />
                      
                      {/* Chat input area */}
                      <Box sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-end'
                      }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Arbeitsschritte dokumentieren..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          multiline
                          maxRows={3}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendComment();
                            }
                          }}
                        />
                        <IconButton
                          component="label"
                          htmlFor="comment-image-input"
                          disabled={commentImages.length >= 5}
                          color="primary"
                          size="small"
                          title={isMobile ? "Foto aufnehmen" : "Bild auswählen"}
                        >
                          {isMobile ? <CameraAlt /> : <Image />}
                        </IconButton>
                        <IconButton
                          onClick={handleSendComment}
                          disabled={(!commentText.trim() && commentImages.length === 0) || isSendingComment}
                          color="primary"
                          size="small"
                          title={isSendingComment ? "Senden..." : "Nachricht senden"}
                        >
                          <Send />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        justifyContent: 'space-between',
        ...(isMobile && { 
          flexDirection: 'column',
          gap: 2,
          padding: '16px',
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider'
        })
      }}>
        {/* Copy URL and Archive buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          ...(isMobile && { 
            width: '100%',
            justifyContent: 'center'
          })
        }}>
          {ticketId && (
            <Button 
              onClick={handleCopyUrl} 
              startIcon={<ContentCopy />}
              size={isMobile ? "medium" : "small"}
              variant="outlined"
              sx={isMobile ? { flex: 1 } : {}}
            >
              {copyButtonText}
            </Button>
          )}
          {showArchiveButton && onArchive && (
            <Button 
              onClick={onArchive} 
              color="warning" 
              variant="outlined"
              startIcon={<Archive />}
              size={isMobile ? "medium" : "small"}
              sx={isMobile ? { flex: 1 } : {}}
            >
              Archivieren
            </Button>
          )}
        </Box>

        {/* Action buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          ...(isMobile && { 
            width: '100%',
            flexDirection: 'row'
          })
        }}>
          <Button 
            onClick={onClose} 
            color="inherit"
            size={isMobile ? "large" : "medium"}
            sx={isMobile ? { flex: 1 } : {}}
          >
            {readOnly ? 'Schließen' : 'Abbrechen'}
          </Button>
          {(!readOnly || allowResponsibleEdit) && (
            <Button 
              onClick={handleSave} 
              variant="contained" 
              disabled={!formValid || isSaving}
              size={isMobile ? "large" : "medium"}
              sx={isMobile ? { flex: 1 } : {}}
            >
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
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