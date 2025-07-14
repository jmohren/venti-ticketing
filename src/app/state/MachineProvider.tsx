import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface Machine {
  id: string;
  name: string;
  tasks?: Task[];
}

export interface Room {
  id: string;
  name: string;
  machines: Machine[];
}

export interface Task {
  id: string;
  title: string;
  recurrence: 'daily' | 'weekly' | 'yearly' | 'custom';
}

interface MachineContextValue {
  rooms: Room[];
  addRoom: (room: Room) => void;
  updateRoom: (id: string, partial: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  addMachine: (roomId: string, machine: Machine) => void;
  updateMachine: (roomId: string, machineId: string, partial: Partial<Machine>) => void;
  deleteMachine: (roomId: string, machineId: string) => void;
  getRoom: (id: string) => Room | undefined;
  getMachine: (roomId: string, machineId: string) => Machine | undefined;
  getAllMachines: () => (Machine & { room: string; roomId: string })[];
}

const MachineContext = createContext<MachineContextValue | undefined>(undefined);

// Mock data with hierarchical structure
let mockRooms: Room[] = [
  {
    id: 'r1',
    name: 'Werk 1 – Raum 101',
    machines: [
      { id: 'm1', name: 'Presse 1', tasks: [] },
      { id: 'm2', name: 'Fräse A', tasks: [] },
      { id: 'm3', name: 'Schweißroboter Alpha', tasks: [] },
      { id: 'm4', name: 'CNC Drehmaschine D1', tasks: [] },
    ]
  },
  {
    id: 'r2', 
    name: 'Werk 1 – Raum 102',
    machines: [
      { id: 'm5', name: 'Laserschneider LS-200', tasks: [] },
      { id: 'm6', name: 'Schweißstation Beta', tasks: [] },
      { id: 'm7', name: 'Fräse B', tasks: [] },
      { id: 'm8', name: 'Bohrmaschine BD-15', tasks: [] },
      { id: 'm9', name: 'Schleifmaschine SG-300', tasks: [] },
    ]
  },
  {
    id: 'r2b',
    name: 'Raum 1021',
    machines: [
      { id: 'm41', name: 'Testmaschine TM-100', tasks: [] },
      { id: 'm42', name: 'Prüfgerät PG-200', tasks: [] },
      { id: 'm43', name: 'Kalibrierstation KS-150', tasks: [] },
    ]
  },
  {
    id: 'r3',
    name: 'Werk 1 – Raum 103',
    machines: [
      { id: 'm10', name: 'Presse 2', tasks: [] },
      { id: 'm11', name: 'Stanzmaschine ST-400', tasks: [] },
      { id: 'm12', name: 'Hydraulikpresse HP-500', tasks: [] },
    ]
  },
  {
    id: 'r4',
    name: 'Werk 2 – Raum 201',
    machines: [
      { id: 'm13', name: 'Roboterarm RX-7', tasks: [] },
      { id: 'm14', name: 'Schweißroboter Gamma', tasks: [] },
      { id: 'm15', name: 'Förderband FB-100', tasks: [] },
      { id: 'm16', name: 'Verpackungsmaschine VM-250', tasks: [] },
    ]
  },
  {
    id: 'r5',
    name: 'Werk 2 – Raum 202',
    machines: [
      { id: 'm17', name: 'CNC Fräse CF-800', tasks: [] },
      { id: 'm18', name: 'Drehmaschine DM-450', tasks: [] },
      { id: 'm19', name: 'Bohrwerk BW-600', tasks: [] },
      { id: 'm20', name: 'Hobel HB-350', tasks: [] },
      { id: 'm21', name: 'Säge SG-220', tasks: [] },
    ]
  },
  {
    id: 'r6',
    name: 'Werk 2 – Raum 203',
    machines: [
      { id: 'm22', name: 'Montagelinie ML-1', tasks: [] },
      { id: 'm23', name: 'Prüfstand PS-100', tasks: [] },
      { id: 'm24', name: 'Lackierkabine LK-300', tasks: [] },
    ]
  },
  {
    id: 'r7',
    name: 'Werk 3 – Raum 301',
    machines: [
      { id: 'm25', name: 'Gießmaschine GM-500', tasks: [] },
      { id: 'm26', name: 'Schmelzofen SO-800', tasks: [] },
      { id: 'm27', name: 'Kühlturm KT-150', tasks: [] },
      { id: 'm28', name: 'Entgratungsmaschine EM-200', tasks: [] },
    ]
  },
  {
    id: 'r8',
    name: 'Werk 3 – Raum 302',
    machines: [
      { id: 'm29', name: 'Spritzgussmaschine SG-400', tasks: [] },
      { id: 'm30', name: 'Extruder EX-600', tasks: [] },
      { id: 'm31', name: 'Granulator GR-250', tasks: [] },
      { id: 'm32', name: 'Mischmaschine MM-180', tasks: [] },
      { id: 'm33', name: 'Trockner TR-300', tasks: [] },
    ]
  },
  {
    id: 'r9',
    name: 'Lager – Raum 401',
    machines: [
      { id: 'm34', name: 'Gabelstapler GS-1', tasks: [] },
      { id: 'm35', name: 'Gabelstapler GS-2', tasks: [] },
      { id: 'm36', name: 'Lagerkran LK-500', tasks: [] },
      { id: 'm37', name: 'Förderband FB-200', tasks: [] },
    ]
  },
  {
    id: 'r10',
    name: 'Qualitätskontrolle – Raum 501',
    machines: [
      { id: 'm38', name: 'Koordinatenmessgerät KMG-100', tasks: [] },
      { id: 'm39', name: 'Röntgenprüfgerät RP-250', tasks: [] },
      { id: 'm40', name: 'Härteprüfgerät HP-80', tasks: [] },
    ]
  }
];

export const MachineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(() => [...mockRooms]);

