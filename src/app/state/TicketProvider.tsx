import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type TicketPriority = 'rot' | 'gelb' | 'gruen';
export type TicketStatus = 'backlog' | 'progress' | 'done' | 'archived';
export type TicketType = 'verwaltung' | 'betrieb';
export type TicketCategory = 'elektrisch' | 'mechanisch';

export interface TicketEvent {
  timestamp: string;
  type: 'create' | 'assign' | 'status_update' | 'comment' | 'work_started' | 'work_paused';
  details?: string;
  images?: string[]; // For comments with attached images
}

export interface Ticket {
  id: number;
  machine: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  type?: TicketType;
  category?: TicketCategory;
  responsible?: string;
  completedAt?: string | null;
  plannedCompletion?: string | null;
  /** Attached images (URLs or base64 data) */
  images?: string[];
  /** Audit trail of important events */
  events: TicketEvent[];
  // Verwaltung specific fields
  raumnummer?: string;
  // Betrieb specific fields
  equipmentNummer?: string;
}

interface TicketContextValue {
  tickets: Ticket[];
  addTicket: (ticket: Ticket, currentUser?: { email?: string }) => void;
  updateTicket: (id: number, partial: Partial<Ticket>, currentUser?: { email?: string }) => void;
  getTicketById: (id: number) => Ticket | undefined;
  reorderTickets: (draggedId: number, targetId?: number, placeAfter?: boolean) => void;
  archiveTickets: (ticketIds: number[]) => void;
}

const TicketContext = createContext<TicketContextValue | undefined>(undefined);

// Helper function to create past dates
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

