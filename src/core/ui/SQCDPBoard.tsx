import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

// Define a status ball component with consistent gray for both null and future
const StatusBall = ({ status }: { status: 'future' | 'good' | 'warning' | 'bad' | null }) => (
  <Box
    sx={{
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: theme => 
        status === 'good' ? '#43a047' :
        status === 'warning' ? '#fb8c00' :
        status === 'bad' ? '#d32f2f' :
        theme.palette.grey[300], // Light gray for both null and future
    }}
  />
);

interface SQCDPBoardProps {
  letter: string;
  monthlySQDI: { date: string; [key: string]: any }[]; // Main data source
  currentMetric: 'safety' | 'quality' | 'delivery' | 'ideas'; // Required for status lookup
  onStatusChange?: (status: 'good' | 'warning' | 'bad') => void;
}

const SQCDPBoard: React.FC<SQCDPBoardProps> = ({ letter, monthlySQDI, currentMetric, onStatusChange }) => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();

  // Helper function to format date consistently
  const formatDate = (year: number, month: number, day: number): string => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Create array of statuses for each day using date-based lookup
  const statuses = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    
    if (day > currentDay) return 'future';
    
    // Find entry for this specific date
    const dateStr = formatDate(today.getFullYear(), today.getMonth() + 1, day);
    const entry = monthlySQDI.find(item => item.date === dateStr);
    
    return entry ? entry[`${currentMetric}_status`] || null : null;
  });
  
  const handleStatusChange = (status: 'good' | 'warning' | 'bad') => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  };

  // Get current day's status for highlight effect using date-based lookup
  const todayFormatted = formatDate(today.getFullYear(), today.getMonth() + 1, currentDay);
  const todayEntry = monthlySQDI.find(entry => entry.date === todayFormatted);
  const currentStatus: 'good' | 'warning' | 'bad' | null = todayEntry ? todayEntry[`${currentMetric}_status`] || null : null;
  
  // This ref will be used to measure the circle container
  const circleContainerRef = useRef<HTMLDivElement>(null);
  const [circleSize, setCircleSize] = useState(0);
  
  // Measure the circle container size
  useEffect(() => {
    if (!circleContainerRef.current) return;
    
    const updateSize = () => {
      if (circleContainerRef.current) {
        // Use the smaller dimension to ensure a perfect circle
        const el = circleContainerRef.current;
        const size = Math.min(el.offsetWidth, el.offsetHeight);
        setCircleSize(size);
      }
    };
    
    // Update size initially and on resize
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(circleContainerRef.current);
    
    return () => {
      if (circleContainerRef.current) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <Box
      sx={{
        aspectRatio: '1/1', // Force 1:1 aspect ratio
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main circle with status balls */}
      <Box
        ref={circleContainerRef}
        sx={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Perfectly circular container for balls */}
        <Box
          sx={{
            position: 'absolute',
            width: circleSize ? `${circleSize}px` : '90%',
            height: circleSize ? `${circleSize}px` : '90%',
            maxWidth: '90%',
            maxHeight: '90%',
            borderRadius: '50%',
          }}
        >
          {/* Status balls in a circle */}
          {statuses.map((status, index) => {
            // Calculate position on circle - start at top and go clockwise
            const angle = -Math.PI/2 + (index * 2 * Math.PI) / daysInMonth;
            // Use 45% of container size for radius
            const radius = 45;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            return (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <StatusBall status={status} />
              </Box>
            );
          })}
        </Box>

        {/* Center letter */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
            fontWeight: 'bold',
            color: 'primary.main',
            zIndex: 1,
          }}
        >
          {letter}
        </Typography>
      </Box>

      {/* Status buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          pb: 1,
          flexShrink: 0,
        }}
      >
        {/* Good button */}
        <Box
          onClick={() => handleStatusChange('good')}
          sx={{
            width: '36px',
            height: '36px',
            backgroundColor: currentStatus === 'good' ? '#43a047' : 'white',
            borderRadius: '50%',
            cursor: 'pointer',
            border: '3px solid',
            borderColor: '#43a047',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CheckIcon
            fontSize="small"
            sx={{
              color: currentStatus === 'good' ? 'white' : '#43a047',
            }}
          />
        </Box>

        {/* Warning button */}
        <Box
          onClick={() => handleStatusChange('warning')}
          sx={{
            width: '36px',
            height: '36px',
            backgroundColor: currentStatus === 'warning' ? '#fb8c00' : 'white',
            borderRadius: '50%',
            cursor: 'pointer',
            border: '3px solid',
            borderColor: '#fb8c00',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <WarningIcon
            fontSize="small"
            sx={{
              color: currentStatus === 'warning' ? 'white' : '#fb8c00',
            }}
          />
        </Box>

        {/* Bad button */}
        <Box
          onClick={() => handleStatusChange('bad')}
          sx={{
            width: '36px',
            height: '36px',
            backgroundColor: currentStatus === 'bad' ? '#d32f2f' : 'white',
            borderRadius: '50%',
            cursor: 'pointer',
            border: '3px solid',
            borderColor: '#d32f2f',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CloseIcon
            fontSize="small"
            sx={{
              color: currentStatus === 'bad' ? 'white' : '#d32f2f',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SQCDPBoard; 