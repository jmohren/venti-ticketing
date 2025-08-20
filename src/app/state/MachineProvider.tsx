import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { restApiClient } from '@/core/api/rest/RestApiClient';

export interface MachineFilters {
  locations?: string[]; // Multi-select
  work_stations?: string[]; // Multi-select
  manufacturers?: string[]; // Multi-select
  abc_classifications?: string[]; // Multi-select
  equipment_types?: string[]; // Multi-select
  search?: string; // Free text search
}

export interface MachinePagination {
  page: number; // 0-based
  limit: number; // machines per page
  total: number; // total machines count
  totalPages: number; // total pages
}

export interface MachineFilterOptions {
  locations: string[];
  work_stations: string[];
  manufacturers: string[];
  abc_classifications: string[];
  equipment_types: string[];
}

// Minimal machine data for global loading
export interface MachineBasic {
  equipment_number: string; // Primary key, display as "Equipment Nummer"
  equipment_description: string; // Display as "Name"
}

// Full machine data (loaded on demand)
export interface Machine extends MachineBasic {
  tasks?: Task[];
  created_at?: string;
  updated_at?: string;
  // Expanded fields with German display names
  equipment_type?: string; // "Equipmenttyp"
  location?: string; // "Standort"
  sort_field?: string; // "Sortierfeld"
  manufacturer_serial_number?: string; // "Hersteller Seriennummer"
  work_station?: string; // "Arbeitsplatz"
  type_designation?: string; // "Typbezeichnung"
  manufacturer_part_number?: string; // "Hersteller Teilnummer"
  construction_year?: number; // "Baujahr"
  size_dimensions?: string; // "Größe/Abmessungen"
  manufacturer?: string; // "Hersteller"
  abc_classification?: 'A' | 'B' | 'C' | 'D'; // "ABC-Klassifizierung"
}

export interface Task {
  id: string;
  title: string;
  startDate: string;
  recurrence: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  month?: number;
  endDate?: string;
}

interface MachineContextValue {
  // Shared data loading functions
  loadMachines: (filters: MachineFilters, page: number, searchField?: 'equipment_number' | 'equipment_description') => Promise<{ data: MachineBasic[], count: number, totalPages: number }>;
  filterOptions: MachineFilterOptions | null;
  filterOptionsLoading: boolean;
  
  // Machine CRUD operations
  addMachine: (machine: Omit<Machine, 'created_at' | 'updated_at'>) => Promise<Machine>;
  updateMachine: (machineId: string, partial: Partial<Machine>) => Promise<Machine>;
  deleteMachine: (machineId: string) => Promise<void>;
  getMachine: (machineId: string) => Promise<Machine>; // Load full machine details on demand
}

const MachineContext = createContext<MachineContextValue | undefined>(undefined);

