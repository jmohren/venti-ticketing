import React from 'react';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import AddTicketDialog from '@/app/dialogs/AddTicketDialog';
import { useTickets, Ticket } from '@/app/hooks/useTickets';
import { useResponsibleDisplay } from '@/app/hooks/useResponsibleDisplay';
import SummaryCard from '@/core/ui/SummaryCard';
import KanbanLane from '@/core/ui/KanbanLane';
import { useTicketUrlState } from '@/app/hooks/useTicketUrlState';

const priorityColor = {
  rot: '#d32f2f',
  gelb: '#f9a825',
  gruen: '#2e7d32',
} as const;

const TicketCard: React.FC<{ ticket: Ticket; onClick: () => void; draggable?: boolean; onDropCard: (targetId: number, e: React.DragEvent) => void }> = ({ ticket, onClick, draggable, onDropCard }) => {
  const { getResponsibleDisplayName } = useResponsibleDisplay();
  const createdEvent = ticket.events.find((ev) => ev.type === 'create');
  const createdAt = createdEvent ? format(new Date(createdEvent.timestamp), 'dd.MM.yyyy') : '';

  // Show room number for Verwaltung tickets, otherwise show machine name
  const displayTitle = ticket.type === 'verwaltung' && ticket.raumnummer 
    ? ticket.raumnummer 
    : ticket.machine;

  return (
    <SummaryCard
      title={displayTitle}
      description={ticket.description}
      borderColor={priorityColor[ticket.priority]}
      bottomLeft={getResponsibleDisplayName(ticket.responsible)}
      bottomRight={createdAt}
      onClick={onClick}
      draggable={draggable}
      dragData={ticket.id.toString()}
      onDragOver={(e)=>e.preventDefault()}
      onDrop={(e)=>{ onDropCard(ticket.id, e); }}
      data-ticketid={ticket.id}
    />
  );
};

