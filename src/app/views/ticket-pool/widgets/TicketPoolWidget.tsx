import React from 'react';
import { Box } from '@mui/material';
import { format } from 'date-fns';
import AddTicketDialog from '@/app/views/add-ticket/dialogs/AddTicketDialog';
import { useTickets, Ticket } from '@/app/hooks/useTickets';
import SummaryCard from '@/core/ui/SummaryCard';
import KanbanLane from '@/core/ui/KanbanLane';
import { useTicketUrlState } from '@/app/utils/ticketUrlState';

const priorityColor = {
  rot: '#d32f2f',
  gelb: '#f9a825',
  gruen: '#2e7d32',
} as const;

const TicketCard: React.FC<{ ticket: Ticket; onClick: () => void; draggable?: boolean; onDropCard: (targetId: number, e: React.DragEvent) => void }> = ({ ticket, onClick, draggable, onDropCard }) => {
  const createdEvent = ticket.events.find((ev) => ev.type === 'create');
  const createdAt = createdEvent ? format(new Date(createdEvent.timestamp), 'dd.MM.yyyy') : '';

  return (
    <SummaryCard
      title={ticket.machine}
      description={ticket.description}
      borderColor={priorityColor[ticket.priority]}
      bottomLeft={ticket.responsible?.trim() ? ticket.responsible : 'Unassigned'}
      bottomRight={createdAt}
      onClick={onClick}
      draggable={draggable}
      dragData={ticket.id.toString()}
      onDragOver={(e)=>e.preventDefault()}
      onDrop={(e)=>{ e.stopPropagation(); onDropCard(ticket.id, e); }}
      data-ticketid={ticket.id}
    />
  );
};

const TicketPoolWidget: React.FC = () => {
  const { tickets, updateTicket, getTicketById, reorderTickets } = useTickets();
  const { selectedTicket, isDialogOpen, openTicket, closeTicket } = useTicketUrlState();

  const backlog = tickets.filter(t => t.status === 'backlog');
  const inProgress = tickets.filter(t => t.status === 'progress');
  const todayDone = tickets.filter(t => t.status === 'done' && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString());

  const findTicket = (id: number): { lane: 'backlog' | 'progress' | 'done'; index: number } | null => {
    const idxBack = backlog.findIndex((t) => t.id === id);
    if (idxBack !== -1) return { lane: 'backlog', index: idxBack };
    const idxProg = inProgress.findIndex((t) => t.id === id);
    if (idxProg !== -1) return { lane: 'progress', index: idxProg };
    const idxDone = todayDone.findIndex((t) => t.id === id);
    if (idxDone !== -1) return { lane: 'done', index: idxDone };
    return null;
  };

  const handleDrop = (lane: 'backlog' | 'progress' | 'done', e: React.DragEvent) => {
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
          reorderTickets(id);
        }
      }
      return;
    }

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
    updateTicket(id, partial);

    // Retrieve the freshly updated ticket (including new audit event) for the dialog
    const refreshed = getTicketById(id) ?? updatedTicket;
    openTicket(refreshed.id);
  };

  const handleCardDrop = (targetId: number, e: React.DragEvent) => {
    e.preventDefault();
    const dragIdString = e.dataTransfer.getData('text/plain');
    if (!dragIdString) return;
    const dragId = parseInt(dragIdString);
    if (!dragId || dragId === targetId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const placeAfter = e.clientY > rect.top + rect.height / 2;
    reorderTickets(dragId, targetId, placeAfter);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, height: '100%' }}>
      {([
        ['Backlog', backlog, 'backlog'],
        ['In Progress', inProgress, 'progress'],
        ['Done (Heute)', todayDone, 'done'],
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
      {selectedTicket && (
        <AddTicketDialog
          open={isDialogOpen}
          onClose={closeTicket}
          readOnly
          initialData={{
            machine: selectedTicket.machine,
            description: selectedTicket.description,
            priority: selectedTicket.priority,
            status: selectedTicket.status,
            responsible: selectedTicket.responsible,
            events: selectedTicket.events,
            plannedCompletion: selectedTicket.plannedCompletion,
          }}
          showStatus
          onSave={(upd) => updateTicket(selectedTicket.id, { responsible: upd.responsible || '', plannedCompletion: upd.plannedCompletion ?? selectedTicket.plannedCompletion })}
          allowResponsibleEdit
          allowPlanEdit
        />
      )}
    </Box>
  );
};

export default TicketPoolWidget; 