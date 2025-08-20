import React, { useState, useMemo, useEffect, useCallback } from 'react';

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};
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
  CircularProgress,
  OutlinedInput,
  ListItemText,
  Checkbox,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import { useUser } from '@/core/state/UserProvider';
import { useUsersContext } from '@/core/state/UsersProvider';
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
  // Work time tracking
  totalWorkTimeMinutes?: number;
  // Metadata fields
  created_at?: string;
  createdByUserId?: string;
  // Users who have worked on this ticket
  worked_by_users?: string[];
  // Cost center field
  cost_center?: string;
}

type FieldPermission = 'hidden' | 'view' | 'edit';

interface FieldPermissions {
  // Basic ticket info
  description?: FieldPermission;
  priority?: FieldPermission;
  status?: FieldPermission;
  
  // Ticket type and category
  ticketType?: FieldPermission;
  category?: FieldPermission;
  
  // Location/Machine fields
  machine?: FieldPermission;
  equipmentNummer?: FieldPermission;
  raumnummer?: FieldPermission;
  
  // Assignment and users
  responsible?: FieldPermission;
  workedByUsers?: FieldPermission;
  
  // Planning
  plannedCompletion?: FieldPermission;
  costCenter?: FieldPermission;
  
  // Work tracking
  workTracking?: FieldPermission;
  totalWorkTime?: FieldPermission;
  
  // Images
  images?: FieldPermission;
  
  // Comments
  comments?: FieldPermission;
}

interface AddTicketDialogProps {
  open: boolean;
  onClose: () => void;
  mode?: 'view' | 'edit'; // Controls if dialog is in view-only or edit mode
  initialData?: TicketData;
  onSave?: (data: TicketData) => void;
  ticketId?: number;
  showArchiveButton?: boolean;
  onArchive?: () => void;
  fieldPermissions?: FieldPermissions; // Granular field-level permissions
}

/**
 * Minimal dialog for creating a maintenance ticket.
 * The full form will be expanded later – for now we only collect
 * a short description and priority so that we can wire up the workflow.
 */