const TicketPoolWidget: React.FC = () => {
  const { tickets, loading, error, updateTicket, getTicketById, reorderTickets, archiveTickets } = useTickets();
  const { selectedTicket, isDialogOpen, openTicket, closeTicket } = useTicketUrlState();

  const backlog = tickets.filter(t => t.status === 'backlog');
  const inProgress = tickets.filter(t => t.status === 'progress');
  const done = tickets.filter(t => t.status === 'done');

  const findTicket = (id: number): { lane: 'backlog' | 'progress' | 'done'; index: number } | null => {
    const idxBack = backlog.findIndex((t) => t.id === id);
    if (idxBack !== -1) return { lane: 'backlog', index: idxBack };
    const idxProg = inProgress.findIndex((t) => t.id === id);
    if (idxProg !== -1) return { lane: 'progress', index: idxProg };
    const idxDone = done.findIndex((t) => t.id === id);
    if (idxDone !== -1) return { lane: 'done', index: idxDone };
    return null;
  };

  const handleDrop = async (lane: 'backlog' | 'progress' | 'done', e: React.DragEvent) => {
    e.preventDefault();
    const idString = e.dataTransfer.getData('text/plain');
    if (!idString) return;
    const id = parseInt(idString);
    const ticketLoc = findTicket(id);
    if (!ticketLoc) return;
    // If same lane, do nothing
    if (ticketLoc.lane === lane) {
      // Determine if dropped below last card
      const laneElement = e.currentTarget as HTMLElement;
      const cards = Array.from(laneElement.querySelectorAll('[data-ticketid]')) as HTMLElement[];
      if(cards.length){
        const lastCardRect = cards[cards.length-1].getBoundingClientRect();
        if(e.clientY > lastCardRect.bottom){
          await reorderTickets(id);
        }
      }
      return;
    }

    try {
    const newStatus = lane;
    // Create updated copy for immediate UI feedback
    const original = tickets.find(t => t.id === id);
    if (!original) return;

    const updatedTicket = { ...original, status: newStatus } as Ticket;
    const partial: Partial<Ticket> = { status: newStatus };
    if (lane === 'done') {
      partial.completedAt = new Date().toISOString();
    } else if (ticketLoc.lane === 'done') {
      // Moving out of done → reset completion timestamp
      partial.completedAt = null;
    }
      
      await updateTicket(id, partial);

    // Retrieve the freshly updated ticket (including new audit event) for the dialog
    const refreshed = getTicketById(id) ?? updatedTicket;
    openTicket(refreshed.id);
    } catch (error) {
      console.error('Failed to update ticket:', error);
    }
  };

  const handleCardDrop = async (targetId: number, e: React.DragEvent) => {
    e.preventDefault();
    const dragIdString = e.dataTransfer.getData('text/plain');
    if (!dragIdString) return;
    const dragId = parseInt(dragIdString);
    if (!dragId || dragId === targetId) return;
    
    // Find the lanes of both tickets
    const dragTicketLoc = findTicket(dragId);
    const targetTicketLoc = findTicket(targetId);
    
    if (!dragTicketLoc || !targetTicketLoc) return;
    
    // If tickets are in different lanes, handle as lane change
    if (dragTicketLoc.lane !== targetTicketLoc.lane) {
      // Call handleDrop with the target lane
      await handleDrop(targetTicketLoc.lane as any, e);
      return;
    }
    
    // Same lane - handle as reorder
    e.stopPropagation(); // Prevent lane drop handler from also running
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const placeAfter = e.clientY > rect.top + rect.height / 2;
    try {
      await reorderTickets(dragId, targetId, placeAfter);
    } catch (error) {
      console.error('Failed to reorder tickets:', error);
    }
  };

  const handleArchiveTicket = async (ticketId: number) => {
    try {
      await archiveTickets([ticketId]);
      closeTicket(); // Close the dialog after archiving
    } catch (error) {
      console.error('Failed to archive ticket:', error);
    }
  };

  // Loading and error states
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography>Tickets werden geladen...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="error">Fehler beim Laden der Tickets: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, height: '100%' }}>
      {([
        ['Backlog', backlog, 'backlog'],
        ['In Progress', inProgress, 'progress']
      ] as const).map(([title, list, lane]) => (
        <KanbanLane
          sx={{ flex: 1.2 }}
          key={lane}
          header={title}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(lane as any, e)}
        >
          {list.map((t) => (
            <TicketCard key={t.id} ticket={t} onClick={() => openTicket(t.id)} draggable onDropCard={handleCardDrop} />
          ))}
        </KanbanLane>
      ))}
      
      {/* Done lane */}
      <KanbanLane
        sx={{ flex: 1.2 }}
        key="done"
        header="Done"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop('done', e)}
      >
        {done.map((t) => (
          <TicketCard key={t.id} ticket={t} onClick={() => openTicket(t.id)} draggable onDropCard={handleCardDrop} />
        ))}
      </KanbanLane>

      {selectedTicket && (
        <AddTicketDialog
          open={isDialogOpen}
          onClose={closeTicket}
          readOnly
          ticketId={selectedTicket.id}
          initialData={{
            machine: selectedTicket.machine,
            description: selectedTicket.description,
            priority: selectedTicket.priority,
            status: selectedTicket.status as any,
            type: selectedTicket.type,
            category: selectedTicket.category,
            responsible: selectedTicket.responsible,
            events: selectedTicket.events,
            plannedCompletion: selectedTicket.plannedCompletion,
            images: selectedTicket.images,
            raumnummer: selectedTicket.raumnummer,
            equipmentNummer: selectedTicket.equipmentNummer,
            created_at: selectedTicket.created_at,
            createdByUserId: selectedTicket.createdByUserId,
            totalWorkTimeMinutes: selectedTicket.totalWorkTimeMinutes,
          }}
          showStatus
          onSave={(upd) => updateTicket(selectedTicket.id, { 
            responsible: upd.responsible || '', 
            plannedCompletion: upd.plannedCompletion ?? selectedTicket.plannedCompletion,
            category: upd.category ?? selectedTicket.category,
            status: upd.status ?? selectedTicket.status
          })}
          allowResponsibleEdit
          allowPlanEdit
          allowStatusEdit
          allowWorkTracking
          showArchiveButton={selectedTicket.status === 'done'}
          onArchive={() => handleArchiveTicket(selectedTicket.id)}
        />
      )}
    </Box>
  );
};

export default TicketPoolWidget; 