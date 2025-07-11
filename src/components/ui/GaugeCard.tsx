import React from 'react';
import { Box, Typography } from '@mui/material';
import { Gauge } from '@mui/x-charts';

interface GaugeCardProps {
  title: string;
  value: number;
}

const GaugeCard: React.FC<GaugeCardProps> = ({ title, value }) => {
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      position: 'relative'
    }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Gauge 
        value={value} 
        startAngle={-110}
        endAngle={110}
        valueMax={100}
      />
    </Box>
  );
};

export default GaugeCard; 