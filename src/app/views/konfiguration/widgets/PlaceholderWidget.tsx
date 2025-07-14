import React from 'react';
import { Box, Typography } from '@mui/material';

const PlaceholderWidget: React.FC = () => (
  <Box sx={{ p:2, height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
    <Typography variant="body2" color="text.secondary">(Platzhalter)</Typography>
  </Box>
);

export default PlaceholderWidget; 