import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type TicketPriority = 'rot' | 'gelb' | 'gruen';
export type TicketStatus = 'backlog' | 'progress' | 'done';

export interface TicketEvent {
  timestamp: string;
  type: 'create' | 'assign' | 'status_update' | 'comment';
  details?: string;
}

export interface Ticket {
  id: number;
  machine: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  responsible?: string;
  completedAt?: string | null;
  plannedCompletion?: string | null;
  /** Attached images (URLs or base64 data) */
  images?: string[];
  /** Audit trail of important events */
  events: TicketEvent[];
}

interface TicketContextValue {
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: number, partial: Partial<Ticket>) => void;
  getTicketById: (id: number) => Ticket | undefined;
  reorderTickets: (draggedId: number, targetId?: number, placeAfter?: boolean) => void;
}

const TicketContext = createContext<TicketContextValue | undefined>(undefined);

// Module-level mock store so data survives across re-renders
let mockTickets: Ticket[] = [
  {
    id: 1,
    machine: 'Presse 1',
    description: 'Hydraulikleckage an Zylinder',
    priority: 'rot',
    status: 'backlog',
    responsible: 'Johannes Mohren',
    completedAt: null,
    plannedCompletion: null,
    events: [
      { timestamp: new Date().toISOString(), type: 'create' },
    ],
  },
  {
    id: 2,
    machine: 'Fräse A',
    description: 'Ungewöhnliche Spindelgeräusche während des Betriebs',
    priority: 'gelb',
    status: 'backlog',
    responsible: 'Johannes Mohren',
    completedAt: null,
    plannedCompletion: null,
    events: [
      { timestamp: new Date().toISOString(), type: 'create' },
    ],
  },
  {
    id: 3,
    machine: 'Schweißroboter',
    description: 'Kalibrierung erforderlich',
    priority: 'gruen',
    status: 'progress',
    responsible: 'Johannes Mohren',
    completedAt: null,
    plannedCompletion: null,
    events: [
      { timestamp: new Date().toISOString(), type: 'create' },
    ],
  },
  {
    id: 4, machine: 'CNC Drehmaschine', description: 'Werkzeugwechsel nötig', priority: 'gelb', status: 'backlog', responsible: 'Sarah Weber', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }],
    plannedCompletion: null,
  },
  { id: 5, machine: 'Laserschneider', description: 'Linse reinigen', priority: 'gruen', status: 'backlog', responsible: 'Michael Schmidt', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 6, machine: 'Presse 2', description: 'Hydraulikdruck niedrig', priority: 'rot', status: 'progress', responsible: 'Max Mustermann', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 7, machine: 'Fräse B', description: 'Spindelleistung prüfen', priority: 'gelb', status: 'backlog', responsible: 'Anna Müller', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 8, machine: 'Schweißstation 2', description: 'Gaszufuhrleckage', priority: 'rot', status: 'backlog', responsible: 'Johannes Mohren', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 9, machine: 'Roboterarm X', description: 'Firmware Update', priority: 'gruen', status: 'progress', responsible: 'Julia Schneider', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 10, machine: 'Säge 1', description: 'Sägeblatt stumpf', priority: 'gelb', status: 'backlog', responsible: 'Thomas Becker', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 11, machine: 'Pumpe A', description: 'Lagergeräusche beim Anlauf', priority: 'gelb', status: 'backlog', responsible: 'Lisa Fischer', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 12, machine: 'Kompressor', description: 'Ölstand prüfen', priority: 'gruen', status: 'backlog', responsible: 'David Wagner', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 13, machine: 'Montagelinie 1', description: 'Sensorfehler an Station 3', priority: 'rot', status: 'progress', responsible: 'Ali Öztürk', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 14, machine: 'Drucker 3D', description: 'Filament verstopft', priority: 'gelb', status: 'backlog', responsible: 'Johannes Mohren', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 15, machine: 'Lackierkabine', description: 'Filter austauschen', priority: 'gruen', status: 'backlog', responsible: 'Sarah Weber', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 16, machine: 'Verpackungsanlage', description: 'Band rutscht durch', priority: 'gelb', status: 'progress', responsible: 'Max Mustermann', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 17, machine: 'Gabelstapler', description: 'Batterie schwach', priority: 'rot', status: 'backlog', responsible: 'Michael Schmidt', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 18, machine: 'Roboterschweißer Y', description: 'Achse benötigt Schmierung', priority: 'gruen', status: 'backlog', responsible: 'Anna Müller', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 19, machine: 'Presse 3', description: 'Temperatursensor defekt', priority: 'gelb', status: 'backlog', responsible: 'Thomas Becker', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 20, machine: 'Fräse C', description: 'Kühlmittelstand niedrig', priority: 'gelb', status: 'progress', responsible: 'Julia Schneider', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 21, machine: 'Schweißroboter Z', description: 'Lichtbogen instabil', priority: 'rot', status: 'backlog', responsible: 'Lisa Fischer', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 22, machine: 'Pumpe B', description: 'Dichtung ersetzen', priority: 'gelb', status: 'backlog', responsible: 'David Wagner', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 23, machine: 'Laserschneider 2', description: 'Strahl justieren', priority: 'gruen', status: 'backlog', responsible: 'Johannes Mohren', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 24, machine: 'Drehmaschine D', description: 'Späneabsaugung schwach', priority: 'gelb', status: 'progress', responsible: 'Ali Öztürk', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 25, machine: 'CNC Fräse Z', description: 'Software Lizenz abgelaufen', priority: 'gruen', status: 'backlog', responsible: 'Sarah Weber', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  {
    id: 26, machine: 'Pressanlage Mega', description: 'Kühlkreislauf leckt', priority: 'rot', status: 'done', responsible: 'Max Mustermann', completedAt: new Date().toISOString(), events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 27, machine: 'Montage-Roboter', description: 'Greifer klemmt', priority: 'gelb', status: 'done', responsible: 'Julia Schneider', completedAt: new Date().toISOString(), events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 28, machine: 'Förderband 2', description: 'Motor überhitzt', priority: 'rot', status: 'backlog', responsible: 'Michael Schmidt', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 29, machine: 'Schneidlaser', description: 'Optik verschmutzt', priority: 'gelb', status: 'progress', responsible: 'Ali Öztürk', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
  { id: 30, machine: 'Lagerkran', description: 'Kalibrierung der Sensoren', priority: 'gruen', status: 'backlog', responsible: 'Anna Müller', completedAt: null, events: [{ timestamp: new Date().toISOString(), type: 'create' }], plannedCompletion: null },
];

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>(() => [...mockTickets]);

  const addTicket = useCallback((ticket: Ticket) => {
    const now = new Date().toISOString();
    const ticketWithEvents: Ticket = {
      ...ticket,
      events: ticket.events ?? [{ timestamp: now, type: 'create' }],
    };
    mockTickets = [...mockTickets, ticketWithEvents];
    setTickets([...mockTickets]);
  }, []);

  const updateTicket = useCallback((id: number, partial: Partial<Ticket>) => {
    const now = new Date().toISOString();

    mockTickets = mockTickets.map((t) => {
      if (t.id !== id) return t;

      const events: TicketEvent[] = [...(t.events ?? [])];

      // Detect status change
      if (partial.status && partial.status !== t.status) {
        events.push({ timestamp: now, type: 'status_update', details: `Status geändert zu "${partial.status}"` });
      }

      // Detect assignment change
      if (partial.responsible !== undefined && partial.responsible !== t.responsible) {
        const newResp = partial.responsible || 'Niemand';
        events.push({ timestamp: now, type: 'assign', details: `Zugewiesen an ${newResp}` });
      }

      return { ...t, ...partial, events };
    });

    setTickets([...mockTickets]);
  }, []);

  const getTicketById = useCallback((id: number): Ticket | undefined => mockTickets.find((t) => t.id === id), []);

  const reorderTickets = useCallback((draggedId: number, targetId?: number, placeAfter: boolean = false) => {
    const fromIdx = mockTickets.findIndex(t => t.id === draggedId);
    if (fromIdx === -1) return;

    let toIdx: number;
    if (targetId) {
      toIdx = mockTickets.findIndex(t => t.id === targetId);
      if (toIdx === -1) return;
      // check same status
      if (mockTickets[fromIdx].status !== mockTickets[toIdx].status) return;
    } else {
      // move to end of lane list with same status
      const status = mockTickets[fromIdx].status;
      toIdx = mockTickets.reduce((lastIdx, t, idx) => t.status === status ? idx : lastIdx, -1) + 1;
    }

    const updated = [...mockTickets];
    const [moved] = updated.splice(fromIdx, 1);
    let insertIdx = toIdx;
    if(placeAfter) insertIdx += (toIdx > fromIdx ? 0 : 1);
    const adjustedIdx = insertIdx > fromIdx ? insertIdx - 1 : insertIdx;
    updated.splice(adjustedIdx, 0, moved);
    mockTickets = updated;
    setTickets([...mockTickets]);
  }, []);

  const value = useMemo(() => ({
    tickets,
    addTicket,
    updateTicket,
    getTicketById,
    reorderTickets,
  }), [tickets, addTicket, updateTicket, getTicketById, reorderTickets]);

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};

export const useTicketContext = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicketContext must be used within TicketProvider');
  }
  return context;
}; 