import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartSeries {
  name: string;
  data: BarChartDataPoint[];
  color?: string;
}

interface BarChartProps {
  series: BarChartSeries[];
  height?: number;
  maxValue?: number;
  showValues?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
}

const ChartContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  height: '100%',
}));

const BarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const BarLabel = styled(Typography)(({ theme }) => ({
  minWidth: 120,
  fontWeight: 500,
  fontSize: '0.875rem',
}));

const BarTrack = styled(Box)(({ theme }) => ({
  flex: 1,
  height: 24,
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  overflow: 'hidden',
}));

const BarSegment = styled(Box)<{ width: number; color: string }>(({ theme, width, color }) => ({
  height: '100%',
  width: `${width}%`,
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: theme.palette.getContrastText(color),
  transition: 'width 0.3s ease',
}));

const StackedBarSegment = styled(Box)<{ width: number; color: string }>(({ theme, width, color }) => ({
  height: '100%',
  width: `${width}%`,
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: theme.palette.getContrastText(color),
  transition: 'width 0.3s ease',
}));

const ValueLabel = styled(Typography)(() => ({
  minWidth: 30,
  textAlign: 'right',
  fontSize: '0.875rem',
  fontWeight: 500,
}));

const BarChart: React.FC<BarChartProps> = ({ 
  series, 
  height = 300, 
  maxValue, 
  showValues = true,
  stacked = false 
}) => {
  const theme = useTheme();
  
  // Calculate max value if not provided
  const calculatedMaxValue = maxValue || (() => {
    if (stacked) {
      // For stacked charts, find the maximum total value across all labels
      const labels = series.length > 0 ? series[0].data.map(d => d.label) : [];
      return Math.max(...labels.map((label, labelIndex) => 
        series.reduce((sum, s) => sum + (s.data[labelIndex]?.value || 0), 0)
      ));
    } else {
      // For regular charts, find the maximum individual value
      return Math.max(...series.flatMap(s => s.data.map(d => d.value)));
    }
  })();

  // Get all unique labels
  const labels = series.length > 0 ? series[0].data.map(d => d.label) : [];

  // Default colors from MUI palette
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
  ];

  return (
    <ChartContainer sx={{ height }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {labels.map((label, labelIndex) => {
          if (stacked) {
            // Stacked bar chart
            const totalValue = series.reduce((sum, s) => sum + s.data[labelIndex]?.value || 0, 0);
            const percentage = calculatedMaxValue > 0 ? (totalValue / calculatedMaxValue) * 100 : 0;
            
            return (
              <BarContainer key={label}>
                <BarLabel>{label}</BarLabel>
                <BarTrack>
                  <Box sx={{ display: 'flex', height: '100%', width: `${percentage}%` }}>
                    {series.map((s, seriesIndex) => {
                      const value = s.data[labelIndex]?.value || 0;
                      const segmentPercentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
                      const color = s.color || defaultColors[seriesIndex % defaultColors.length];
                      
                      return (
                        <StackedBarSegment
                          key={s.name}
                          width={segmentPercentage}
                          color={color}
                        >
                          {value > 0 ? value : ''}
                        </StackedBarSegment>
                      );
                    })}
                  </Box>
                </BarTrack>
                {showValues && <ValueLabel>{totalValue}</ValueLabel>}
              </BarContainer>
            );
          } else {
            // Grouped bar chart (showing first series only for simplicity)
            const firstSeries = series[0];
            const dataPoint = firstSeries?.data[labelIndex];
            if (!dataPoint) return null;
            
            const percentage = calculatedMaxValue > 0 ? (dataPoint.value / calculatedMaxValue) * 100 : 0;
            const color = dataPoint.color || firstSeries.color || defaultColors[0];
            
            return (
              <BarContainer key={label}>
                <BarLabel>{label}</BarLabel>
                <BarTrack>
                  <BarSegment width={percentage} color={color}>
                    {dataPoint.value > 0 && percentage > 20 ? dataPoint.value : ''}
                  </BarSegment>
                </BarTrack>
                {showValues && <ValueLabel>{dataPoint.value}</ValueLabel>}
              </BarContainer>
            );
          }
        })}
      </Box>
    </ChartContainer>
  );
};

export default BarChart; 