const AddTicketDialog: React.FC<AddTicketDialogProps> = ({ 
  open, 
  onClose, 
  mode = 'view', 
  initialData, 
  onSave, 
  ticketId, 
  showArchiveButton = false, 
  onArchive, 
  fieldPermissions = {} 
}) => {
  const { user, profile } = useUser();
  const { updateTicket } = useTickets();
  const { technicians, getTechnicianDisplayName } = useTechnicians();
  const { loadMachines } = useMachines();
  const { getDisplayNameFromUserIdSync } = useUsersContext();

  // Local state for async autocomplete
  const [machineOptions, setMachineOptions] = useState<{ label: string; value: string; equipmentNumber: string }[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<{ label: string; value: string; machineName: string }[]>([]);
  const [machineLoading, setMachineLoading] = useState(false);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  
  // Debounced search for machines
  const searchMachines = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setMachineOptions([]);
        return;
      }

      try {
        setMachineLoading(true);
        const result = await loadMachines({ search: searchTerm.trim() }, 0, 'equipment_description');
        const options = result.data.map(m => ({
          label: m.equipment_description,
          value: m.equipment_description, // Back to using description as value
          equipmentNumber: m.equipment_number
        }));
        setMachineOptions(options);
      } catch (error) {
        console.error('Failed to search machines:', error);
      } finally {
        setMachineLoading(false);
      }
    }, 300),
    [loadMachines]
  );

  // Debounced search for equipment numbers
  const searchEquipment = useCallback(
    debounce(async (searchTerm: string) => {
      console.log('🔧 searchEquipment called with:', searchTerm);
      if (!searchTerm.trim()) {
        setEquipmentOptions([]);
        return;
      }

      try {
        setEquipmentLoading(true);
        const result = await loadMachines({ search: searchTerm.trim() }, 0, 'equipment_number');
        console.log('🔧 searchEquipment result:', result.data);
        const options = result.data.map(m => ({
          label: m.equipment_number,
          value: m.equipment_number, // Already using equipment_number as value (unique key)
          machineName: m.equipment_description
        }));
        console.log('🔧 equipmentOptions set to:', options);
        setEquipmentOptions(options);
      } catch (error) {
        console.error('Failed to search equipment:', error);
      } finally {
        setEquipmentLoading(false);
      }
    }, 300),
    [loadMachines]
  );

  // Helper functions for field permissions
  const getFieldPermission = (field: keyof FieldPermissions): FieldPermission => {
    return fieldPermissions[field] || 'hidden';
  };

  const isFieldVisible = (field: keyof FieldPermissions): boolean => {
    const permission = getFieldPermission(field);
    return permission === 'view' || permission === 'edit';
  };

  const isFieldEditable = (field: keyof FieldPermissions): boolean => {
    const permission = getFieldPermission(field);
    return permission === 'edit' && mode === 'edit';
  };

  // Determine if dialog is in edit mode and has any editable fields
  const hasEditableFields = mode === 'edit' && Object.values(fieldPermissions).some(p => p === 'edit');
  const showSaveButton = hasEditableFields;


  // Helper to get userId from display name (for legacy compatibility)
  // Must be defined before useState calls that use it
  const getUserIdFromDisplayName = useCallback((displayName: string) => {
    const tech = technicians.find(t => t.userId === displayName); // TODO: Update when async display names are supported
    return tech ? tech.userId : displayName;
  }, [technicians]);
  
  // URL state management for new ticket creation (single source of truth)
  const { getFormData, updateType, updateMachine, updateEquipment, updateRoom, updateParams } = useTicketCreationUrlState();
  
  // Determine if this is a new ticket
  const isNewTicket = !initialData && !ticketId;

  // Get user display name from enhanced profile
  const getUserDisplayName = () => {
    if (profile?.fullName) return profile.fullName;
    if (user?.email) return user.email.split('@')[0];
    return 'Demo User';
  };

  // Handle machine input change for async search (typing only - no cross-population)
  const handleMachineInputChange = (_: any, value: string, reason: string) => {
    // Don't update on selection - let handleMachineSelect handle that
    if (reason === 'reset') return;
    
    // Update the field value for new tickets
    if (isNewTicket) {
      updateMachine(value);
    } else {
      setMachine(value);
    }
    
    // Trigger search if there's a value
    if (value) {
      searchMachines(value);
    } else {
      setMachineOptions([]);
    }
  };

  // Handle equipment input change for async search (typing only - no cross-population)
  const handleEquipmentInputChange = (_: any, value: string, reason: string) => {
    // Don't update on selection - let handleEquipmentSelect handle that
    if (reason === 'reset') return;
    
    // Update the field value for new tickets
    if (isNewTicket) {
      updateEquipment(value);
    } else {
      setEquipmentNummer(value);
    }
    
    // Trigger search if there's a value
    if (value) {
      searchEquipment(value);
    } else {
      setEquipmentOptions([]);
    }
  };

  // Use centralized function from UsersProvider (currently unused due to async nature)
  // const { getDisplayNameFromUserId } = useUsersContext();

  // User options for worked by users multi-select (only technicians)
  const userOptions = useMemo(() => {
    return technicians.map(tech => ({
      userId: tech.userId,
      displayName: getTechnicianDisplayName(tech)
    }));
  }, [technicians, getTechnicianDisplayName]);

  // Handle machine selection - auto-fill equipment number (only on explicit selection)
  const handleMachineSelect = async (_: any, selectedMachine: string | null, reason: string) => {
    console.log('🔧 handleMachineSelect called with:', { selectedMachine, reason });
    console.log('🔧 machineOptions:', machineOptions);
    
    // Only do cross-population on explicit selection, not on input/typing
    if (reason !== 'selectOption') {
      console.log('🔧 Not a select-option, just updating field value');
      // Just update the field value without cross-population
      const machineValue = selectedMachine || '';
      if (isNewTicket) {
        updateMachine(machineValue);
      } else {
        setMachine(machineValue);
      }
      return;
    }

    // For new tickets, update both URL parameters directly
    if (selectedMachine && isNewTicket) {
      console.log('🔧 New ticket - looking for machine option:', selectedMachine);
      const machineOption = machineOptions.find(m => m.value === selectedMachine);
      console.log('🔧 Found machine option:', machineOption);
      if (machineOption) {
        console.log('🔧 Updating machine and equipment:', selectedMachine, machineOption.equipmentNumber);
        // Update both parameters at once to avoid timing issues
        updateParams({
          'machine': selectedMachine,
          'equipment': machineOption.equipmentNumber
        });
      }
    } else if (selectedMachine && !isNewTicket) {
      // For existing tickets, do direct cross-population
      setMachine(selectedMachine);
      const machineOption = machineOptions.find(m => m.value === selectedMachine);
      if (machineOption) {
        setEquipmentNummer(machineOption.equipmentNumber);
      }
    }
  };

  // Handle equipment number selection - auto-fill machine (only on explicit selection)
  const handleEquipmentSelect = async (_: any, selectedEquipment: string | null, reason: string) => {
    console.log('🔧 handleEquipmentSelect called with:', { selectedEquipment, reason });
    console.log('🔧 equipmentOptions:', equipmentOptions);
    
    // Only do cross-population on explicit selection, not on input/typing
    if (reason !== 'selectOption') {
      console.log('🔧 Not a select-option, just updating field value');
      // Just update the field value without cross-population
      const equipmentValue = selectedEquipment || '';
      if (isNewTicket) {
        updateEquipment(equipmentValue);
      } else {
        setEquipmentNummer(equipmentValue);
      }
      return;
    }

    // For new tickets, update both URL parameters directly
    if (selectedEquipment && isNewTicket) {
      console.log('🔧 New ticket - looking for equipment option:', selectedEquipment);
      const equipmentOption = equipmentOptions.find(m => m.value === selectedEquipment);
      console.log('🔧 Found equipment option:', equipmentOption);
      if (equipmentOption) {
        console.log('🔧 Updating equipment and machine:', selectedEquipment, equipmentOption.machineName);
        // Update both parameters at once to avoid timing issues
        updateParams({
          'equipment': selectedEquipment,
          'machine': equipmentOption.machineName
        });
      }
    } else if (selectedEquipment && !isNewTicket) {
      // For existing tickets, do direct cross-population
      setEquipmentNummer(selectedEquipment);
      const equipmentOption = equipmentOptions.find(m => m.value === selectedEquipment);
      if (equipmentOption) {
        setMachine(equipmentOption.machineName);
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
  const [status, setStatus] = useState<'backlog' | 'progress' | 'done' | 'archived'>(initialData?.status || 'backlog');

  // For new tickets, use URL state; for existing tickets, use local state
  const [machine, setMachine] = useState(initialData?.machine || '');
  // Initialize responsible with userId if it's a userId, otherwise try to convert from display name
  const [responsible, setResponsible] = useState(() => {
    if (!initialData?.responsible) return '';
    // If it looks like a userId (UUID format), use it directly
    if (initialData.responsible.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return initialData.responsible;
    }
    // Otherwise, try to convert from display name to userId (legacy compatibility)
    return getUserIdFromDisplayName(initialData.responsible);
  });
  const [plannedDate, setPlannedDate] = useState<Date | null>(initialData?.plannedCompletion ? new Date(initialData.plannedCompletion) : null);
  const [ticketType, setTicketType] = useState<'verwaltung' | 'betrieb'>(initialData?.type || 'betrieb');
  const [category, setCategory] = useState<'elektrisch' | 'mechanisch'>(initialData?.category || 'mechanisch');
  const [raumnummer, setRaumnummer] = useState(initialData?.raumnummer || '');
  const [equipmentNummer, setEquipmentNummer] = useState(initialData?.equipmentNummer || '');
  const [workedByUsers, setWorkedByUsers] = useState<string[]>(initialData?.worked_by_users || []);
  const [costCenter, setCostCenter] = useState(initialData?.cost_center || '');
  const [totalWorkTimeMinutes, setTotalWorkTimeMinutes] = useState<number | string>(initialData?.totalWorkTimeMinutes || 0);
  
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

  // Custom styles for disabled fields to make text black and readable with light gray background
  const disabledFieldStyles = {
    '& .MuiInputBase-input.Mui-disabled': {
      color: 'black',
      '-webkit-text-fill-color': 'black',
      backgroundColor: 'grey.50',
    },
    '& .MuiInputBase-root.Mui-disabled': {
      backgroundColor: 'grey.50',
    },
    '& .MuiOutlinedInput-root.Mui-disabled': {
      backgroundColor: 'grey.50',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(0, 0, 0, 0.23)',
      },
    },
    '& .MuiInputLabel-root.Mui-disabled': {
      color: 'rgba(0, 0, 0, 0.6)',
    },
    '& .MuiSelect-select.Mui-disabled': {
      color: 'black',
      '-webkit-text-fill-color': 'black',
      backgroundColor: 'grey.50',
    },
    '& .MuiChip-root': {
      backgroundColor: 'grey.200',
      '& .MuiChip-label': {
        color: 'black',
      },
    },
    '& .MuiListItemText-primary': {
      color: 'black',
    },
    '& .MuiInputBase-input': {
      color: 'black',
      '-webkit-text-fill-color': 'black',
    },
    '& .MuiInputBase-input[readonly]': {
      color: 'black',
      '-webkit-text-fill-color': 'black',
      backgroundColor: 'grey.50',
    },
  };

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
      setStatus(initialData?.status || 'backlog');

      setMachine(initialData?.machine || '');
      // Reset responsible with proper userId handling
      if (!initialData?.responsible) {
        setResponsible('');
      } else if (initialData.responsible.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        setResponsible(initialData.responsible);
      } else {
        setResponsible(getUserIdFromDisplayName(initialData.responsible));
      }
      setPlannedDate(initialData?.plannedCompletion ? new Date(initialData.plannedCompletion) : null);
      setTicketType(initialData?.type || 'betrieb');
      setCategory(initialData?.category || 'mechanisch');
      setRaumnummer(initialData?.raumnummer || '');
      setEquipmentNummer(initialData?.equipmentNummer || '');
      setCostCenter(initialData?.cost_center || '');
      setTotalWorkTimeMinutes(initialData?.totalWorkTimeMinutes || 0);
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

  const canSelectMore = isFieldEditable('images') && previewItems.length < 3;



  // Create options for dropdown (no longer need technicianNames)
  
  // Create technician options with userId as value and display name as label
  const technicianOptions = useMemo(() => {
    return technicians.map(tech => ({
      userId: tech.userId,
      displayName: getTechnicianDisplayName(tech)
    }));
  }, [technicians, getTechnicianDisplayName]);





  // Use ticket data for existing tickets, current user/time for new tickets
  const createdAt = useMemo(() => {
    if (initialData?.created_at) {
      return new Date(initialData.created_at);
    }
    return new Date();
  }, [initialData?.created_at]);

  const creatorName = useMemo(() => {
    if (initialData?.createdByUserId) {
      return getDisplayNameFromUserIdSync(initialData.createdByUserId, getUserDisplayName());
    }
    return getUserDisplayName();
  }, [initialData?.createdByUserId, getDisplayNameFromUserIdSync, profile, user]);



  const formValidBase = description.trim().length > 0 && 
    (currentValues.ticketType === 'verwaltung' ? (currentValues.raumnummer || '').trim().length > 0 : 
     currentValues.ticketType === 'betrieb' ? ((currentValues.machine || '').trim().length > 0 && (currentValues.equipmentNummer || '').trim().length > 0) : false);
  const formValid = showSaveButton ? formValidBase : true;
  
  // Debug form validation
  console.log('🔧 Form validation:', { 
    description: description.trim(), 
    ticketType: currentValues.ticketType,
    machine: currentValues.machine,
    equipmentNummer: currentValues.equipmentNummer,
    raumnummer: currentValues.raumnummer,
    formValidBase,
    formValid
  });
  
  // Debug dialog state
  console.log('🔧 Dialog state:', { mode, fieldPermissions, hasEditableFields, showSaveButton, formValid, formValidBase });

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
      
      // For betrieb tickets, use machine description as machine identifier
      const machineIdentifier = currentValues.ticketType === 'verwaltung' 
        ? 'Verwaltung' 
        : currentValues.machine; // Use machine description, not equipment number

      if (onSave) await onSave({ 
      description, 
      priority, 
        machine: machineIdentifier, 
      status: isFieldEditable('status') ? status : initialData?.status, 
        type: currentValues.ticketType,
        category,
      responsible, 
      plannedCompletion: plannedDate ? plannedDate.toISOString() : null,
        images: uploadedImageUrls, // Pass uploaded image URLs
        raumnummer: currentValues.ticketType === 'verwaltung' ? currentValues.raumnummer : undefined,
        equipmentNummer: currentValues.ticketType === 'betrieb' ? currentValues.equipmentNummer : undefined,
        worked_by_users: workedByUsers,
        cost_center: costCenter,
        totalWorkTimeMinutes: typeof totalWorkTimeMinutes === 'string' && totalWorkTimeMinutes === '' ? 0 : Number(totalWorkTimeMinutes)
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
    const now = new Date().toISOString();
    
    // Find the last work_started event by this user
    const workStartedEvent = [...localEvents]
      .reverse()
      .find(event => 
        event.type === 'work_started' && 
        event.details?.startsWith(userDisplayName)
      );
    
    let sessionDurationMinutes = 0;
    const pauseDetails = `${userDisplayName}: Arbeit pausiert`;
    
    if (workStartedEvent) {
      const startTime = new Date(workStartedEvent.timestamp);
      const endTime = new Date(now);
      sessionDurationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }
    
    const newEvent: TicketEvent = {
      timestamp: now,
      type: 'work_paused',
      details: pauseDetails
    };

    // Update local state for immediate UI update
    const updatedEvents = [...localEvents, newEvent];
    setLocalEvents(updatedEvents);
    
    // Calculate new total work time
    const currentTotal = initialData?.totalWorkTimeMinutes || 0;
    const newTotal = currentTotal + sessionDurationMinutes;
    
    // Update the ticket in the backend with events and total work time
    updateTicket(ticketId, { 
      events: updatedEvents,
      totalWorkTimeMinutes: newTotal
    });
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
{isNewTicket ? 'Neues Ticket erstellen' : 'Ticket'}
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
              sx={{ flex: 1, ...disabledFieldStyles }}
            />

            <TextField
              label="Erstellt von"
              value={creatorName}
              size={isMobile ? "medium" : "small"}
              InputProps={{ readOnly: true }}
              sx={{ flex: 1, ...disabledFieldStyles }}
            />
          </Box>

          {/* Ticket Type Selection */}
          {(isFieldVisible('ticketType') || isFieldVisible('category')) && (
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              ...(isMobile && { flexDirection: 'column', gap: 1.5 })
            }}>
              {isFieldVisible('ticketType') && (
                <FormControl fullWidth disabled={!isFieldEditable('ticketType')} sx={!isFieldEditable('ticketType') ? disabledFieldStyles : {}}>
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
              )}

              {isFieldVisible('category') && (
                <FormControl fullWidth disabled={!isFieldEditable('category')} sx={!isFieldEditable('category') ? disabledFieldStyles : {}}>
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
              )}
            </Box>
          )}

          {/* Conditional fields based on ticket type */}
          {currentValues.ticketType === 'verwaltung' ? (
            // Verwaltung fields
            isFieldVisible('raumnummer') && (
              <TextField
                label="Raumnummer"
                value={currentValues.raumnummer}
                onChange={(e) => handleRaumnummerChange(e.target.value)}
                size="small"
                fullWidth
                disabled={!isFieldEditable('raumnummer')}
                placeholder="z.B. A-204, B-101"
                sx={!isFieldEditable('raumnummer') ? disabledFieldStyles : {}}
              />
            )
          ) : (
            // Betrieb fields
            (isFieldVisible('equipmentNummer') || isFieldVisible('machine')) && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                {isFieldVisible('equipmentNummer') && (
                  <Autocomplete
                    options={equipmentOptions.map(option => option.value)} // Use equipment_number as options
                    value={currentValues.equipmentNummer}
                    onChange={(event, newValue, reason) => {
                      console.log('🔧 Autocomplete onChange triggered:', { newValue, reason });
                      handleEquipmentSelect(event, newValue, reason);
                    }}
                    onInputChange={(event, value, reason) => {
                      console.log('🔧 Autocomplete onInputChange triggered:', { value, reason });
                      handleEquipmentInputChange(event, value, reason);
                    }}
                    onClose={(event, reason) => {
                      console.log('🔧 Autocomplete onClose triggered:', { reason, currentValue: currentValues.equipmentNummer });
                      // If dropdown closed due to option selection and we have a value, trigger cross-population
                      if (reason === 'selectOption' && currentValues.equipmentNummer) {
                        handleEquipmentSelect(event, currentValues.equipmentNummer, 'selectOption');
                      }
                    }}
                    loading={equipmentLoading}
                    freeSolo
                    disabled={!isFieldEditable('equipmentNummer')}
                    filterOptions={(x) => x} // Disable client-side filtering
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Equipment Nummer"
                        size="small"
                        placeholder="z.B. EQ-001, EQ-205"
                        sx={!isFieldEditable('equipmentNummer') ? disabledFieldStyles : {}}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {equipmentLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    sx={{ flex: 1, ...(!isFieldEditable('equipmentNummer') ? disabledFieldStyles : {}) }}
                  />
                )}
                
                {isFieldVisible('machine') && (
                  <Autocomplete
                    options={machineOptions.map(option => option.label)}
                    value={currentValues.machine}
                    onChange={(event, newValue, reason) => handleMachineSelect(event, newValue, reason)}
                    onInputChange={handleMachineInputChange}
                    loading={machineLoading}
                    freeSolo
                    disabled={!isFieldEditable('machine')}
                    filterOptions={(x) => x} // Disable client-side filtering
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Maschine"
                        size="small"
                        placeholder="z.B. Presse 1, Fräse A"
                        sx={!isFieldEditable('machine') ? disabledFieldStyles : {}}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {machineLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    sx={{ flex: 1, ...(!isFieldEditable('machine') ? disabledFieldStyles : {}) }}
                  />
                )}
              </Box>
            )
          )}

          {/* 1. Status and Work Time Row */}
          {(isFieldVisible('status') || isFieldVisible('workTracking')) && (
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              ...(isMobile && { flexDirection: 'column', gap: 1.5 })
            }}>
              {/* Status - editable dropdown or read-only display */}
              {isFieldVisible('status') && initialData?.status && (
                isFieldEditable('status') ? (
                  <FormControl sx={{ flex: 1, ...(!isFieldEditable('status') ? disabledFieldStyles : {}) }} disabled={!isFieldEditable('status')}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      label="Status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      size={isMobile ? "medium" : "small"}
                    >
                      <MenuItem value="backlog">Backlog</MenuItem>
                      <MenuItem value="progress">In Bearbeitung</MenuItem>
                      <MenuItem value="done">Erledigt</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    label="Status"
                    value={statusLabelMap[initialData.status]}
                    size={isMobile ? "medium" : "small"}
                    InputProps={{ readOnly: true }}
                    sx={{ flex: 1, ...disabledFieldStyles }}
                  />
                )
              )}

              {/* Total Work Time */}
              {(isFieldVisible('workTracking') || isFieldVisible('totalWorkTime')) && (
                <TextField
                  label="Arbeitszeit gesamt (min)"
                  value={isFieldEditable('totalWorkTime') ? (totalWorkTimeMinutes === '' ? '' : totalWorkTimeMinutes.toString()) : (() => {
                    const minutes = typeof totalWorkTimeMinutes === 'number' ? totalWorkTimeMinutes : parseInt(totalWorkTimeMinutes) || 0;
                    if (minutes < 60) return `${minutes} Min`;
                    const hours = Math.floor(minutes / 60);
                    const remainingMinutes = minutes % 60;
                    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
                  })()}
                  onChange={isFieldEditable('totalWorkTime') ? (e) => {
                    const value = e.target.value;
                    // Allow empty string or positive integers (including 0)
                    if (value === '' || /^\d+$/.test(value)) {
                      setTotalWorkTimeMinutes(value === '' ? '' : parseInt(value));
                    }
                  } : undefined}
                  size={isMobile ? "medium" : "small"}
                  InputProps={{ readOnly: !isFieldEditable('totalWorkTime') }}
                  sx={{ flex: 1, ...(!isFieldEditable('totalWorkTime') ? disabledFieldStyles : {}) }}
                  placeholder={isFieldEditable('totalWorkTime') ? "z.B. 120" : undefined}
                />
              )}
            </Box>
          )}

          {/* 2. Kostenstelle field */}
          {isFieldVisible('costCenter') && (
            <TextField
              label="Kostenstelle"
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
              size="small"
              fullWidth
              disabled={!isFieldEditable('costCenter')}
              placeholder="z.B. KST-001, Marketing, IT"
              sx={!isFieldEditable('costCenter') ? disabledFieldStyles : {}}
            />
          )}

          {/* 3. Responsible and Worked By Users */}
          {(isFieldVisible('responsible') || isFieldVisible('workedByUsers')) && (
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              ...(isMobile && { flexDirection: 'column', gap: 1.5 })
            }}>
              {/* Responsible */}
              {isFieldVisible('responsible') && (
                <FormControl sx={{ flex: 1, ...(!isFieldEditable('responsible') ? disabledFieldStyles : {}) }} disabled={!isFieldEditable('responsible')}>
                  <InputLabel>Verantwortlich</InputLabel>
                  <Select
                    label="Verantwortlich"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value as string)}
                    displayEmpty
                    size={isMobile ? "medium" : "small"}
                    renderValue={(selected) => {
                      if (!selected) return '\u00A0';
                      return getDisplayNameFromUserIdSync(selected, 'Nicht zugewiesen');
                    }}
                    sx={{
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: '1.4375em', // Match TextField height
                      },
                      '& .MuiSelect-nativeInput': {
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }
                    }}
                  >
                    <MenuItem value=""><em>Niemand</em></MenuItem>
                    {technicianOptions.map(option => (
                      <MenuItem key={option.userId} value={option.userId}>
                        {option.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Worked By Users */}
              {isFieldVisible('workedByUsers') && (
                <FormControl sx={{ 
                  flex: 1, 
                  ...(!isFieldEditable('workedByUsers') ? disabledFieldStyles : {}),
                  ...(!isFieldEditable('workedByUsers') && {
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'grey.50',
                    }
                  })
                }}>
                  <InputLabel>Bearbeitet von</InputLabel>
                  <Select
                    label="Bearbeitet von"
                    multiple
                    value={workedByUsers}
                    onChange={(e) => setWorkedByUsers(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    input={<OutlinedInput label="Bearbeitet von" size={isMobile ? "medium" : "small"} />}
                    disabled={!isFieldEditable('workedByUsers')}
                    renderValue={(selected) => (
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        overflow: 'hidden',
                        width: '100%',
                        minHeight: '1.4375em', // Match TextField height
                        alignItems: 'center'
                      }}>
                        {selected.length === 0 ? (
                          <span style={{ visibility: 'hidden' }}>\u00A0</span> // Hidden non-breaking space for height
                        ) : (
                          selected.map((userId) => (
                            <Chip 
                              key={userId} 
                              label={getDisplayNameFromUserIdSync(userId, userId)}
                              size="small"
                              sx={{
                                flexShrink: 0,
                                maxWidth: '120px',
                                '& .MuiChip-label': {
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }
                              }}
                            />
                          ))
                        )}
                      </Box>
                    )}
                    size={isMobile ? "medium" : "small"}
                    sx={{
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: '1.4375em', // Match TextField height
                      },
                      '& .MuiSelect-nativeInput': {
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }
                    }}
                  >
                    {userOptions.map((option) => (
                      <MenuItem key={option.userId} value={option.userId} disabled={!isFieldEditable('workedByUsers')}>
                        <Checkbox 
                          checked={workedByUsers.indexOf(option.userId) > -1} 
                          disabled={!isFieldEditable('workedByUsers')}
                          onChange={!isFieldEditable('workedByUsers') ? undefined : () => {}}
                        />
                        <ListItemText primary={option.displayName} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}

          {/* 4. Priority and Planned Completion Date Row */}
          {(isFieldVisible('priority') || isFieldVisible('plannedCompletion')) && (
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              ...(isMobile && { flexDirection: 'column', gap: 1.5 })
            }}>
              {isFieldVisible('priority') && (
                <FormControl sx={{ flex: 1, ...(!isFieldEditable('priority') ? disabledFieldStyles : {}) }} disabled={!isFieldEditable('priority')}>
                  <InputLabel>Dringlichkeit</InputLabel>
                  <Select
                    label="Dringlichkeit"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    size="small"
                  >
                    <MenuItem value="rot">Rot (hoch)</MenuItem>
                    <MenuItem value="gelb">Gelb (mittel)</MenuItem>
                    <MenuItem value="gruen">Grün (niedrig)</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Planned completion date */}
              {isFieldVisible('plannedCompletion') && (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Geplantes Abschlussdatum"
                    value={plannedDate}
                    onChange={(newVal) => setPlannedDate(newVal)}
                    disabled={!isFieldEditable('plannedCompletion')}
                    slotProps={{ textField: { size: 'small', sx: { flex: 1, ...(!isFieldEditable('plannedCompletion') ? disabledFieldStyles : {}) } } }}
                  />
                </LocalizationProvider>
              )}
            </Box>
          )}

          {/* 5. Problem Beschreibung */}
          {isFieldVisible('description') && (
            <TextField
              label="Kurzbeschreibung"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isFieldEditable('description')}
              sx={!isFieldEditable('description') ? disabledFieldStyles : {}}
            />
          )}

          {/* Work tracking controls */}
          {ticketId && isFieldVisible('workTracking') && (
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

                      {isFieldEditable('images') && (
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

                      {isFieldEditable('images') && (
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
            {mode === 'view' ? 'Schließen' : 'Abbrechen'}
          </Button>
          {showSaveButton && (
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