// Module-level mock store so data survives across re-renders
let mockTickets: Ticket[] = [
  {
    id: 1,
    machine: 'Presse 1',
    description: 'Hydraulikleckage an Zylinder',
    priority: 'rot',
    status: 'backlog',
    type: 'betrieb',
    category: 'mechanisch',
    responsible: 'Johannes Mohren',
    completedAt: null,
    plannedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    equipmentNummer: 'EQ-001',
    events: [
      { timestamp: daysAgo(21), type: 'create' }, // 3 weeks old - critical!
      { timestamp: daysAgo(20), type: 'work_started', details: 'Johannes Mohren: Arbeit begonnen' },
      { timestamp: daysAgo(20), type: 'work_paused', details: 'Johannes Mohren: Arbeit pausiert' },
      { timestamp: daysAgo(19), type: 'work_started', details: 'Johannes Mohren: Arbeit begonnen' },
      { timestamp: daysAgo(19), type: 'work_paused', details: 'Johannes Mohren: Arbeit pausiert' },
    ],
  },
  {
    id: 2,
    machine: 'Fräse A',
    description: 'Ungewöhnliche Spindelgeräusche während des Betriebs',
    priority: 'gelb',
    status: 'backlog',
    type: 'betrieb',
    category: 'elektrisch',
    responsible: 'Johannes Mohren',
    completedAt: null,
    plannedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
    equipmentNummer: 'EQ-002',
    events: [
      { timestamp: daysAgo(5), type: 'create' }, // 5 days old
    ],
  },
  {
    id: 3,
    machine: 'Verwaltung Büro',
    description: 'Kalibrierung erforderlich',
    priority: 'gruen',
    status: 'progress',
    type: 'verwaltung',
    category: 'elektrisch',
    responsible: 'Johannes Mohren',
    completedAt: null,
    plannedCompletion: null,
    raumnummer: 'A-204',
    events: [
      { timestamp: daysAgo(2), type: 'create' }, // 2 days old
    ],
  },
  {
    id: 4, machine: 'CNC Drehmaschine', description: 'Werkzeugwechsel nötig', priority: 'gelb', status: 'backlog', responsible: 'Sarah Weber', completedAt: null, events: [{ timestamp: daysAgo(14), type: 'create' }], // 2 weeks old
    plannedCompletion: new Date().toISOString(), // Today
  },
  { id: 5, machine: 'Laserschneider', description: 'Linse reinigen', priority: 'gruen', status: 'backlog', responsible: 'Michael Schmidt', completedAt: null, events: [{ timestamp: daysAgo(1), type: 'create' }], plannedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() }, // 1 day old
  { id: 6, machine: 'Presse 1', description: 'Hydraulikdruck niedrig', priority: 'rot', status: 'progress', responsible: 'Max Mustermann', completedAt: null, events: [{ timestamp: daysAgo(7), type: 'create' }], plannedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }, // 1 week old
  { id: 7, machine: 'Fräse B', description: 'Spindelleistung prüfen', priority: 'gelb', status: 'backlog', responsible: 'Anna Müller', completedAt: null, events: [{ timestamp: daysAgo(3), type: 'create' }], plannedCompletion: null }, // 3 days old
  { id: 8, machine: 'Schweißstation 2', description: 'Gaszufuhrleckage', priority: 'rot', status: 'backlog', responsible: 'Johannes Mohren', completedAt: null, events: [{ timestamp: daysAgo(35), type: 'create' }], plannedCompletion: null }, // 5 weeks old - very critical!
  { id: 9, machine: 'Roboterarm X', description: 'Firmware Update', priority: 'gruen', status: 'progress', responsible: 'Julia Schneider', completedAt: null, events: [{ timestamp: daysAgo(10), type: 'create' }], plannedCompletion: null }, // 10 days old
  { id: 10, machine: 'Säge 1', description: 'Sägeblatt stumpf', priority: 'gelb', status: 'backlog', responsible: 'Thomas Becker', completedAt: null, events: [{ timestamp: daysAgo(28), type: 'create' }], plannedCompletion: null }, // 4 weeks old
  { id: 11, machine: 'Pumpe A', description: 'Lagergeräusche beim Anlauf', priority: 'gelb', status: 'backlog', responsible: 'Lisa Fischer', completedAt: null, events: [{ timestamp: daysAgo(6), type: 'create' }], plannedCompletion: null }, // 6 days old
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

  const addTicket = useCallback((ticket: Ticket, currentUser?: { email?: string }) => {
    const now = new Date().toISOString();
    const userEmail = currentUser?.email || 'Demo User';
    const ticketWithEvents: Ticket = {
      ...ticket,
      events: ticket.events ?? [{ 
        timestamp: now, 
        type: 'create',
        details: `${userEmail}: Ticket erstellt`
      }],
    };
    mockTickets = [...mockTickets, ticketWithEvents];
    setTickets([...mockTickets]);
  }, []);

  const updateTicket = useCallback((id: number, partial: Partial<Ticket>, currentUser?: { email?: string }) => {
    const now = new Date().toISOString();

    mockTickets = mockTickets.map((t) => {
      if (t.id !== id) return t;

      // If events are explicitly provided in partial, use those
      let events: TicketEvent[];
      if (partial.events) {
        events = partial.events;
      } else {
        // Otherwise, build events from current ticket events plus any system changes
        events = [...(t.events ?? [])];
        const userEmail = currentUser?.email || 'Demo User';

        // Detect status change
        if (partial.status && partial.status !== t.status) {
          const statusLabels = { backlog: 'Backlog', progress: 'In Bearbeitung', done: 'Erledigt', archived: 'Archiviert' };
          const statusLabel = statusLabels[partial.status] || partial.status;
          events.push({ 
            timestamp: now, 
            type: 'status_update', 
            details: `${userEmail}: Status geändert zu "${statusLabel}"` 
          });
        }

        // Detect assignment change
        if (partial.responsible !== undefined && partial.responsible !== t.responsible) {
          const newResp = partial.responsible || 'Niemand';
          events.push({ 
            timestamp: now, 
            type: 'assign', 
            details: `${userEmail}: Zugewiesen an ${newResp}` 
          });
        }
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

  const archiveTickets = useCallback((ticketIds: number[]) => {
    const now = new Date().toISOString();
    
    mockTickets = mockTickets.map((ticket) => {
      if (ticketIds.includes(ticket.id)) {
        const events: TicketEvent[] = [...(ticket.events ?? [])];
        events.push({ timestamp: now, type: 'status_update', details: 'Ticket archiviert' });
        
        return { 
          ...ticket, 
          status: 'archived' as TicketStatus, 
          events 
        };
      }
      return ticket;
    });

    setTickets([...mockTickets]);
  }, []);

  const value = useMemo(() => ({
    tickets,
    addTicket,
    updateTicket,
    getTicketById,
    reorderTickets,
    archiveTickets,
  }), [tickets, addTicket, updateTicket, getTicketById, reorderTickets, archiveTickets]);

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};

export const useTicketContext = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicketContext must be used within TicketProvider');
  }
  return context;
}; 