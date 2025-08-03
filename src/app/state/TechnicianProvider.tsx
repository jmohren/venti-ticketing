import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { restApiClient } from '@/core/api/rest/RestApiClient';

export interface Technician {
  id: number;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface TechnicianContextValue {
  technicians: Technician[];
  loading: boolean;
  error: string | null;
  addTechnician: (technician: Omit<Technician, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTechnician: (id: number, partial: Partial<Technician>) => Promise<void>;
  deleteTechnician: (id: number) => Promise<void>;
  getTechnicianById: (id: number) => Technician | undefined;
  getTechnicianByName: (name: string) => Technician | undefined;
  getActiveTechnicians: () => Technician[];
  getTechnicianNames: () => string[];
  getTechnicianDisplayName: (technician: Technician) => string;
  refreshTechnicians: () => Promise<void>;
}

const TechnicianContext = createContext<TechnicianContextValue | undefined>(undefined);

export const TechnicianProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load technicians from API
  const loadTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await restApiClient.get<Technician>('technicians', {
        order: ['created_at.desc']
      });
      setTechnicians(data);
    } catch (err) {
      console.error('Failed to load technicians:', err);
      setError('Failed to load technicians');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  const addTechnician = useCallback(async (technician: Omit<Technician, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const newTechnician = await restApiClient.create<Technician>('technicians', technician);
      setTechnicians(prev => [newTechnician, ...prev]);
    } catch (err) {
      console.error('Failed to add technician:', err);
      setError('Failed to add technician');
      throw err;
    }
  }, []);

  const updateTechnician = useCallback(async (id: number, partial: Partial<Technician>) => {
    try {
      setError(null);
      const updatedTechnician = await restApiClient.update<Technician>('technicians', id, partial);
      setTechnicians(prev => prev.map(t => t.id === id ? updatedTechnician : t));
    } catch (err) {
      console.error('Failed to update technician:', err);
      setError('Failed to update technician');
      throw err;
    }
  }, []);

  const deleteTechnician = useCallback(async (id: number) => {
    try {
      setError(null);
      await restApiClient.deleteById('technicians', id);
      setTechnicians(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete technician:', err);
      setError('Failed to delete technician');
      throw err;
    }
  }, []);

  const getTechnicianById = useCallback((id: number) => {
    return technicians.find(t => t.id === id);
  }, [technicians]);

  const getTechnicianByName = useCallback((name: string) => {
    return technicians.find(t => getTechnicianDisplayName(t) === name);
  }, [technicians]);

  const getActiveTechnicians = useCallback(() => {
    // All technicians in the database are considered active
    return technicians;
  }, [technicians]);

  const getTechnicianDisplayName = useCallback((technician: Technician) => {
    if (technician.firstName && technician.lastName) {
      return `${technician.firstName} ${technician.lastName}`;
    }
    return technician.email;
  }, []);

  const getTechnicianNames = useCallback(() => {
    return technicians.map(t => getTechnicianDisplayName(t));
  }, [technicians, getTechnicianDisplayName]);

  const refreshTechnicians = useCallback(async () => {
    await loadTechnicians();
  }, [loadTechnicians]);

  const value = useMemo(() => ({
    technicians,
    loading,
    error,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    getTechnicianById,
    getTechnicianByName,
    getActiveTechnicians,
    getTechnicianNames,
    getTechnicianDisplayName,
    refreshTechnicians,
  }), [technicians, loading, error, addTechnician, updateTechnician, deleteTechnician, getTechnicianById, getTechnicianByName, getActiveTechnicians, getTechnicianNames, getTechnicianDisplayName, refreshTechnicians]);

  return <TechnicianContext.Provider value={value}>{children}</TechnicianContext.Provider>;
};

export const useTechnicianContext = () => {
  const context = useContext(TechnicianContext);
  if (!context) {
    throw new Error('useTechnicianContext must be used within TechnicianProvider');
  }
  return context;
}; 