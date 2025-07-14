import { useState, useCallback } from 'react';

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

// Mock data with hierarchical structure
let mockRooms: Room[] = [
  {
    id: 'r1',
    name: 'Werk 1 – Raum 101',
    machines: [
      { id: 'm1', name: 'Presse 1', tasks: [] },
      { id: 'm2', name: 'Fräse A', tasks: [] },
    ]
  },
  {
    id: 'r2', 
    name: 'Werk 2 – Raum 202',
    machines: [
      { id: 'm3', name: 'Schweißroboter', tasks: [] },
    ]
  },
  {
    id: 'r3',
    name: 'Werk 1 – Raum 103',
    machines: []
  }
];

export const useMachines = () => {
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

  return { 
    rooms, 
    addRoom, 
    updateRoom, 
    deleteRoom,
    addMachine, 
    updateMachine, 
    deleteMachine,
    getRoom,
    getMachine,
    getAllMachines
  };
}; 