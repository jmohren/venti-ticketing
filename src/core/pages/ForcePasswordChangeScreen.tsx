import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Alert, Typography, Divider } from '@mui/material';
import { useAuth } from '../../core/hooks/useAuth';

interface Props {
  onSuccess: () => void;
}

const ForcePasswordChangeScreen: React.FC<Props> = ({ onSuccess }) => {
  const { changePassword, updateProfile } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Change password
      await changePassword(currentPassword, newPassword);
      
      // Step 2: Update profile information
      await updateProfile(firstName.trim(), lastName.trim());
      
      // Success - call onSuccess callback
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password and profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" p={2}>
      <Box maxWidth={450} width="100%">
        <Typography variant="h5" gutterBottom>Complete Your Profile</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please change your password and complete your profile information to continue.
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          {/* Profile Information Section */}
          <Typography variant="h6" sx={{ mb: 1 }}>Profile Information</Typography>
          <TextField
            label="First Name"
            type="text"
            fullWidth
            margin="normal"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
          />
          <TextField
            label="Last Name"
            type="text"
            fullWidth
            margin="normal"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
          />
          
          <Divider sx={{ my: 3 }} />
          
          {/* Password Change Section */}
          <Typography variant="h6" sx={{ mb: 1 }}>Change Password</Typography>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            margin="normal"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            margin="normal"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            sx={{ mt: 3 }} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Complete Setup'}
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export { ForcePasswordChangeScreen }; 