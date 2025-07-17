import React from 'react';
import { Box } from '@mui/material';
import { format } from 'date-fns';
import KanbanLane from '@/core/ui/KanbanLane';
import { useTickets, Ticket } from '@/app/hooks/useTickets';
import AddTicketDialog from '@/app/dialogs/AddTicketDialog';
import SummaryCard from '@/core/ui/SummaryCard';
import { useTicketUrlState } from '@/app/hooks/useTicketUrlState';

const priorityColor = { rot: '#d32f2f', gelb: '#f9a825', gruen: '#2e7d32' } as const;

const TicketCard: React.FC<{ t: Ticket; onClick: () => void; draggable?: boolean; onDropCard: (targetId:number,e:React.DragEvent)=>void }> = ({ t, onClick, draggable, onDropCard }) => {
  const createdEvent = t.events.find(ev => ev.type === 'create');
  const createdAt = createdEvent ? format(new Date(createdEvent.timestamp), 'dd.MM.yyyy') : '';

  return (
    <SummaryCard
      title={t.machine}
      description={t.description}
      borderColor={priorityColor[t.priority]}
      bottomLeft={t.responsible?.trim() ? t.responsible : 'Unassigned'}
      bottomRight={createdAt}
      onClick={onClick}
      draggable={draggable}
      dragData={t.id.toString()}
      onDragOver={(e)=>e.preventDefault()}
      onDrop={(e)=> { e.stopPropagation(); onDropCard(t.id,e);} }
      data-ticketid={t.id}
    />
  );
};

interface Props { currentUser: string }

const InstandhaltungWidget: React.FC<Props> = ({ currentUser }) => {
  const { tickets, updateTicket, reorderTickets } = useTickets();
  const { selectedTicket, isDialogOpen, openTicket, closeTicket } = useTicketUrlState();

  const handleDrop = (lane: 'backlog'|'progress'|'done', e: React.DragEvent) => {
    e.preventDefault();
    const idString = e.dataTransfer.getData('text/plain');
    const id = parseInt(idString);
    const t = tickets.find(t=>t.id===id);
    if(!t) return;

    if(t.status === lane){
      const laneEl = e.currentTarget as HTMLElement;
      const cards = Array.from(laneEl.querySelectorAll('[data-ticketid]')) as HTMLElement[];
      if(cards.length){
        const lastRect = cards[cards.length-1].getBoundingClientRect();
        if(e.clientY > lastRect.bottom){
          reorderTickets(id);
        }
      }
      return;
    }

    const partial: Partial<Ticket> = { status: lane };
    if(lane==='done') {
      partial.completedAt = new Date().toISOString();
    } else if (t.status === 'done') {
      partial.completedAt = null;
    }
    updateTicket(id, partial);
  };

  const handleCardDrop = (targetId:number,e:React.DragEvent)=>{
    e.preventDefault();
    const dragIdString = e.dataTransfer.getData('text/plain');
    const dragId = parseInt(dragIdString);
    if(!dragId||dragId===targetId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height/2;
    reorderTickets(dragId,targetId,after);
  };

  const filtered = tickets.filter(t=> t.responsible===currentUser);
  const backlog = filtered.filter(t=>t.status==='backlog');
  const progress = filtered.filter(t=>t.status==='progress');
  const todayDone = filtered.filter(t=> t.status==='done' && t.completedAt && new Date(t.completedAt).toDateString()===new Date().toDateString());

  return (
    <Box sx={{display:'flex', gap:1, height:'100%', minHeight:0}}>
      {([['Backlog', backlog, 'backlog'], ['In Progress', progress, 'progress'], ['Done (Heute)', todayDone, 'done']] as const).map(([title, list, lane])=> (
        <KanbanLane key={lane}
          sx={{ flex: 1.2 }}
          header={title}
          onDragOver={(e)=>e.preventDefault()}
          onDrop={(e)=>handleDrop(lane as any, e)}
          paddingOverride={1}
        >
          {list.map(t=> <TicketCard key={t.id} t={t} onClick={()=>openTicket(t.id)} draggable onDropCard={handleCardDrop} />)}
        </KanbanLane>
      ))}

      {selectedTicket && (
        <AddTicketDialog
          open={isDialogOpen}
          onClose={closeTicket}
          readOnly
          showStatus
          ticketId={selectedTicket.id}
          initialData={{
            machine: selectedTicket.machine,
            description: selectedTicket.description,
            priority: selectedTicket.priority,
            status: selectedTicket.status,
            location: selectedTicket.location,
            responsible: selectedTicket.responsible,
            events: selectedTicket.events,
            images: selectedTicket.images,
          }}
        />
      )}
    </Box>
  );
};

export default InstandhaltungWidget; 