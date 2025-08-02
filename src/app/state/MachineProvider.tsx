import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { restApiClient } from '@/core/api/rest/RestApiClient';

export interface Machine {
  id: number;
  name: string;
  machineNumber: string;
  tasks?: Task[];
  created_at?: string;
  updated_at?: string;
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
  machines: Machine[];
  loading: boolean;
  error: string | null;
  addMachine: (machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateMachine: (machineId: number, partial: Partial<Machine>) => Promise<void>;
  deleteMachine: (machineId: number) => Promise<void>;
  getMachine: (machineId: number) => Machine | undefined;
  getAllMachines: () => Machine[];
  refreshMachines: () => Promise<void>;
}

const MachineContext = createContext<MachineContextValue | undefined>(undefined);

export const MachineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load machines from API
  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await restApiClient.get<Machine>('machines', {
        order: ['name.asc']
      });
      setMachines(data);
    } catch (err) {
      console.error('Failed to load machines:', err);
      setError('Failed to load machines');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  const addMachine = useCallback(async (machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const newMachine = await restApiClient.create<Machine>('machines', machine);
      setMachines(prev => [...prev, newMachine]);
    } catch (err) {
      console.error('Failed to add machine:', err);
      setError('Failed to add machine');
      throw err;
    }
  }, []);

  const updateMachine = useCallback(async (machineId: number, partial: Partial<Machine>) => {
    try {
      setError(null);
      const updatedMachine = await restApiClient.update<Machine>('machines', machineId, partial);
      setMachines(prev => prev.map(m => m.id === machineId ? updatedMachine : m));
    } catch (err) {
      console.error('Failed to update machine:', err);
      setError('Failed to update machine');
      throw err;
    }
  }, []);

  const deleteMachine = useCallback(async (machineId: number) => {
    try {
      setError(null);
      await restApiClient.deleteById('machines', machineId);
      setMachines(prev => prev.filter(m => m.id !== machineId));
    } catch (err) {
      console.error('Failed to delete machine:', err);
      setError('Failed to delete machine');
      throw err;
    }
  }, []);

  const getMachine = useCallback((machineId: number) => {
    return machines.find(m => m.id === machineId);
  }, [machines]);

  const getAllMachines = useCallback(() => {
    return machines;
  }, [machines]);

  const refreshMachines = useCallback(async () => {
    await loadMachines();
  }, [loadMachines]);

  const value = useMemo(() => ({
    machines,
    loading,
    error,
    addMachine,
    updateMachine,
    deleteMachine,
    getMachine,
    getAllMachines,
    refreshMachines,
  }), [machines, loading, error, addMachine, updateMachine, deleteMachine, getMachine, getAllMachines, refreshMachines]);

  return <MachineContext.Provider value={value}>{children}</MachineContext.Provider>;
};

export const useMachineContext = () => {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachineContext must be used within MachineProvider');
  }
  return context;
}; 