export const MachineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filterOptions, setFilterOptions] = useState<MachineFilterOptions | null>(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // Shared function to load machines with pagination and filtering
  const loadMachines = useCallback(async (currentFilters: MachineFilters, currentPage: number, searchField?: 'equipment_number' | 'equipment_description') => {
    // Build query parameters
    const params: any = {
      select: ['equipment_number', 'equipment_description'],
      order: ['equipment_description.asc'],
      limit: 100, // Fixed limit
      offset: currentPage * 100
    };
    
    // Add filters
    if (currentFilters.locations?.length) {
      params.location = `in.(${currentFilters.locations.join(',')})`;
    }
    if (currentFilters.work_stations?.length) {
      params.work_station = `in.(${currentFilters.work_stations.join(',')})`;
    }
    if (currentFilters.manufacturers?.length) {
      params.manufacturer = `in.(${currentFilters.manufacturers.join(',')})`;
    }
    if (currentFilters.abc_classifications?.length) {
      params.abc_classification = `in.(${currentFilters.abc_classifications.join(',')})`;
    }
    if (currentFilters.equipment_types?.length) {
      params.equipment_type = `in.(${currentFilters.equipment_types.join(',')})`;
    }
    if (currentFilters.search?.trim()) {
      const searchTerm = currentFilters.search.trim();
      
      if (searchField === 'equipment_number') {
        // Equipment number field: now TEXT, supports LIKE operations
        const isNumeric = /^\d+$/.test(searchTerm);
        if (isNumeric) {
          // Use LIKE for partial matching: "62" finds "629", "620", etc.
          params.equipment_number = `like.${searchTerm}*`;
        } else {
          // For non-numeric, search in description
          params.equipment_description = `ilike.*${searchTerm}*`;
        }
      } else if (searchField === 'equipment_description') {
        // Machine description field: partial match
        params.equipment_description = `ilike.*${searchTerm}*`;
      } else {
        // Default behavior for general searches (backward compatibility)
        const isNumeric = /^\d+$/.test(searchTerm);
        if (isNumeric) {
          params.equipment_number = `eq.${searchTerm}`;
        } else {
          params.equipment_description = `ilike.*${searchTerm}*`;
        }
      }
    }
    
    // Use PostgREST's native count mechanism
    const result = await restApiClient.getWithCount<MachineBasic>('machines_imported', params);
    const { data, count: total } = result;
    const totalPages = Math.ceil(total / 100);
    
    return { data, count: total, totalPages };
  }, []);

  // Load filter options (for dropdown values)
  const loadFilterOptions = useCallback(async () => {
    try {
      setFilterOptionsLoading(true);
      
      // Get all machines with only the filter fields
      const allMachines = await restApiClient.get<{
        location?: string;
        work_station?: string;
        manufacturer?: string;
        abc_classification?: string;
        equipment_type?: string;
      }>('machines_imported', {
        select: ['location', 'work_station', 'manufacturer', 'abc_classification', 'equipment_type']
      });
      
      // Extract unique values for each filter
      const locations = [...new Set(allMachines.map(m => m.location).filter((v): v is string => !!v))].sort();
      const work_stations = [...new Set(allMachines.map(m => m.work_station).filter((v): v is string => !!v))].sort();
      const manufacturers = [...new Set(allMachines.map(m => m.manufacturer).filter((v): v is string => !!v))].sort();
      const abc_classifications = [...new Set(allMachines.map(m => m.abc_classification).filter((v): v is string => !!v))].sort();
      const equipment_types = [...new Set(allMachines.map(m => m.equipment_type).filter((v): v is string => !!v))].sort();
      
      setFilterOptions({
        locations,
        work_stations,
        manufacturers,
        abc_classifications,
        equipment_types
      });
    } catch (err) {
      console.error('Failed to load filter options:', err);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  // Initial load of filter options
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const addMachine = useCallback(async (machine: Omit<Machine, 'created_at' | 'updated_at'>) => {
    try {
      // Defensively strip server-managed fields in case they are present on the object
      const { created_at: _omitCreatedAt, updated_at: _omitUpdatedAt, ...payload } = machine as any;
      const newMachine = await restApiClient.create<Machine>('machines_imported', payload);
      return newMachine;
    } catch (err) {
      console.error('Failed to add machine:', err);
      throw err;
    }
  }, []);

  const updateMachine = useCallback(async (machineId: string, partial: Partial<Machine>) => {
    try {
      const updatedMachine = await restApiClient.update<Machine>('machines_imported', machineId, partial);
      return updatedMachine;
    } catch (err) {
      console.error('Failed to update machine:', err);
      throw err;
    }
  }, []);

  const deleteMachine = useCallback(async (machineId: string) => {
    try {
      await restApiClient.delete('machines_imported', { equipment_number: `eq.${machineId}` });
    } catch (err) {
      console.error('Failed to delete machine:', err);
      throw err;
    }
  }, []);

  // Get full machine details on demand
  const getMachine = useCallback(async (machineId: string): Promise<Machine> => {
    try {
      const results = await restApiClient.get<Machine>('machines_imported', {
        equipment_number: `eq.${machineId}`,
        limit: 1
      });
      
      if (results.length === 0) {
        throw new Error(`Machine with equipment number ${machineId} not found`);
      }
      
      return results[0];
    } catch (err) {
      console.error('Failed to load machine details:', err);
      throw err;
    }
  }, []);

  const value = useMemo(() => ({
    loadMachines,
    filterOptions,
    filterOptionsLoading,
    addMachine,
    updateMachine,
    deleteMachine,
    getMachine,
  }), [loadMachines, filterOptions, filterOptionsLoading, addMachine, updateMachine, deleteMachine, getMachine]);

  return <MachineContext.Provider value={value}>{children}</MachineContext.Provider>;
};

export const useMachineContext = () => {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachineContext must be used within MachineProvider');
  }
  return context;
}; 