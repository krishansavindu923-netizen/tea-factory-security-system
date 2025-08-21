import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Original components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeManagement from './components/EmployeeManagement';
import SecurityMonitoring from './components/SecurityMonitoring';

// ⚡ NEW: Audio components for fire alarm
import TestAudio from './components/TestAudio';
import FireAlarmSound from './components/FireAlarmSound';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2E7D32' },
    secondary: { main: '#FF6F00' }
  }
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isLoggedIn) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* ⚡ Audio components available on login page too */}
        <TestAudio />
        <FireAlarmSound />
        
        <Login setAuth={setIsLoggedIn} />
        <ToastContainer />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* ⚡ Audio components - always available regardless of page */}
      <TestAudio />
      <FireAlarmSound />
      
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🏭 Craig Tea Factory Security System
          </Typography>
          <Button color="inherit" onClick={() => setCurrentPage('dashboard')}>Dashboard</Button>
          <Button color="inherit" onClick={() => setCurrentPage('employees')}>Employees</Button>
          <Button color="inherit" onClick={() => setCurrentPage('security')}>Security</Button>
          <Button color="inherit" onClick={() => setIsLoggedIn(false)}>Logout</Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'employees' && <EmployeeManagement />}
        {currentPage === 'security' && <SecurityMonitoring />}
      </Container>
      
      <ToastContainer />
    </ThemeProvider>
  );
}

export default App;
