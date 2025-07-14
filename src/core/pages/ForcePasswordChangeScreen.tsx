import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Alert, Typography } from '@mui/material';
import { useAuth } from '../../core/hooks/useAuth';

interface Props {
  onSuccess: () => void;
}

const ForcePasswordChangeScreen: React.FC<Props> = ({ onSuccess }) => {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await changePassword(currentPassword, newPassword);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" p={2}>
      <Box maxWidth={400} width="100%">
        <Typography variant="h5" gutterBottom>Change Password</Typography>
        {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            margin="normal"
            required
            value={currentPassword}
            onChange={(e)=>setCurrentPassword(e.target.value)}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            required
            value={newPassword}
            onChange={(e)=>setNewPassword(e.target.value)}
          />
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            required
            value={confirmPassword}
            onChange={(e)=>setConfirmPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt:2 }} disabled={loading}>
            {loading ? <CircularProgress size={24}/> : 'Update Password'}
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export { ForcePasswordChangeScreen }; 