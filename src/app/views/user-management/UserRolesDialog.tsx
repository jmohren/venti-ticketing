import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { AdminUser } from '@/core/api/admin/AdminApiClient';
import { useAdmin } from '@/core/hooks/useAdmin';

interface Props {
  open: boolean;
  onClose: () => void;
  user: AdminUser;
}

const UserRolesDialog: React.FC<Props> = ({ open, onClose, user }) => {
  const { getUserRoles, assignRole, revokeRole } = useAdmin();

  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserRoles(user.userId);
      setRoles(res.roles);
    } catch (err) {
      console.error('Fetch roles failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const appRole = import.meta.env.VITE_APP_NAME || 'app-user';
  const hasProjectRoles = roles.includes(appRole);
  const isAdmin = roles.includes('admin');

  const handleToggle = async (type: 'user' | 'admin', value: boolean) => {
    setSaving(true);
    setError(null);
    try {
      if (type === 'user') {
        if (value) {
          await assignRole(user.userId, appRole);
          setRoles(prev => [...prev, appRole]);
        } else {
          await revokeRole(user.userId, appRole);
          setRoles(prev => prev.filter(r => r !== appRole));
        }
      } else {
        if (value) {
          await assignRole(user.userId, 'admin');
          setRoles(prev => [...prev, 'admin']);
        } else {
          await revokeRole(user.userId, 'admin');
          setRoles(prev => prev.filter(r => r !== 'admin'));
        }
      }
    } catch (err) {
      console.error('Role change failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update roles');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>User Roles</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography><strong>Email:</strong> {user.email}</Typography>
          <Typography><strong>User ID:</strong> {user.userId}</Typography>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              <Stack spacing={2} direction="column">
                <FormControlLabel
                  control={
                    <Switch
                      checked={hasProjectRoles}
                      onChange={() => handleToggle('user', !hasProjectRoles)}
                      disabled={saving}
                      color="primary"
                    />
                  }
                  label="User"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={isAdmin}
                      onChange={() => handleToggle('admin', !isAdmin)}
                      disabled={saving}
                      color="secondary"
                    />
                  }
                  label="Admin"
                />
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserRolesDialog; 