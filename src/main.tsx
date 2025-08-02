import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import '@/index.css'
import App from '@/App.tsx'
import { AuthProvider } from '@/core/state/AuthProvider.tsx'
import { UserProvider } from '@/core/state/UserProvider.tsx'

const theme = createTheme({
  palette: {
    primary: {
      // main: '#286982', // Your custom primary color 
      main: '#2B67AD', // Your custom primary color 
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <AuthProvider>
          <UserProvider>
            <App/>
          </UserProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </StrictMode>,
)
