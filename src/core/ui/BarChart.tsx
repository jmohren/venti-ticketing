import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, useTheme, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
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
  onRemoveItem?: (label: string) => void;
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
}));

const BarLabel = styled('span')(({ theme }) => ({
  ...theme.typography.body2,
  minWidth: 0,
  fontWeight: 500,
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: '0 0 auto',
  margin: 0,
  display: 'inline-flex',
  alignItems: 'center',
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
  stacked = false,
  onRemoveItem
}) => {
  const theme = useTheme();
  const [labelColumnWidth, setLabelColumnWidth] = useState<number>(0);
  
  // Calculate max value if not provided
  const calculatedMaxValue = maxValue || (() => {
    if (stacked) {
      // For stacked charts, find the maximum total value across all labels
      const labels = series.length > 0 ? series[0].data.map(d => d.label) : [];
      return Math.max(...labels.map((_label, labelIndex) => 
        series.reduce((sum, s) => sum + (s.data[labelIndex]?.value || 0), 0)
      ));
    } else {
      // For regular charts, find the maximum individual value
      return Math.max(...series.flatMap(s => s.data.map(d => d.value)));
    }
  })();

  // Get all unique labels (assumes same label order across series)
  const labels = useMemo(() => (series.length > 0 ? series[0].data.map(d => d.label) : []), [series]);

  // Measure the longest label and set a fixed width for the label column
  useEffect(() => {
    if (labels.length === 0) {
      setLabelColumnWidth(0);
      return;
    }

    const rootFontSizePx = typeof window !== 'undefined'
      ? parseFloat(getComputedStyle(document.documentElement).fontSize || '16')
      : 16;
    const body2Rem = 0.875; // matches BarLabel fontSize
    const fontSizePx = rootFontSizePx * body2Rem;
    const fontWeight = 500; // matches BarLabel fontWeight
    const fontFamily = theme.typography.fontFamily || 'Roboto, Helvetica, Arial, sans-serif';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.font = `${fontWeight} ${Math.round(fontSizePx)}px ${fontFamily}`;

    const maxTextWidth = labels.reduce((max, label) => {
      const metrics = ctx.measureText(label);
      return Math.max(max, metrics.width);
    }, 0);

    // Add horizontal padding + the gap between label and bar
    const horizontalPaddingPx = 8; // approx left/right padding inside Typography
    const gapPx = parseFloat(String(theme.spacing(1)).replace('px', '')) || 8;
    const computedWidth = Math.ceil(maxTextWidth + horizontalPaddingPx + gapPx);

    setLabelColumnWidth(computedWidth);
  }, [labels, theme]);

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
                  {onRemoveItem && (
                    <IconButton
                      size="small"
                      onClick={() => onRemoveItem(label)}
                      sx={{ 
                        p: 0,
                        mr: 0.5,
                        backgroundColor: theme.palette.grey[200],
                        '&:hover': {
                          backgroundColor: theme.palette.grey[300]
                        }
                      }}
                    >
                      <Close fontSize="small" sx={{ color: theme.palette.primary.main }} />
                    </IconButton>
                  )}
                  <BarLabel style={{ width: labelColumnWidth }}>{label}</BarLabel>
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
                  {onRemoveItem && (
                    <IconButton
                      size="small"
                      onClick={() => onRemoveItem(label)}
                      sx={{ 
                        p: 0,
                        mr: 0.5,
                        backgroundColor: theme.palette.grey[200],
                        '&:hover': {
                          backgroundColor: theme.palette.grey[300]
                        }
                      }}
                    >
                      <Close fontSize="small" sx={{ color: theme.palette.primary.main }} />
                    </IconButton>
                  )}
                  <BarLabel style={{ width: labelColumnWidth }}>{label}</BarLabel>
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