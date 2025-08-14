import React, { useMemo } from 'react';
import { useTickets } from '@/app/hooks/useTickets';
import { useTechnicians } from '@/app/hooks/useTechnicians';
import { Box, Typography, useTheme, Chip } from '@mui/material';
import BarChart, { BarChartSeries } from '@/core/ui/BarChart';

const TechnicianLoadWidget: React.FC = () => {
  const { tickets } = useTickets();
  const { technicians, getTechnicianDisplayName } = useTechnicians();
  const theme = useTheme();

  const chartData = useMemo(() => {
    // Initialize data for all official technicians (keyed by userId)
    const technicianData: Record<string, { backlog: number; progress: number; displayName: string }> = {};
    
    // Start with all official technicians (with 0 tickets initially)
    technicians.forEach(technician => {
      const displayName = getTechnicianDisplayName(technician);
      technicianData[technician.userId] = { backlog: 0, progress: 0, displayName };
    });
    
    // Aggregate actual ticket data by technician userId
    tickets.forEach(t => {
      if (!t.responsible) return;
      if (!['backlog', 'progress'].includes(t.status)) return;
      
      // Only count tickets assigned to official technicians (by userId)
      if (technicianData[t.responsible]) {
        technicianData[t.responsible][t.status as 'backlog' | 'progress'] += 1;
      }
    });

    // Convert to array and sort by total load (backlog + progress), then by name
    const sortedTechnicians = Object.entries(technicianData)
      .map(([, data]) => ({
        name: data.displayName,
        backlog: data.backlog,
        progress: data.progress,
        total: data.backlog + data.progress
      }))
      .sort((a, b) => {
        // First sort by total load (descending)
        if (b.total !== a.total) {
          return b.total - a.total;
        }
        // Then sort by name (ascending) for consistent ordering when loads are equal
        return a.name.localeCompare(b.name);
      });

    // Transform to BarChart format
    const series: BarChartSeries[] = [
      {
        name: 'Backlog',
        color: theme.palette.primary.dark,
        data: sortedTechnicians.map(tech => ({
          label: tech.name,
          value: tech.backlog
        }))
      },
      {
        name: 'In Bearbeitung',
        color: theme.palette.primary.light,
        data: sortedTechnicians.map(tech => ({
          label: tech.name,
          value: tech.progress
        }))
      }
    ];

    return series;
  }, [tickets, technicians, getTechnicianDisplayName, theme]);

  if (technicians.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Keine Service Techniker konfiguriert
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Legend */}
      <Box sx={{ p: 2, pb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="Backlog"
          size="small"
          sx={{
            backgroundColor: theme.palette.primary.dark,
            color: theme.palette.primary.contrastText,
            '& .MuiChip-label': { fontWeight: 500 }
          }}
        />
        <Chip
          label="In Bearbeitung"
          size="small"
          sx={{
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
            '& .MuiChip-label': { fontWeight: 500 }
          }}
        />
      </Box>
      
      {/* Chart */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <BarChart 
          series={chartData}
          stacked={true}
          showValues={true}
        />
      </Box>
    </Box>
  );
};

export default TechnicianLoadWidget; 