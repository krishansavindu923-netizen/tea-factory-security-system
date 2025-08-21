import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

interface LoginProps {
  setAuth: (auth: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setAuth }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleLogin = () => {
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      setAuth(true);
      toast.success('🎉 Login Successful! Welcome to Craig Tea Factory');
    } else {
      toast.error('❌ Invalid Credentials. Try admin/admin123');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Container maxWidth="sm">
        <motion.div 
          initial={{ y: -50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Paper elevation={10} sx={{ 
            p: 4, 
            background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
            borderRadius: 3
          }}>
            <Box textAlign="center" mb={3}>
              <Typography variant="h2" sx={{ mb: 1 }}>🏭</Typography>
              <Typography variant="h4" color="white" gutterBottom fontWeight="bold">
                Craig Tea Factory
              </Typography>
              <Typography variant="h6" color="white" sx={{ opacity: 0.9 }}>
                Security Control Center
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Username"
              variant="filled"
              margin="normal"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              onKeyPress={handleKeyPress}
              sx={{ 
                bgcolor: 'white', 
                borderRadius: 1,
                '& .MuiFilledInput-root': { borderRadius: 1 }
              }}
            />
            
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="filled"
              margin="normal"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              onKeyPress={handleKeyPress}
              sx={{ 
                bgcolor: 'white', 
                borderRadius: 1,
                '& .MuiFilledInput-root': { borderRadius: 1 }
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleLogin}
              sx={{ 
                mt: 3, 
                py: 1.5, 
                bgcolor: '#FF6F00', 
                '&:hover': { bgcolor: '#E65100' },
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
              size="large"
            >
              🔐 ACCESS SYSTEM
            </Button>

            <Box mt={2} textAlign="center">
              <Typography variant="body2" color="white" sx={{ opacity: 0.7 }}>
                Demo Credentials: admin / admin123
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </div>
  );
};

export default Login;