  // Room operations
  const addRoom = useCallback((room: Room) => {
    mockRooms = [...mockRooms, room];
    setRooms([...mockRooms]);
  }, []);

  const updateRoom = useCallback((id: string, partial: Partial<Room>) => {
    mockRooms = mockRooms.map(r => r.id === id ? { ...r, ...partial } : r);
    setRooms([...mockRooms]);
  }, []);

  const deleteRoom = useCallback((id: string) => {
    mockRooms = mockRooms.filter(r => r.id !== id);
    setRooms([...mockRooms]);
  }, []);

  // Machine operations
  const addMachine = useCallback((roomId: string, machine: Machine) => {
    mockRooms = mockRooms.map(r => 
      r.id === roomId 
        ? { ...r, machines: [...r.machines, machine] }
        : r
    );
    setRooms([...mockRooms]);
  }, []);

  const updateMachine = useCallback((roomId: string, machineId: string, partial: Partial<Machine>) => {
    mockRooms = mockRooms.map(r =>
      r.id === roomId
        ? { ...r, machines: r.machines.map(m => m.id === machineId ? { ...m, ...partial } : m) }
        : r
    );
    setRooms([...mockRooms]);
  }, []);

  const deleteMachine = useCallback((roomId: string, machineId: string) => {
    mockRooms = mockRooms.map(r =>
      r.id === roomId
        ? { ...r, machines: r.machines.filter(m => m.id !== machineId) }
        : r
    );
    setRooms([...mockRooms]);
  }, []);

  // Utility functions
  const getRoom = useCallback((id: string) => mockRooms.find(r => r.id === id), []);
  
  const getMachine = useCallback((roomId: string, machineId: string) => {
    const room = mockRooms.find(r => r.id === roomId);
    return room?.machines.find(m => m.id === machineId);
  }, []);

  // Get all machines (flat list) for backward compatibility
  const getAllMachines = useCallback(() => {
    return mockRooms.flatMap(room => 
      room.machines.map(machine => ({ 
        ...machine, 
        room: room.name,
        roomId: room.id 
      }))
    );
  }, []);

  const value = useMemo(() => ({
    rooms,
    addRoom,
    updateRoom,
    deleteRoom,
    addMachine,
    updateMachine,
    deleteMachine,
    getRoom,
    getMachine,
    getAllMachines,
  }), [rooms, addRoom, updateRoom, deleteRoom, addMachine, updateMachine, deleteMachine, getRoom, getMachine, getAllMachines]);

  return <MachineContext.Provider value={value}>{children}</MachineContext.Provider>;
};

export const useMachineContext = () => {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachineContext must be used within MachineProvider');
  }
  return context;
}; 