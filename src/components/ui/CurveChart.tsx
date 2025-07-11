import React, { useState, useRef } from 'react';
import { Box } from '@mui/material';

interface Dataset {
  data: number[];
  color: string;
  label?: string;
}

interface CurveChartProps {
  datasets?: Dataset[];
  // Legacy props for backward compatibility
  data?: number[];
  color?: string;
  
  min?: number;
  max?: number;
  strokeWidth?: number;
  pointSize?: number;
  tooltipFormatter?: (value: number, index: number, label?: string) => string;
}

const CurveChart: React.FC<CurveChartProps> = ({
  datasets,
  // Legacy props
  data = [20, 45, 35, 60, 55, 75, 70, 85, 80, 90, 88],
  color = '#1976d2',
  
  min = 0,
  max = 100,
  strokeWidth = 3,
  pointSize = 1,
  tooltipFormatter = (value, _index, label) => label ? `${label}: ${value}` : value.toString()
}) => {
  // Convert legacy props to new format if datasets not provided
  const chartDatasets: Dataset[] = datasets || [{ data, color, label: 'Data' }];
  
  const [hoveredPoint, setHoveredPoint] = useState<{ 
    datasetIndex: number; 
    pointIndex: number; 
    value: number; 
    x: number; 
    y: number;
    label?: string;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [aspectRatio, setAspectRatio] = useState(1);

  // Create SVG viewBox
  const viewBoxWidth = 100;
  const viewBoxHeight = 100;

  // Calculate aspect ratio to fix circle distortion
  React.useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setAspectRatio(rect.width / rect.height);
    }
  }, []);
  
  // Convert all datasets to normalized coordinates
  const normalizedDatasets = chartDatasets.map(dataset => 
    dataset.data.map((value, index) => ({
      x: (index / (dataset.data.length - 1)) * viewBoxWidth,
      y: viewBoxHeight - ((value - min) / (max - min)) * viewBoxHeight,
      originalValue: value
    }))
  );
  
  // Handle mouse move to find closest point across all datasets
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseXPercent = (mouseX / rect.width) * viewBoxWidth;
    
    let closestPoint: typeof hoveredPoint = null;
    let closestDistance = Infinity;
    
    // Find closest point across all datasets
    normalizedDatasets.forEach((normalizedData, datasetIndex) => {
      normalizedData.forEach((point, pointIndex) => {
        const distance = Math.abs(point.x - mouseXPercent);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = {
            datasetIndex,
            pointIndex,
            value: point.originalValue,
            x: point.x,
            y: point.y,
            label: chartDatasets[datasetIndex].label
          };
        }
      });
    });
    
    setHoveredPoint(closestPoint);
  };
  
  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };
  
  // Create smooth curve path using cubic bezier curves with improved smoothing
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    if (points.length === 2) {
      // Simple line for 2 points
      path += ` L ${points[1].x} ${points[1].y}`;
      return path;
    }
    
    // Calculate control points for smoother curves
    const tension = 0.15; // Adjust this value to control smoothness (0-1)
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      // Get previous point for direction calculation
      const prev = i > 0 ? points[i - 1] : current;
      
      // Calculate control points using only current and previous points
      // This ensures the curve only smooths AFTER a dot, not influenced by future dots
      
      // First control point: based on direction from previous point
      const prevDirection = {
        x: current.x - prev.x,
        y: current.y - prev.y
      };
      
      const cp1x = current.x + prevDirection.x * tension;
      const cp1y = current.y + prevDirection.y * tension;
      
      // Second control point: based on direction approaching the target point
      // Use the direction from current to next, but don't look beyond the target
      const nextDirection = {
        x: next.x - current.x,
        y: next.y - current.y
      };
      
      const cp2x = next.x - nextDirection.x * tension;
      const cp2y = next.y - nextDirection.y * tension;
      
      // Use cubic bezier curve for smooth transitions
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    
    return path;
  };
  
  // Calculate y-axis tick marks
  const calculateTicks = (min: number, max: number) => {
    const range = max - min;
    const tickCount = 5; // Number of tick marks
    const step = range / (tickCount - 1);
    const ticks = [];
    
    for (let i = 0; i < tickCount; i++) {
      const value = min + (step * i);
      const yPosition = viewBoxHeight - ((value - min) / range) * viewBoxHeight;
      ticks.push({ value, yPosition });
    }
    
    return ticks;
  };
  
  const yTicks = calculateTicks(min, max);
  
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      position: 'relative'
    }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block',
          cursor: 'crosshair'
        }}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Y-axis tick marks */}
        {yTicks.map((tick, index) => (
          <line
            key={index}
            x1={0}
            y1={tick.yPosition}
            x2={viewBoxWidth}
            y2={tick.yPosition}
            stroke="#e0e0e0"
            strokeWidth={0.3}
            opacity={0.7}
          />
        ))}
        
        {/* Vertical hover line */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={0}
            x2={hoveredPoint.x}
            y2={viewBoxHeight}
            stroke="#d0d0d0"
            strokeWidth={0.5}
            opacity={0.8}
          />
        )}
        
        {/* Render curves for each dataset */}
        {normalizedDatasets.map((normalizedData, datasetIndex) => {
          const dataset = chartDatasets[datasetIndex];
          const linePath = createSmoothPath(normalizedData);
          
          return (
            <g key={datasetIndex}>
              {/* Line curve */}
              <path
                d={linePath}
                fill="none"
                stroke={dataset.color}
                strokeWidth={strokeWidth / 5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {normalizedData.map((point, pointIndex) => (
                <ellipse
                  key={`${datasetIndex}-${pointIndex}`}
                  cx={point.x}
                  cy={point.y}
                  rx={hoveredPoint?.datasetIndex === datasetIndex && hoveredPoint?.pointIndex === pointIndex ? pointSize * 1.5 : pointSize}
                  ry={(hoveredPoint?.datasetIndex === datasetIndex && hoveredPoint?.pointIndex === pointIndex ? pointSize * 1.5 : pointSize) * aspectRatio}
                  fill={dataset.color}
                  opacity={hoveredPoint?.datasetIndex === datasetIndex && hoveredPoint?.pointIndex === pointIndex ? 1 : 0.8}
                  style={{ 
                    transition: 'rx 0.2s ease, ry 0.2s ease, opacity 0.2s ease'
                  }}
                />
              ))}
            </g>
          );
        })}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <Box
          sx={{
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
            left: `${hoveredPoint.x}%`,
            top: `${hoveredPoint.y}%`,
            transform: 'translate(-50%, -120%)',
            whiteSpace: 'nowrap'
          }}
        >
          {tooltipFormatter(hoveredPoint.value, hoveredPoint.pointIndex, hoveredPoint.label)}
        </Box>
      )}
    </Box>
  );
};

export default CurveChart; 