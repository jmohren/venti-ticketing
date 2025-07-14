import { useState, useCallback } from 'react';

export interface Machine {
  id: string;
  name: string;
  room: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  recurrence: 'daily' | 'weekly' | 'yearly' | 'custom';
}

let mockMachines: Machine[] = [
  { id: 'm1', name: 'Presse 1', room: 'Werk 1 – Raum 101', tasks: [] },
  { id: 'm2', name: 'Fräse A', room: 'Werk 1 – Raum 102', tasks: [] },
  { id: 'm3', name: 'Schweißroboter', room: 'Werk 2 – Raum 202', tasks: [] },
];

export const useMachines = () => {
  const [machines, setMachines] = useState<Machine[]>(() => [...mockMachines]);

  const addMachine = useCallback((machine: Machine) => {
    mockMachines = [...mockMachines, machine];
    setMachines([...mockMachines]);
  }, []);

  const updateMachine = useCallback((id: string, partial: Partial<Machine>) => {
    mockMachines = mockMachines.map(m => m.id === id ? { ...m, ...partial } : m);
    setMachines([...mockMachines]);
  }, []);

  const getMachine = useCallback((id: string) => mockMachines.find(m => m.id === id), []);

  return { machines, addMachine, updateMachine, getMachine };
}; 