import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface Machine {
  id: string;
  name: string;
  machineNumber: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  startDate: string; // ISO date string
  recurrence: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc. (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly/yearly)
  month?: number; // 1-12 (for yearly)
  endDate?: string; // ISO date string, undefined for no end
}

interface MachineContextValue {
  machines: Machine[];
  addMachine: (machine: Machine) => void;
  updateMachine: (machineId: string, partial: Partial<Machine>) => void;
  deleteMachine: (machineId: string) => void;
  getMachine: (machineId: string) => Machine | undefined;
  getAllMachines: () => Machine[];
}

const MachineContext = createContext<MachineContextValue | undefined>(undefined);

// Mock data with flat machine structure
let mockMachines: Machine[] = [
  {
    id: 'm1', 
    name: 'Presse 1',
    machineNumber: 'M-001',
    tasks: [
      {
        id: 't1',
        title: 'Hydraulikölwechsel',
        startDate: new Date(2024, 0, 1).toISOString(),
        recurrence: 'monthly',
        interval: 3,
        dayOfMonth: 15,
      },
      {
        id: 't2',
        title: 'Sicherheitsinspektion',
        startDate: new Date(2024, 0, 8).toISOString(),
        recurrence: 'weekly',
        interval: 1,
        daysOfWeek: [1],
      }
    ]
  },
  {
    id: 'm2', 
    name: 'Fräse A',
    machineNumber: 'M-002',
    tasks: [
      {
        id: 't3',
        title: 'Kühlmittelwechsel',
        startDate: new Date(2024, 0, 1).toISOString(),
        recurrence: 'weekly',
        interval: 2,
        daysOfWeek: [3],
      }
    ] 
  },
  { id: 'm3', name: 'Schweißroboter Alpha', machineNumber: 'M-003', tasks: [] },
  { id: 'm4', name: 'CNC Drehmaschine D1', machineNumber: 'M-004', tasks: [] },
  { id: 'm5', name: 'Laserschneider LS-200', machineNumber: 'M-005', tasks: [] },
  { id: 'm6', name: 'Schweißstation Beta', machineNumber: 'M-006', tasks: [] },
  { id: 'm7', name: 'Fräse B', machineNumber: 'M-007', tasks: [] },
  { id: 'm8', name: 'Bohrmaschine BD-15', machineNumber: 'M-008', tasks: [] },
  { id: 'm9', name: 'Schleifmaschine SG-300', machineNumber: 'M-009', tasks: [] },
  { id: 'm10', name: 'Presse 2', machineNumber: 'M-010', tasks: [] },
  { id: 'm11', name: 'Stanzmaschine ST-400', machineNumber: 'M-011', tasks: [] },
  { id: 'm12', name: 'Hydraulikpresse HP-500', machineNumber: 'M-012', tasks: [] },
  { id: 'm13', name: 'Roboterarm RX-7', machineNumber: 'M-013', tasks: [] },
  { id: 'm14', name: 'Schweißroboter Gamma', machineNumber: 'M-014', tasks: [] },
  { id: 'm15', name: 'Förderband FB-100', machineNumber: 'M-015', tasks: [] },
  { id: 'm16', name: 'Verpackungsmaschine VM-250', machineNumber: 'M-016', tasks: [] },
  { id: 'm17', name: 'CNC Fräse CF-800', machineNumber: 'M-017', tasks: [] },
  { id: 'm18', name: 'Drehmaschine DM-450', machineNumber: 'M-018', tasks: [] },
  { id: 'm19', name: 'Bohrwerk BW-600', machineNumber: 'M-019', tasks: [] },
  { id: 'm20', name: 'Hobel HB-350', machineNumber: 'M-020', tasks: [] },
  { id: 'm21', name: 'Säge SG-220', machineNumber: 'M-021', tasks: [] },
  { id: 'm22', name: 'Spritzgießmaschine SG-1200', machineNumber: 'M-022', tasks: [] },
  { id: 'm23', name: 'Extruder EX-400', machineNumber: 'M-023', tasks: [] },
  { id: 'm24', name: 'Thermoformmaschine TF-600', machineNumber: 'M-024', tasks: [] },
  { id: 'm25', name: 'Granulator GR-800', machineNumber: 'M-025', tasks: [] },
  { id: 'm26', name: 'Compoundierer CP-300', machineNumber: 'M-026', tasks: [] },
  { id: 'm27', name: 'Kältemaschine KM-150', machineNumber: 'M-027', tasks: [] },
  { id: 'm28', name: 'Montagestation MS-01', machineNumber: 'M-028', tasks: [] },
  { id: 'm29', name: 'Montagelinie ML-100', machineNumber: 'M-029', tasks: [] },
  { id: 'm30', name: 'Schraubstation SS-50', machineNumber: 'M-030', tasks: [] },
  { id: 'm31', name: 'Prüfstation PS-25', machineNumber: 'M-031', tasks: [] },
  { id: 'm32', name: 'Verpackungsroboter VR-200', machineNumber: 'M-032', tasks: [] },
  { id: 'm33', name: 'Etikettiermaschine EM-100', machineNumber: 'M-033', tasks: [] },
  { id: 'm34', name: 'Folienverpackung FV-300', machineNumber: 'M-034', tasks: [] },
  { id: 'm35', name: 'Kartoniermaschine KM-180', machineNumber: 'M-035', tasks: [] },
  { id: 'm36', name: 'Palettierer PT-500', machineNumber: 'M-036', tasks: [] },
  { id: 'm37', name: 'Kompressor', machineNumber: 'M-037', tasks: [] },
  { id: 'm38', name: 'Koordinatenmessgerät KMG-100', machineNumber: 'M-038', tasks: [] },
  { id: 'm39', name: 'Röntgenprüfgerät RP-250', machineNumber: 'M-039', tasks: [] },
  { id: 'm40', name: 'Härteprüfgerät HP-80', machineNumber: 'M-040', tasks: [] },
  { id: 'm41', name: 'Testmaschine TM-100', machineNumber: 'M-041', tasks: [] },
  { id: 'm42', name: 'Prüfgerät PG-200', machineNumber: 'M-042', tasks: [] },
  { id: 'm43', name: 'Kalibrierstation KS-150', machineNumber: 'M-043', tasks: [] },
];

