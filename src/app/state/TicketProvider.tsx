import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { restApiClient } from '@/core/api/rest/RestApiClient';
import { useUser } from '@/core/state/UserProvider';

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
  // Database fields
  created_at?: string;
  updated_at?: string;
  // User tracking fields
  createdByUserId?: string;
  createdByName?: string;
}

interface TicketContextValue {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  addTicket: (ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'createdByUserId' | 'createdByName'>, currentUser?: { email?: string }) => Promise<void>;
  updateTicket: (id: number, partial: Partial<Ticket>, currentUser?: { email?: string }) => Promise<void>;
  getTicketById: (id: number) => Ticket | undefined;
  reorderTickets: (draggedId: number, targetId?: number, placeAfter?: boolean) => Promise<void>;
  archiveTickets: (ticketIds: number[]) => Promise<void>;
  refreshTickets: () => Promise<void>;
  getTicketsByCreator: (userId: string) => Ticket[];
  getMyTickets: () => Ticket[];
}

const TicketContext = createContext<TicketContextValue | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user display name from enhanced profile
  const getUserDisplayName = () => {
    if (profile?.fullName) return profile.fullName;
    if (user?.email) return user.email.split('@')[0];
    return 'Demo User';
  };

  // Load tickets from API
  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await restApiClient.get<Ticket>('tickets', {
        order: ['created_at.desc']
      });
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const addTicket = useCallback(async (ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'createdByUserId' | 'createdByName'>, currentUser?: { email?: string }) => {
    try {
      setError(null);
    const now = new Date().toISOString();
      const userDisplayName = getUserDisplayName();
      const currentUserId = user?.userId;
      
      const ticketWithEvents = {
      ...ticket,
        // Store user tracking information
        createdByUserId: currentUserId || undefined,
        createdByName: userDisplayName,
        events: ticket.events ?? [{ 
          timestamp: now, 
          type: 'create' as const,
          details: `${userDisplayName}: Ticket erstellt`
        }],
    };

      const newTicket = await restApiClient.create<Ticket>('tickets', ticketWithEvents);
      setTickets(prev => [newTicket, ...prev]);
    } catch (err) {
      console.error('Failed to add ticket:', err);
      setError('Failed to add ticket');
      throw err;
    }
  }, []);

  const updateTicket = useCallback(async (id: number, partial: Partial<Ticket>, currentUser?: { email?: string }) => {
    try {
      setError(null);
    const now = new Date().toISOString();
      const existingTicket = tickets.find(t => t.id === id);
      if (!existingTicket) {
        throw new Error(`Ticket with id ${id} not found`);
      }

      // Build events if not explicitly provided
      let events: TicketEvent[];
      if (partial.events) {
        events = partial.events;
      } else {
        events = [...(existingTicket.events ?? [])];
        const userDisplayName = getUserDisplayName();

      // Detect status change
        if (partial.status && partial.status !== existingTicket.status) {
          const statusLabels = { backlog: 'Backlog', progress: 'In Bearbeitung', done: 'Erledigt', archived: 'Archiviert' };
          const statusLabel = statusLabels[partial.status] || partial.status;
          events.push({ 
            timestamp: now, 
            type: 'status_update', 
            details: `${userDisplayName}: Status geändert zu "${statusLabel}"` 
          });
      }

      // Detect assignment change
        if (partial.responsible !== undefined && partial.responsible !== existingTicket.responsible) {
        const newResp = partial.responsible || 'Niemand';
          events.push({ 
            timestamp: now, 
            type: 'assign', 
            details: `${userDisplayName}: Zugewiesen an ${newResp}` 
          });
      }
      }

      const updateData = { ...partial, events };
      const updatedTicket = await restApiClient.update<Ticket>('tickets', id, updateData);

      setTickets(prev => prev.map(t => t.id === id ? updatedTicket : t));
    } catch (err) {
      console.error('Failed to update ticket:', err);
      setError('Failed to update ticket');
      throw err;
    }
  }, [tickets]);

  const getTicketById = useCallback((id: number): Ticket | undefined => {
    return tickets.find(t => t.id === id);
  }, [tickets]);

  const reorderTickets = useCallback(async (draggedId: number, targetId?: number, placeAfter: boolean = false) => {
    // For now, reordering is client-side only
    // You could implement server-side ordering with a position field if needed
    const fromIdx = tickets.findIndex(t => t.id === draggedId);
    if (fromIdx === -1) return;

    let toIdx: number;
    if (targetId) {
      toIdx = tickets.findIndex(t => t.id === targetId);
      if (toIdx === -1) return;
      // check same status
      if (tickets[fromIdx].status !== tickets[toIdx].status) return;
    } else {
      // move to end of lane list with same status
      const status = tickets[fromIdx].status;
      toIdx = tickets.reduce((lastIdx, t, idx) => t.status === status ? idx : lastIdx, -1) + 1;
    }

    const updated = [...tickets];
    const [moved] = updated.splice(fromIdx, 1);
    let insertIdx = toIdx;
    if(placeAfter) insertIdx += (toIdx > fromIdx ? 0 : 1);
    const adjustedIdx = insertIdx > fromIdx ? insertIdx - 1 : insertIdx;
    updated.splice(adjustedIdx, 0, moved);
    setTickets(updated);
  }, [tickets]);

  const archiveTickets = useCallback(async (ticketIds: number[]) => {
    try {
      setError(null);
      const now = new Date().toISOString();
      
      // Update all tickets to archived status
      const updatePromises = ticketIds.map(async (ticketId) => {
        const existingTicket = tickets.find(t => t.id === ticketId);
        if (!existingTicket) return;

        const events: TicketEvent[] = [...(existingTicket.events ?? [])];
        events.push({ timestamp: now, type: 'status_update', details: 'Ticket archiviert' });
        
        return restApiClient.update<Ticket>('tickets', ticketId, {
          status: 'archived' as TicketStatus,
          events
        });
      });

      const updatedTickets = await Promise.all(updatePromises);
      
      setTickets(prev => prev.map(ticket => {
        const updated = updatedTickets.find(u => u && u.id === ticket.id);
        return updated || ticket;
      }));
    } catch (err) {
      console.error('Failed to archive tickets:', err);
      setError('Failed to archive tickets');
      throw err;
    }
  }, [tickets]);

  const refreshTickets = useCallback(async () => {
    await loadTickets();
  }, [loadTickets]);

  // Helper to get tickets created by a specific user
  const getTicketsByCreator = useCallback((userId: string) => {
    return tickets.filter(ticket => ticket.createdByUserId === userId);
  }, [tickets]);

  // Helper to get tickets created by current user
  const getMyTickets = useCallback(() => {
    if (!user?.userId) return [];
    return getTicketsByCreator(user.userId);
  }, [user?.userId, getTicketsByCreator]);

  const value = useMemo(() => ({
    tickets,
    loading,
    error,
    addTicket,
    updateTicket,
    getTicketById,
    reorderTickets,
    archiveTickets,
    refreshTickets,
    getTicketsByCreator,
    getMyTickets,
  }), [tickets, loading, error, addTicket, updateTicket, getTicketById, reorderTickets, archiveTickets, refreshTickets, getTicketsByCreator, getMyTickets]);

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};

export const useTicketContext = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicketContext must be used within TicketProvider');
  }
  return context;
}; 