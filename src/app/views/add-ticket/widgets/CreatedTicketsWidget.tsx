import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import { format } from 'date-fns';
import { useTickets } from '@/app/hooks/useTickets';
import { useAuth } from '@/core/hooks/useAuth';
import { useTicketUrlState } from '@/app/hooks/useTicketUrlState';
import AddTicketDialog from '@/app/dialogs/AddTicketDialog';

const priorityColor = {
  rot: '#d32f2f',
  gelb: '#f9a825',
  gruen: '#2e7d32',
} as const;

const priorityLabel = {
  rot: 'Hoch',
  gelb: 'Mittel',
  gruen: 'Niedrig',
} as const;

const statusLabel = {
  backlog: 'Backlog',
  progress: 'In Bearbeitung',
  done: 'Erledigt',
} as const;

const CreatedTicketsWidget: React.FC = () => {
  const { tickets } = useTickets();
  const { getCurrentUser } = useAuth();
  const { selectedTicket, isDialogOpen, openTicket, closeTicket } = useTicketUrlState();
  
  const currentUserEmail = getCurrentUser()?.email;

  // Filter tickets created by current user
  const createdTickets = tickets.filter(ticket => 
    ticket.events.some(event => 
      event.type === 'create' && 
      event.details?.includes(currentUserEmail || '')
    )
  ).sort((a, b) => {
    // Sort by creation date (newest first)
    const aCreated = a.events.find(e => e.type === 'create')?.timestamp || '';
    const bCreated = b.events.find(e => e.type === 'create')?.timestamp || '';
    return new Date(bCreated).getTime() - new Date(aCreated).getTime();
  });

  if (createdTickets.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography variant="body2">
          Noch keine Tickets erstellt
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <List sx={{ flex: 1, overflowY: 'auto', padding: 0 }}>
        {createdTickets.map((ticket) => {
          const createdEvent = ticket.events.find(ev => ev.type === 'create');
          const createdAt = createdEvent ? format(new Date(createdEvent.timestamp), 'dd.MM.yyyy HH:mm') : '';
          
          return (
            <ListItem
              key={ticket.id}
              sx={{
                mb: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                position: 'relative',
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  backgroundColor: priorityColor[ticket.priority],
                  borderRadius: '4px 0 0 4px',
                }
              }}
              onClick={() => openTicket(ticket.id)}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {ticket.machine}
                    </Typography>
                    <Chip
                      label={priorityLabel[ticket.priority]}
                      size="small"
                      sx={{
                        backgroundColor: priorityColor[ticket.priority],
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                    <Chip
                      label={statusLabel[ticket.status]}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.primary', mb: 0.5 }}>
                      {ticket.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {ticket.responsible?.trim() ? ticket.responsible : 'Unassigned'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {createdAt}
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ pl: 2 }} // Add padding to account for the colored stripe
              />
            </ListItem>
          );
        })}
      </List>

      {/* Ticket Details Dialog */}
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
            responsible: selectedTicket.responsible,
            events: selectedTicket.events,
            images: selectedTicket.images,
          }}
        />
      )}
    </Box>
  );
};

export default CreatedTicketsWidget; 