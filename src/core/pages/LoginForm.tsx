import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth, LoginResponse } from '../../core/hooks/useAuth';
import { Link as RouterLink } from 'react-router-dom';

interface LoginFormProps {
  onLoginSuccess: (response: LoginResponse) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login(email, password);
      onLoginSuccess(response);
    } catch (err) {
      console.error('❌ Login failed:', err);
      
      // Handle specific role missing error
      if (err instanceof Error && err.message.startsWith('ACCESS_DENIED:')) {
        const roleError = err.message.replace('ACCESS_DENIED: ', '');
        setError(`Access Denied: ${roleError}`);
      } else {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Morpheus AI Platform
        </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in to your account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
              autoComplete="email"
              autoFocus
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
              autoComplete="current-password"
          />
          <Button
            component={RouterLink}
            to="/forgot-password"
            variant="text"
            sx={{ mt: 1, mb: 1 }}
            fullWidth
          >
            Forgot password?
          </Button>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export { LoginForm }; 