export const MachineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [machines, setMachines] = useState<Machine[]>(() => [...mockMachines]);

  // Machine operations
  const addMachine = useCallback((machine: Machine) => {
    mockMachines = [...mockMachines, machine];
    setMachines([...mockMachines]);
  }, []);

  const updateMachine = useCallback((machineId: string, partial: Partial<Machine>) => {
    mockMachines = mockMachines.map(m => m.id === machineId ? { ...m, ...partial } : m);
    setMachines([...mockMachines]);
  }, []);

  const deleteMachine = useCallback((machineId: string) => {
    mockMachines = mockMachines.filter(m => m.id !== machineId);
    setMachines([...mockMachines]);
  }, []);

  const getMachine = useCallback((machineId: string) => {
    return mockMachines.find(m => m.id === machineId);
  }, []);

  const getAllMachines = useCallback(() => {
    return [...mockMachines];
  }, []);

  const value = useMemo(() => ({
    machines,
    addMachine,
    updateMachine,
    deleteMachine,
    getMachine,
    getAllMachines,
  }), [machines, addMachine, updateMachine, deleteMachine, getMachine, getAllMachines]);

  return (
    <MachineContext.Provider value={value}>
      {children}
    </MachineContext.Provider>
  );
};

export const useMachineContext = () => {
  const context = useContext(MachineContext);
  if (context === undefined) {
    throw new Error('useMachineContext must be used within a MachineProvider');
  }
  return context;
}; 