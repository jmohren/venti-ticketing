import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface Technician {
  id: string;
  name: string;
  email?: string;
  department?: string;
  isActive: boolean;
}

interface TechnicianContextValue {
  technicians: Technician[];
  addTechnician: (technician: Technician) => void;
  updateTechnician: (id: string, partial: Partial<Technician>) => void;
  deleteTechnician: (id: string) => void;
  getTechnicianById: (id: string) => Technician | undefined;
  getTechnicianByName: (name: string) => Technician | undefined;
  getActiveTechnicians: () => Technician[];
  getTechnicianNames: () => string[];
}

const TechnicianContext = createContext<TechnicianContextValue | undefined>(undefined);

// Mock data for technicians
let mockTechnicians: Technician[] = [
  {
    id: 't1',
    name: 'Johannes Mohren',
    email: 'johannes.mohren@company.com',
    department: 'Maintenance',
    isActive: true,
  },
  {
    id: 't2',
    name: 'Max Mustermann',
    email: 'max.mustermann@company.com',
    department: 'Maintenance',
    isActive: true,
  },
  {
    id: 't3',
    name: 'Julia Schneider',
    email: 'julia.schneider@company.com',
    department: 'Maintenance',
    isActive: true,
  },
  {
    id: 't4',
    name: 'Ali Öztürk',
    email: 'ali.oeztuerk@company.com',
    department: 'Maintenance',
    isActive: true,
  },
  {
    id: 't5',
    name: 'Sarah Weber',
    email: 'sarah.weber@company.com',
    department: 'Maintenance',
    isActive: true,
  },
  {
    id: 't6',
    name: 'Michael Schmidt',
    email: 'michael.schmidt@company.com',
    department: 'Maintenance',
    isActive: true,
  },
  {
    id: 't7',
    name: 'Anna Müller',
    email: 'anna.mueller@company.com',
    department: 'Maintenance',
    isActive: true,
  },
  {
    id: 't8',
    name: 'Thomas Becker',
    email: 'thomas.becker@company.com',
    department: 'Maintenance',
    isActive: true,
  },
  {
    id: 't9',
    name: 'Lisa Fischer',
    email: 'lisa.fischer@company.com',
    department: 'Maintenance',
    isActive: true,
  },
  {
    id: 't10',
    name: 'David Wagner',
    email: 'david.wagner@company.com',
    department: 'Maintenance',
    isActive: true,
  },
];

export const TechnicianProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [technicians, setTechnicians] = useState<Technician[]>(() => [...mockTechnicians]);

  const addTechnician = useCallback((technician: Technician) => {
    mockTechnicians = [...mockTechnicians, technician];
    setTechnicians([...mockTechnicians]);
  }, []);

  const updateTechnician = useCallback((id: string, partial: Partial<Technician>) => {
    mockTechnicians = mockTechnicians.map(t => t.id === id ? { ...t, ...partial } : t);
    setTechnicians([...mockTechnicians]);
  }, []);

  const deleteTechnician = useCallback((id: string) => {
    mockTechnicians = mockTechnicians.filter(t => t.id !== id);
    setTechnicians([...mockTechnicians]);
  }, []);

  const getTechnicianById = useCallback((id: string) => {
    return mockTechnicians.find(t => t.id === id);
  }, []);

  const getTechnicianByName = useCallback((name: string) => {
    return mockTechnicians.find(t => t.name === name);
  }, []);

  const getActiveTechnicians = useCallback(() => {
    return mockTechnicians.filter(t => t.isActive);
  }, []);

  const getTechnicianNames = useCallback(() => {
    return mockTechnicians.filter(t => t.isActive).map(t => t.name);
  }, []);

  const value = useMemo(() => ({
    technicians,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    getTechnicianById,
    getTechnicianByName,
    getActiveTechnicians,
    getTechnicianNames,
  }), [technicians, addTechnician, updateTechnician, deleteTechnician, getTechnicianById, getTechnicianByName, getActiveTechnicians, getTechnicianNames]);

  return <TechnicianContext.Provider value={value}>{children}</TechnicianContext.Provider>;
};

export const useTechnicianContext = () => {
  const context = useContext(TechnicianContext);
  if (!context) {
    throw new Error('useTechnicianContext must be used within TechnicianProvider');
  }
  return context;
}; 