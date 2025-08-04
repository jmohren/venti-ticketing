import React, { useEffect, useState } from 'react';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import { useAdmin } from '@/core/hooks/useAdmin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UserRolesDialog from './UserRolesDialog';

const UserManagementView: React.FC = () => {
  const { listUsers, createUser, deleteUser } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ email: string; userId: string; timeJoined?: number }[]>([]);

  // Create user form state
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogUser, setDialogUser] = useState<typeof users[0] | null>(null);

  /**
   * Generate a plausible default password of the form
   *   xxxxxx-xxxxxx-XXXXXX
   * where the last block contains at least one digit and one uppercase letter.
   */
  const generateDefaultPassword = (): string => {
    const randomLower = (len: number) => Array.from({ length: len }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');

    const digits = '0123456789';
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const all = digits + uppers + lowers;

    // Middle block with at least one uppercase and one digit
    let middle = '';
    middle += uppers[Math.floor(Math.random() * uppers.length)];
    middle += digits[Math.floor(Math.random() * digits.length)];
    while (middle.length < 6) {
      middle += all[Math.floor(Math.random() * all.length)];
    }
    middle = middle.split('').sort(() => Math.random() - 0.5).join('');

    return `${randomLower(6)}-${middle}-${randomLower(6)}`;
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await listUsers(100);
        if (isMounted) setUsers(res.users);
      } catch (err) {
        console.error('Failed to load users:', err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [listUsers]);

  return (
    <WidgetContainer
      title="User Management"
      gridPosition={{ columnStart: 1, columnSpan: 12, rowStart: 2, rowSpan: 12 }}
      elevation={3}
      noPadding={false}
    >
      <Box sx={{ width: '100%', overflowX: 'auto', p: 2 }}>
        {/* Create User Form */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Email"
            type="email"
            size="small"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Button
            variant="contained"
            disabled={creating || !newEmail}
            onClick={async () => {
              setCreating(true);
              setError(null);
              try {
                const passwordToUse = generateDefaultPassword();
                const res = await createUser(newEmail, passwordToUse);
                setUsers(prev => [...prev, res.user]);
                setSuccess('User created successfully');
                setNewEmail('');
              } catch (err) {
                console.error('Failed to create user:', err);
                setError(err instanceof Error ? err.message : 'Failed to create user');
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? <CircularProgress size={20} /> : 'Add User'}
          </Button>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : users.length === 0 ? (
          <Typography>No users found.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.userId} hover>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.userId}</TableCell>
                  <TableCell>
                    {u.timeJoined ? new Date(u.timeJoined).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {/* Delete */}
                      <IconButton size="small" onClick={async () => {
                        if (!window.confirm(`Delete user ${u.email}?`)) return;
                        try {
                          await deleteUser(u.userId);
                          setUsers(prev => prev.filter(x => x.userId !== u.userId));
                        } catch (err) {
                          console.error('Delete failed:', err);
                          setError(err instanceof Error ? err.message : 'Failed to delete user');
                        }
                      }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>

                      {/* Manage Roles */}
                      <Button size="small" variant="outlined" onClick={() => setDialogUser(u)}>
                        Manage Roles
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {dialogUser && (
        <UserRolesDialog
          open={!!dialogUser}
          user={dialogUser}
          onClose={() => setDialogUser(null)}
        />
      )}
    </WidgetContainer>
  );
};

export default UserManagementView; 