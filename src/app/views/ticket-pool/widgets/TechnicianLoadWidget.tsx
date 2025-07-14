import React, { useMemo } from 'react';
import { useTickets } from '@/app/hooks/useTickets';
import { Box, Typography, useTheme, Chip } from '@mui/material';
import BarChart, { BarChartSeries } from '@/core/ui/BarChart';

const TechnicianLoadWidget: React.FC = () => {
  const { tickets } = useTickets();
  const theme = useTheme();

  const chartData = useMemo(() => {
    const technicianData: Record<string, { backlog: number; progress: number }> = {};
    
    // Aggregate ticket data by technician
    tickets.forEach(t => {
      if (!t.responsible) return;
      if (!['backlog', 'progress'].includes(t.status)) return;
      
      if (!technicianData[t.responsible]) {
        technicianData[t.responsible] = { backlog: 0, progress: 0 };
      }
      
      technicianData[t.responsible][t.status as 'backlog' | 'progress'] += 1;
    });

    // Convert to array and sort by total load (backlog + progress)
    const sortedTechnicians = Object.entries(technicianData)
      .map(([tech, counts]) => ({
        name: tech,
        backlog: counts.backlog,
        progress: counts.progress,
        total: counts.backlog + counts.progress
      }))
      .sort((a, b) => b.total - a.total);

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
  }, [tickets, theme]);

  if (chartData[0]?.data.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Keine offenen Tickets
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