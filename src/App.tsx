import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { LoginForm } from '@/core/pages/LoginForm'
import { ForgotPasswordForm } from '@/core/pages/ForgotPasswordForm'
import { ResetPasswordForm } from '@/core/pages/ResetPasswordForm'
import { ForcePasswordChangeScreen } from '@/core/pages/ForcePasswordChangeScreen'
import { CircularProgress, Box, Typography, Button, AppBar, Toolbar } from '@mui/material'
import { useState, useEffect } from 'react'
import { useAuth, LoginResponse, User } from '@/core/hooks/useAuth'
import '@/App.css'
import AppMain from '@/app/AppMain'
import { resetIsAdminCache } from '@/core/hooks/useIsAdmin'

// Minimalistic loading component for quick auth checks
const QuickAuthCheck = () => (
  <Box 
    display="flex" 
    alignItems="center" 
    justifyContent="center" 
    minHeight="100vh"
  >
    <CircularProgress size={40} />
  </Box>
);

// Full loading component for initial session verification
const Loading = () => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    minHeight="100vh"
    gap={2}
  >
    <CircularProgress size={60} />
    <Typography variant="h6" color="textSecondary">
      Verifying session...
    </Typography>
    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
      Checking if you're already logged in
    </Typography>
  </Box>
);

// Header component with logout
const AppHeader: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => (
  <AppBar position="static">
    <Toolbar>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        Build your Application
      </Typography>
      <Typography variant="body1" sx={{ mr: 2 }}>
        Welcome, {user.email}
      </Typography>
      <Button color="inherit" onClick={onLogout}>
        Logout
      </Button>
    </Toolbar>
  </AppBar>
);

// Protected route component with hybrid authentication approach
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, getCurrentUser, logout, initializeSession, isSessionInitialized, hasAuthenticationIndicators, needsPasswordReset } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<'checking' | 'quick-check' | 'verified' | 'unauthenticated'>('checking');
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [forceReset, setForceReset] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // Only run this once, and not during logout process
      if (sessionChecked || isLoggingOut) return;
      
      // PHASE 1: Synchronous pre-check for auth indicators
      const hasAuthIndicators = hasAuthenticationIndicators();
      
      if (hasAuthIndicators) {
        setAuthState('quick-check');
      } else {
        setAuthState('checking');
      }
      
      // PHASE 2: Async verification (always required)
      try {
        const sessionRestored = await initializeSession();
        
        if (sessionRestored && isAuthenticated()) {
          const currentUser = getCurrentUser();
          
          if (currentUser) {
            setUser(currentUser);
            if (needsPasswordReset()) {
              setForceReset(true);
              setAuthState('verified');
            } else {
              setAuthState('verified');
            }
          } else {
            console.log('⚠️ Session restored but no user data');
            setAuthState('unauthenticated');
          }
        } else {
          setAuthState('unauthenticated');
        }
      } catch (error) {
        console.error('❌ Authentication error:', error);
        setAuthState('unauthenticated');
      }
      
      setSessionChecked(true);
    };

    checkAuth();
  }, [isAuthenticated, getCurrentUser, initializeSession, isSessionInitialized, hasAuthenticationIndicators, sessionChecked, isLoggingOut, needsPasswordReset]);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await logout();
      setUser(null);
      setAuthState('unauthenticated');
      setSessionChecked(false);
      
      // Clear cached admin state before next login
      resetIsAdminCache();
      
      // Navigate to base path to clear any view or query params
      navigate('/', { replace: true });
      
      // Add a small delay to ensure cookies are cleared before allowing re-auth
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Render based on authentication state
  switch (authState) {
    case 'checking':
      return <Loading />;
      
    case 'quick-check':
      return <QuickAuthCheck />;
      
    case 'verified':
      if (!user) {
        // Edge case: should not happen, but fallback to quick check
        return <QuickAuthCheck />;
      }
      if (forceReset) {
        return <ForcePasswordChangeScreen onSuccess={() => setForceReset(false)} />;
      }
      return (
        <>
          <AppHeader user={user} onLogout={handleLogout} />
          {children}
        </>
      );
      
    case 'unauthenticated':
      return (
        <LoginForm 
          onLoginSuccess={(loginData: LoginResponse) => {
            const newUser = {
              userId: loginData.userId,
              email: loginData.email,
              roles: loginData.roles
            };
            setUser(newUser);
            if (needsPasswordReset()) {
              setForceReset(true);
            }
            setAuthState('verified');
          }} 
        />
      );
      
    default:
      return <Loading />;
  }
};

// Main App component
const AppContent = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset" element={<ResetPasswordForm />} />

        {/* Fallback: all other routes go through auth */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <AppMain />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return <AppContent />
}

export default App
