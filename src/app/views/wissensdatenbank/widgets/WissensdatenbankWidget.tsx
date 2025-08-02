import React from 'react';
import { format } from 'date-fns';
import { useTickets, Ticket } from '@/app/hooks/useTickets';
import { useTicketUrlState } from '@/app/hooks/useTicketUrlState';
import Table, { TableColumn } from '@/core/ui/Table';
import AddTicketDialog from '@/app/dialogs/AddTicketDialog';
import { useAuth } from '@/core/hooks/useAuth';

const priorityColor = {
  rot: '#d32f2f',
  gelb: '#f9a825',
  gruen: '#2e7d32',
} as const;

const statusColor = {
  backlog: '#757575',
  progress: '#1976d2',
  done: '#388e3c',
  archived: '#616161',
} as const;

const statusLabels = {
  backlog: 'Backlog',
  progress: 'In Bearbeitung',
  done: 'Erledigt',
  archived: 'Archiviert',
} as const;

const priorityLabels = {
  rot: 'Hoch',
  gelb: 'Mittel',
  gruen: 'Niedrig',
} as const;

const typeLabels = {
  verwaltung: 'Verwaltung',
  betrieb: 'Betrieb',
} as const;

const typeColor = {
  verwaltung: '#9c27b0',
  betrieb: '#2196f3',
} as const;

const categoryLabels = {
  elektrisch: 'Elektrisch',
  mechanisch: 'Mechanisch',
} as const;

const categoryColor = {
  elektrisch: '#ff9800',
  mechanisch: '#607d8b',
} as const;

const WissensdatenbankWidget: React.FC = () => {
  const { tickets, updateTicket } = useTickets();
  const { selectedTicket, isDialogOpen, openTicket, closeTicket } = useTicketUrlState();
  const { getCurrentUser } = useAuth();

  // Show only archived tickets for the knowledge database
  const archivedTickets = tickets.filter(ticket => ticket.status === 'archived');

  const columns: TableColumn[] = [
    {
      id: 'id',
      label: 'ID',
      type: 'number',
      minWidth: 80,
      align: 'center',
    },
    {
      id: 'type',
      label: 'Typ',
      type: 'label',
      minWidth: 100,
      align: 'center',
      options: [
        { value: 'verwaltung', label: typeLabels.verwaltung, color: typeColor.verwaltung },
        { value: 'betrieb', label: typeLabels.betrieb, color: typeColor.betrieb },
      ],
    },
    {
      id: 'category',
      label: 'Kategorie',
      type: 'label',
      minWidth: 100,
      align: 'center',
      options: [
        { value: 'elektrisch', label: categoryLabels.elektrisch, color: categoryColor.elektrisch },
        { value: 'mechanisch', label: categoryLabels.mechanisch, color: categoryColor.mechanisch },
      ],
    },
    {
      id: 'machine',
      label: 'Maschine/Objekt',
      type: 'text',
      minWidth: 150,
    },
    {
      id: 'description',
      label: 'Beschreibung',
      type: 'text-long',
      minWidth: 200,
    },
    {
      id: 'priority',
      label: 'Priorität',
      type: 'label',
      minWidth: 100,
      align: 'center',
      options: [
        { value: 'rot', label: priorityLabels.rot, color: priorityColor.rot },
        { value: 'gelb', label: priorityLabels.gelb, color: priorityColor.gelb },
        { value: 'gruen', label: priorityLabels.gruen, color: priorityColor.gruen },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'label',
      minWidth: 120,
      align: 'center',
      options: [
        { value: 'backlog', label: statusLabels.backlog, color: statusColor.backlog },
        { value: 'progress', label: statusLabels.progress, color: statusColor.progress },
        { value: 'done', label: statusLabels.done, color: statusColor.done },
        { value: 'archived', label: statusLabels.archived, color: statusColor.archived },
      ],
    },
    {
      id: 'responsible',
      label: 'Verantwortlich',
      type: 'text',
      minWidth: 150,
      format: (value: string) => value || 'Nicht zugewiesen',
    },

    {
      id: 'raumnummer',
      label: 'Raumnummer',
      type: 'text',
      minWidth: 100,
      format: (value: string) => value || '-',
    },
    {
      id: 'equipmentNummer',
      label: 'Equipment Nr.',
      type: 'text',
      minWidth: 120,
      format: (value: string) => value || '-',
    },
    {
      id: 'createdAt',
      label: 'Erstellt',
      type: 'date',
      minWidth: 120,
      align: 'center',
      format: (value: string) => {
        // Get the creation event from the ticket's events
        const ticket = archivedTickets.find((t: Ticket) => t.events.find((e: any) => e.type === 'create')?.timestamp === value);
        if (ticket) {
          const createEvent = ticket.events.find((e: any) => e.type === 'create');
          return createEvent ? format(new Date(createEvent.timestamp), 'dd.MM.yyyy') : '-';
        }
        return '-';
      },
    },
    {
      id: 'completedAt',
      label: 'Abgeschlossen',
      type: 'date',
      minWidth: 120,
      align: 'center',
      format: (value: string | null) => value ? format(new Date(value), 'dd.MM.yyyy') : '-',
    },
  ];

  // Transform archived tickets data for the table
  const tableData = archivedTickets.map((ticket: Ticket) => {
    const createEvent = ticket.events.find((e: any) => e.type === 'create');
    return {
      ...ticket,
      createdAt: createEvent?.timestamp || '',
    };
  });

  const handleRowDoubleClick = (row: any) => {
    openTicket(row.id);
  };

  return (
    <>
      <Table
        columns={columns}
        data={tableData}
        enablePagination={true}
        defaultRowsPerPage={75}
        rowsPerPageOptions={[50, 75, 100, 200]}
        enableSorting={true}
        searchable={true}
        enableFiltering={true}
        enableRowSelection={false}
        enableRowDeletion={false}
        enableRowAddition={false}
        enableRowEditing={true}
        onEditRow={handleRowDoubleClick}
        getRowStyle={(rowData: Record<string, any>) => ({
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04) !important',
          },
        })}
      />
      
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
          }}
          showStatus
          onSave={(upd) => updateTicket(selectedTicket.id, { 
            responsible: upd.responsible || '', 
            plannedCompletion: upd.plannedCompletion ?? selectedTicket.plannedCompletion,
            category: upd.category ?? selectedTicket.category
          }, getCurrentUser() || undefined)}
          allowResponsibleEdit
          allowPlanEdit
        />
      )}
    </>
  );
};

export default WissensdatenbankWidget; 