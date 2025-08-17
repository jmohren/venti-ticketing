import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { restApiClient } from '@/core/api/rest/RestApiClient';
import { useUsersContext } from '@/core/state/UsersProvider';

export interface Technician {
  id: number;
  userId: string;
  created_at?: string;
  updated_at?: string;
}

interface TechnicianContextValue {
  technicians: Technician[];
  loading: boolean;
  error: string | null;
  addTechnician: (technician: { userId: string }) => Promise<void>;
  updateTechnician: (id: number, partial: Partial<Technician>) => Promise<void>;
  deleteTechnician: (id: number) => Promise<void>;
  getTechnicianById: (id: number) => Technician | undefined;
  getTechnicianByName: (name: string) => Technician | undefined;
  getActiveTechnicians: () => Technician[];
  getTechnicianNames: () => string[];
  getTechnicianDisplayName: (technician: Technician) => string;
  getTechnicianEmail: (technician: Technician) => string;
  refreshTechnicians: () => Promise<void>;
}

const TechnicianContext = createContext<TechnicianContextValue | undefined>(undefined);

export const TechnicianProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users } = useUsersContext();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load technicians from API
  const loadTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rawData = await restApiClient.get<any>('technicians', {
        order: ['created_at.desc']
      });
      
      // Filter out legacy firstName, lastName, email fields from API response
      const cleanData: Technician[] = rawData.map((tech: any) => ({
        id: tech.id,
        userId: tech.userId,
        created_at: tech.created_at,
        updated_at: tech.updated_at
      }));
      
      setTechnicians(cleanData);
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

  const addTechnician = useCallback(async (technician: { userId: string }) => {
    try {
      setError(null);
      // Only send userId to backend; legacy name/email fields will be removed
      const payload = { userId: technician.userId };
      const rawResponse = await restApiClient.create<any>('technicians', payload);
      
      // Filter out legacy fields from response before adding to state
      const cleanTechnician: Technician = {
        id: rawResponse.id,
        userId: rawResponse.userId,
        created_at: rawResponse.created_at,
        updated_at: rawResponse.updated_at
      };
      
      setTechnicians(prev => [cleanTechnician, ...prev]);
    } catch (err) {
      console.error('Failed to add technician:', err);
      setError('Failed to add technician');
      throw err;
    }
  }, []);

  const updateTechnician = useCallback(async (id: number, partial: Partial<Technician>) => {
    try {
      setError(null);
      const rawResponse = await restApiClient.update<any>('technicians', id, partial);
      
      // Filter out legacy fields from response before updating state
      const cleanTechnician: Technician = {
        id: rawResponse.id,
        userId: rawResponse.userId,
        created_at: rawResponse.created_at,
        updated_at: rawResponse.updated_at
      };
      
      setTechnicians(prev => prev.map(t => t.id === id ? cleanTechnician : t));
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

  const getActiveTechnicians = useCallback(() => {
    // All technicians in the database are considered active
    return technicians;
  }, [technicians]);

  // Use centralized function from UsersProvider
  const { getDisplayNameFromUserId } = useUsersContext();
  
  const getTechnicianDisplayName = useCallback((_technician: Technician) => {
    // Synchronous fallback for UI usage
    return _technician.userId;
  }, []);

  const getTechnicianByName = useCallback((name: string) => {
    // Names currently equal userId labels; find by userId
    return technicians.find(t => t.userId === name);
  }, [technicians]);

  const getTechnicianEmail = useCallback((technician: Technician) => {
    const user = users.find(u => u.userId === technician.userId);
    if (user) return user.email;
    // User ID not found in database - return fallback
    console.warn(`⚠️ [TECHNICIANS] User ID not found for email lookup: ${technician.userId}`);
    return '-';
  }, [users]);

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
    getTechnicianEmail,
    refreshTechnicians,
  }), [technicians, loading, error, addTechnician, updateTechnician, deleteTechnician, getTechnicianById, getTechnicianByName, getActiveTechnicians, getTechnicianNames, getTechnicianDisplayName, getTechnicianEmail, refreshTechnicians]);

  return <TechnicianContext.Provider value={value}>{children}</TechnicianContext.Provider>;
};

export const useTechnicianContext = () => {
  const context = useContext(TechnicianContext);
  if (!context) {
    throw new Error('useTechnicianContext must be used within TechnicianProvider');
  }
  return context;
}; 