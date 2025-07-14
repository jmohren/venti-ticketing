import React, { useMemo } from 'react';
import { useTickets } from '../../../../hooks/useTickets';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';

const TechnicianLoadWidget: React.FC = () => {
  const { tickets } = useTickets();

  const data = useMemo(() => {
    const rows: Record<string, { backlog: number; progress: number }> = {};
    tickets.forEach(t => {
      if (!t.responsible) return;
      if (!['backlog', 'progress'].includes(t.status)) return;
      if (!rows[t.responsible]) rows[t.responsible] = { backlog: 0, progress: 0 };
      rows[t.responsible][t.status as 'backlog' | 'progress'] += 1;
    });
    return Object.entries(rows).map(([tech, counts]) => ({ tech, ...counts }));
  }, [tickets]);

  if (data.length === 0) return <Paper sx={{ p: 2 }}>Keine offenen Tickets</Paper>;

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '100%', overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Techniker</TableCell>
            <TableCell align="right">Backlog</TableCell>
            <TableCell align="right">In Bearbeitung</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.tech} hover>
              <TableCell component="th" scope="row">{row.tech}</TableCell>
              <TableCell align="right">{row.backlog}</TableCell>
              <TableCell align="right">{row.progress}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TechnicianLoadWidget; 