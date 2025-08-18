import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useTickets, Ticket } from '@/app/hooks/useTickets';
import { useTicketUrlState } from '@/app/hooks/useTicketUrlState';
import { useUsersContext } from '@/core/state/UsersProvider';
import Table, { TableColumn } from '@/core/ui/Table';
import AddTicketDialog from '@/app/dialogs/AddTicketDialog';
import { Box, CircularProgress, Typography } from '@mui/material';

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
  const { loadArchivedTickets } = useTickets();
  const { ticketId, isDialogOpen, openTicket, closeTicket } = useTicketUrlState();

  
  // Local state for archived tickets (loaded separately)
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Use centralized function from UsersProvider (sync for table formatting)
  const { getDisplayNameFromUserIdSync } = useUsersContext();

  // Handle server-side search from Table component
  const handleServerSearch = useCallback(async (query: string) => {
    try {
      setSearchLoading(true);
      setError(null);
      const tickets = await loadArchivedTickets({
        page: 0, // Reset to first page when searching
        limit: 75, // Use default page size
        search: query
      });
      setArchivedTickets(tickets);
      // Estimate total count based on results
      if (tickets.length < 75) {
        setTotalCount(tickets.length);
      } else {
        setTotalCount(76); // +1 to indicate more pages exist
      }
    } catch (err) {
      console.error('Failed to search archived tickets:', err);
      setError('Failed to search archived tickets');
    } finally {
      setSearchLoading(false);
    }
  }, [loadArchivedTickets]);

  // Handle pagination changes from Table component
  const handlePageChange = useCallback(async (page: number, rowsPerPageValue: number) => {
    try {
      setError(null);
      const tickets = await loadArchivedTickets({
        page,
        limit: rowsPerPageValue,
        search: '' // No search when paginating
      });
      setArchivedTickets(tickets);
      // Estimate total count
      if (tickets.length < rowsPerPageValue) {
        setTotalCount(page * rowsPerPageValue + tickets.length);
      } else {
        setTotalCount((page + 1) * rowsPerPageValue + 1);
      }
    } catch (err) {
      console.error('Failed to load archived tickets:', err);
      setError('Failed to load archived tickets');
    }
  }, [loadArchivedTickets]);

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        setError(null);
        const tickets = await loadArchivedTickets({
          page: 0,
          limit: 75,
          search: ''
        });
        setArchivedTickets(tickets);
        if (tickets.length < 75) {
          setTotalCount(tickets.length);
        } else {
          setTotalCount(76);
        }
      } catch (err) {
        console.error('Failed to load archived tickets:', err);
        setError('Failed to load archived tickets');
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, [loadArchivedTickets]);

  // Define columns inside component to access helper functions
  const columns: TableColumn[] = useMemo(() => [
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
      format: (value: string) => getDisplayNameFromUserIdSync(value, 'Nicht zugewiesen'),
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
  ], [getDisplayNameFromUserIdSync, archivedTickets]);

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

  // Get selected ticket from local archived tickets (since they're not in global state)
  const selectedTicket = useMemo(() => {
    if (!ticketId || !archivedTickets.length) return null;
    return archivedTickets.find(t => t.id === ticketId) || null;
  }, [ticketId, archivedTickets]);

  // Only show loading screen on initial load, not during search/pagination
  if (loading && archivedTickets.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Lade archivierte Tickets...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Table
        columns={columns}
        data={tableData}
        enablePagination={true}
        rowsPerPageOptions={[50, 75, 100, 200]}
        defaultRowsPerPage={75}
        totalCount={totalCount}
        enableSorting={true}
        searchable={true}
        enableServerSideSearch={true}
        searchLoading={searchLoading}
        enableFiltering={true}
        enableRowSelection={false}
        enableRowDeletion={false}
        enableRowAddition={false}
        enableRowEditing={true}
        onEditRow={handleRowDoubleClick}
        onServerSearch={handleServerSearch}
        onPageChange={handlePageChange}
        getRowStyle={(_rowData: Record<string, any>) => ({
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
          mode="view"
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
            cost_center: selectedTicket.cost_center,
          }}
          fieldPermissions={{
            description: 'view',
            priority: 'view',
            status: 'view',
            ticketType: 'view',
            category: 'view',
            machine: 'view',
            equipmentNummer: 'view',
            raumnummer: 'view',
            responsible: 'view',
            workedByUsers: 'view',
            plannedCompletion: 'view',
            costCenter: 'view',
            workTracking: 'view',
          }}
        />
      )}
    </>
  );
};

export default WissensdatenbankWidget; 