import React, { useState, useEffect } from 'react'; 
import {  
  Grid,  
  Card,  
  CardContent,  
  Typography,  
  Box,  
  Chip, 
  Alert, 
  Switch, 
  FormControlLabel, 
  Button, 
  Paper 
} from '@mui/material'; 
import { motion } from 'framer-motion'; 
import {  
  Videocam,  
  VideocamOff,  
  Security,  
  Warning,  
  CheckCircle, 
  RadioButtonChecked 
} from '@mui/icons-material'; 

const SecurityMonitoring = () => { 
  const [cameras, setCameras] = useState([ 
    {  
      id: 1,  
      name: 'Main Entrance',  
      status: 'Online',  
      location: 'Zone A',
      lastActivity: '2 minutes ago', 
      recording: true 
    }, 
    {  
      id: 2,  
      name: 'Production Floor',  
      status: 'Online',  
      location: 'Zone B', 
      lastActivity: '5 minutes ago', 
      recording: true 
    }, 
    {  
      id: 3,  
      name: 'Packaging Area',  
      status: 'Online',  
      location: 'Zone C', 
      lastActivity: '1 minute ago', 
      recording: true 
    }, 
    {  
      id: 4,  
      name: 'Storage Room',  
      status: 'Offline',  
      location: 'Zone D', 
      lastActivity: '1 hour ago', 
      recording: false 
    }, 
    {  
      id: 5,  
      name: 'Loading Bay',  
      status: 'Online',
      location: 'Zone E', 
      lastActivity: '3 minutes ago', 
      recording: true 
    }, 
    {  
      id: 6,  
      name: 'Quality Control',  
      status: 'Online',  
      location: 'Zone F', 
      lastActivity: '30 seconds ago', 
      recording: true 
    } 
  ]); 

  const [securityAlerts, setSecurityAlerts] = useState([ 
    { id: 1, type: 'Motion', zone: 'Zone B', time: '09:15', severity: 'low' }, 
    { id: 2, type: 'Access', zone: 'Main Entrance', time: '09:10', severity: 'normal' }, 
    { id: 3, type: 'Camera Offline', zone: 'Zone D', time: '08:45', severity: 'high' } 
  ]); 

  const [systemSettings, setSystemSettings] = useState({ 
    motionDetection: true, 
    audioRecording: false, 
    nightVision: true, 
    autoLock: true 
  }); 

  // Alert system states
  const [alertResult, setAlertResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simulate real-time camera status updates 
  useEffect(() => { 
    const interval = setInterval(() => { 
      setCameras(prev =>
        prev.map(camera => ({ 
          ...camera, 
          lastActivity: camera.status === 'Online' ?  
            `${Math.floor(Math.random() * 10) + 1} ${Math.random() > 0.5 ? 'seconds' : 'minutes'} ago` : 
            camera.lastActivity 
        })) 
      ); 
    }, 5000); 

    return () => clearInterval(interval); 
  }, []); 

  // Clear alert result after 5 seconds
  useEffect(() => {
    if (alertResult) {
      const timer = setTimeout(() => setAlertResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alertResult]);

  const onlineCameras = cameras.filter(cam => cam.status === 'Online').length; 
  const offlineCameras = cameras.filter(cam => cam.status === 'Offline').length; 

  // ========== FREE MULTI-PLATFORM ALERT FUNCTIONS ==========

  // Free fire alert function
  const sendFreeFireAlert = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/free-fire-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      setAlertResult(result);

      if (result.success) {
        const alertMessage = `🔥 FREE Fire Alert Sent!
📧 Email: ${result.platforms.email ? '✅ Sent' : '❌ Failed'}
📱 SMS: ${result.platforms.sms ? '✅ Sent' : '❌ Failed'}  
💚 WhatsApp: ${result.platforms.whatsapp ? '✅ Sent' : '❌ Failed'}

Success: ${result.successCount}/${result.totalPlatforms} platforms
Check all your devices!`;
        alert(alertMessage);
        console.log('Free multi-platform fire alert sent successfully');
      } else {
        alert('❌ Free fire alert system error');
      }
    } catch (error) {
      console.error('Free fire alert failed:', error);
      alert('❌ Free fire alert system error: ' + error.message);
      setAlertResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  // Free access alert function
  const sendFreeAccessAlert = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/free-access-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: 'Unknown Person',
          location: 'Main Entrance'
        })
      });

      const result = await response.json();
      setAlertResult(result);

      if (result.success) {
        const alertMessage = `🚫 FREE Access Alert Sent!
📧 Email: ${result.platforms.email ? '✅ Sent' : '❌ Failed'}
📱 SMS: ${result.platforms.sms ? '✅ Sent' : '❌ Failed'}
💚 WhatsApp: ${result.platforms.whatsapp ? '✅ Sent' : '❌ Failed'}

Success: ${result.successCount}/${result.totalPlatforms} platforms`;
        alert(alertMessage);
      } else {
        alert('❌ Free access alert system error');
      }
    } catch (error) {
      console.error('Free access alert failed:', error);
      alert('❌ Free access alert system error: ' + error.message);
      setAlertResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  // Free motion alert function  
  const sendFreeMotionAlert = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/free-motion-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      setAlertResult(result);

      if (result.success) {
        const alertMessage = `🏃 FREE Motion Alert Sent!
📧 Email: ${result.platforms.email ? '✅ Sent' : '❌ Failed'}
📱 SMS: ${result.platforms.sms ? '✅ Sent' : '❌ Failed'}
💚 WhatsApp: ${result.platforms.whatsapp ? '✅ Sent' : '❌ Failed'}

Success: ${result.successCount}/${result.totalPlatforms} platforms`;
        alert(alertMessage);
      } else {
        alert('❌ Free motion alert system error');
      }
    } catch (error) {
      console.error('Free motion alert failed:', error);
      alert('❌ Free motion alert system error: ' + error.message);
      setAlertResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  // ========== ORIGINAL EMAIL-ONLY FUNCTIONS (Backup) ==========

  // Original email-only fire alert (backup)
  const sendEmailOnlyFireAlert = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/fire-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      setAlertResult(result);

      if (result.success && result.emailSent) {
        alert('🔥 Fire Alert Sent to Email! Check your phone immediately.');
        console.log('Fire alert email sent successfully');
      } else {
        alert('❌ Fire alert triggered but email failed to send');
        console.error('Email send failed');
      }
    } catch (error) {
      console.error('Fire alert failed:', error);
      alert('❌ Fire alert system error: ' + error.message);
      setAlertResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  const CameraCard = ({ camera, index }) => ( 
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      transition={{ delay: index * 0.1 }} 
      whileHover={{ scale: 1.02 }} 
    > 
      <Card elevation={6} sx={{ height: '100%', position: 'relative' }}> 
        <CardContent> 
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}> 
            <Typography variant="h6" fontWeight="bold"> 
              {camera.name} 
            </Typography> 
            <Chip  
              label={camera.status}  
              color={camera.status === 'Online' ? 'success' : 'error'}
              icon={camera.status === 'Online' ? <CheckCircle /> : <Warning />} 
            /> 
          </Box> 
           
          {/* Camera Feed Simulation */} 
          <Box  
            sx={{  
              height: 200,  
              bgcolor: camera.status === 'Online' ? '#000' : '#424242', 
              borderRadius: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              position: 'relative', 
              mb: 2, 
              border: camera.status === 'Online' ? '2px solid #4CAF50' : '2px solid #f44336' 
            }} 
          > 
            {camera.status === 'Online' ? ( 
              <> 
                <Box sx={{ color: 'white', textAlign: 'center' }}> 
                  <Videocam sx={{ fontSize: 40, mb: 1 }} /> 
                  <Typography>LIVE FEED</Typography> 
                  <Typography variant="caption">HD 1080p</Typography> 
                </Box> 
                 
                {/* Recording indicator */} 
                {camera.recording && ( 
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 10,
                    right: 10, 
                    display: 'flex', 
                    alignItems: 'center', 
                    bgcolor: 'rgba(255,0,0,0.8)', 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1 
                  }}> 
                    <RadioButtonChecked sx={{ color: 'white', fontSize: 16, mr: 0.5 }} /> 
                    <Typography variant="caption" color="white">REC</Typography> 
                  </Box> 
                )} 
                 
                {/* Timestamp */} 
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 10, 
                  left: 10, 
                  bgcolor: 'rgba(0,0,0,0.7)', 
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 1 
                }}> 
                  <Typography variant="caption" color="white"> 
                    {new Date().toLocaleString()} 
                  </Typography> 
                </Box> 
              </> 
            ) : ( 
              <Box sx={{ color: '#fff', textAlign: 'center' }}> 
                <VideocamOff sx={{ fontSize: 40, mb: 1 }} />
                <Typography>NO SIGNAL</Typography> 
                <Typography variant="caption">Camera Offline</Typography> 
              </Box> 
            )} 
          </Box> 
           
          <Box> 
            <Typography variant="body2" color="textSecondary"> 
              <strong>Location:</strong> {camera.location} 
            </Typography> 
            <Typography variant="body2" color="textSecondary"> 
              <strong>Last Activity:</strong> {camera.lastActivity} 
            </Typography> 
          </Box> 
        </CardContent> 
      </Card> 
    </motion.div> 
  ); 

  return ( 
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}> 
      <motion.div 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
      > 
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}> 
          📹 Security Monitoring Center 
        </Typography> 
        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}> 
          Real-time surveillance and FREE multi-platform alert management 
        </Typography>
      </motion.div> 

      {/* Alert Result Display */}
      {alertResult && (
        <Alert 
          severity={alertResult.success ? 'success' : 'error'} 
          sx={{ mb: 3 }}
          onClose={() => setAlertResult(null)}
        >
          {alertResult.success 
            ? `✅ Alert sent successfully! Multi-platform notifications delivered`
            : `❌ Alert failed: ${alertResult.error || 'Unknown error'}`
          }
        </Alert>
      )}

      {/* Status Overview */} 
      <Grid container spacing={3} sx={{ mb: 4 }}> 
        <Grid item xs={12} md={3}> 
          <Card elevation={4} sx={{ background: 'linear-gradient(135deg, #4CAF50, #45a049)' }}> 
            <CardContent sx={{ textAlign: 'center' }}> 
              <Security sx={{ fontSize: 40, color: 'white', mb: 1 }} /> 
              <Typography color="white" variant="h4" fontWeight="bold"> 
                {onlineCameras} 
              </Typography> 
              <Typography color="white" variant="h6"> 
                Cameras Online 
              </Typography> 
            </CardContent> 
          </Card> 
        </Grid> 

        <Grid item xs={12} md={3}> 
          <Card elevation={4} sx={{ background: 'linear-gradient(135deg, #f44336, #d32f2f)' }}> 
            <CardContent sx={{ textAlign: 'center' }}> 
              <Warning sx={{ fontSize: 40, color: 'white', mb: 1 }} /> 
              <Typography color="white" variant="h4" fontWeight="bold"> 
                {offlineCameras} 
              </Typography> 
              <Typography color="white" variant="h6"> 
                Cameras Offline 
              </Typography> 
            </CardContent> 
          </Card> 
        </Grid>

        <Grid item xs={12} md={3}> 
          <Card elevation={4} sx={{ background: 'linear-gradient(135deg, #FF9800, #F57C00)' }}> 
            <CardContent sx={{ textAlign: 'center' }}> 
              <CheckCircle sx={{ fontSize: 40, color: 'white', mb: 1 }} /> 
              <Typography color="white" variant="h4" fontWeight="bold"> 
                {securityAlerts.length} 
              </Typography> 
              <Typography color="white" variant="h6"> 
                Active Alerts 
              </Typography> 
            </CardContent> 
          </Card> 
        </Grid> 

        <Grid item xs={12} md={3}> 
          <Card elevation={4} sx={{ background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)' }}> 
            <CardContent sx={{ textAlign: 'center' }}> 
              <Videocam sx={{ fontSize: 40, color: 'white', mb: 1 }} /> 
              <Typography color="white" variant="h4" fontWeight="bold"> 
                98% 
              </Typography> 
              <Typography color="white" variant="h6"> 
                Uptime 
              </Typography> 
            </CardContent> 
          </Card> 
        </Grid> 
      </Grid> 

      {/* System Status */}
      <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}> 
        🟢 Security System Status: All Primary Systems Operational | 📧 FREE Multi-Platform Alert System: ACTIVE
      </Alert> 

      {/* Camera Grid */} 
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}> 
        📹 Live Camera Feeds 
      </Typography> 
       
      <Grid container spacing={3} sx={{ mb: 4 }}> 
        {cameras.map((camera, index) => ( 
          <Grid item xs={12} md={6} lg={4} key={camera.id}> 
            <CameraCard camera={camera} index={index} /> 
          </Grid> 
        ))} 
      </Grid> 

      {/* FREE Multi-Platform Alert Control Panel */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card elevation={6} sx={{ 
            background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
            border: '3px solid #ff4757'
          }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ 
                fontWeight: 'bold', 
                color: 'white',
                textAlign: 'center',
                mb: 3
              }}>
                📱 FREE Multi-Platform Alert System
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Button  
                    variant="contained"  
                    color="error"  
                    fullWidth
                    size="large"
                    sx={{ 
                      py: 2,
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                    onClick={sendFreeFireAlert}
                    disabled={loading}
                  >
                    {loading ? '📤 Sending...' : '🔥 FREE FIRE ALERT (Email+SMS+WhatsApp)'}
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Button  
                    variant="contained"  
                    color="warning"  
                    fullWidth
                    size="large"
                    sx={{ 
                      py: 2,
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                    onClick={sendFreeAccessAlert}
                    disabled={loading}
                  >
                    {loading ? '📤 Sending...' : '🚫 FREE ACCESS ALERT (Email+SMS+WhatsApp)'}
                  </Button>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Button  
                    variant="contained"  
                    color="info"  
                    fullWidth
                    size="large"
                    sx={{ 
                      py: 2,
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                    onClick={sendFreeMotionAlert}
                    disabled={loading}
                  >
                    {loading ? '📤 Sending...' : '🏃 FREE MOTION ALERT (Email+SMS+WhatsApp)'}
                  </Button>
                </Grid>
              </Grid>

              <Typography variant="body2" sx={{ 
                mt: 2, 
                textAlign: 'center',
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 'bold'
              }}>
                🆓 100% FREE: 📧 Email + 📱 SMS + 💚 WhatsApp Alerts to krishansavindu923@gmail.com
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Security Alerts & Controls */} 
      <Grid container spacing={3}> 
        <Grid item xs={12} md={6}> 
          <Card elevation={6}> 
            <CardContent> 
              <Typography variant="h6" gutterBottom fontWeight="bold"> 
                🚨 Recent Security Alerts 
              </Typography> 
               
              {securityAlerts.map((alert, index) => ( 
                <motion.div 
                  key={alert.id} 
                  initial={{ x: -20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }} 
                > 
                  <Paper  
                    elevation={2}  
                    sx={{  
                      p: 2,  
                      mb: 2,  
                      borderLeft: `4px solid ${ 
                        alert.severity === 'high' ? '#f44336' : 
                        alert.severity === 'normal' ? '#ff9800' : '#4caf50' 
                      }` 
                    }} 
                  > 
                    <Box display="flex" justifyContent="space-between" alignItems="center"> 
                      <Box> 
                        <Typography variant="subtitle1" fontWeight="bold"> 
                          {alert.type} Detection 
                        </Typography> 
                        <Typography variant="body2" color="textSecondary"> 
                          {alert.zone} • {alert.time} 
                        </Typography> 
                      </Box> 
                      <Chip  
                        label={alert.severity.toUpperCase()}  
                        color={ 
                          alert.severity === 'high' ? 'error' : 
                          alert.severity === 'normal' ? 'warning' : 'success' 
                        } 
                        size="small" 
                      /> 
                    </Box>
                  </Paper> 
                </motion.div> 
              ))} 
            </CardContent> 
          </Card> 
        </Grid> 

        <Grid item xs={12} md={6}> 
          <Card elevation={6}> 
            <CardContent> 
              <Typography variant="h6" gutterBottom fontWeight="bold"> 
                🎛️ Security Controls 
              </Typography> 
               
              <Box sx={{ mt: 2 }}> 
                <FormControlLabel 
                  control={ 
                    <Switch  
                      checked={systemSettings.motionDetection} 
                      onChange={(e) => setSystemSettings({...systemSettings, motionDetection: e.target.checked})} 
                    /> 
                  } 
                  label="Motion Detection" 
                /> 
              </Box> 
               
              <Box> 
                <FormControlLabel 
                  control={ 
                    <Switch
                      checked={systemSettings.audioRecording} 
                      onChange={(e) => setSystemSettings({...systemSettings, audioRecording: e.target.checked})} 
                    /> 
                  } 
                  label="Audio Recording" 
                /> 
              </Box> 
               
              <Box> 
                <FormControlLabel 
                  control={ 
                    <Switch  
                      checked={systemSettings.nightVision} 
                      onChange={(e) => setSystemSettings({...systemSettings, nightVision: e.target.checked})} 
                    /> 
                  } 
                  label="Night Vision" 
                /> 
              </Box> 
               
              <Box> 
                <FormControlLabel 
                  control={ 
                    <Switch  
                      checked={systemSettings.autoLock} 
                      onChange={(e) => setSystemSettings({...systemSettings, autoLock: e.target.checked})} 
                    /> 
                  } 
                  label="Auto-Lock Doors" 
                />
              </Box> 

              <Box sx={{ mt: 3 }}> 
                <Button  
                  variant="outlined"  
                  fullWidth
                >
                  📊 Generate Security Report
                </Button>
              </Box> 
            </CardContent> 
          </Card> 
        </Grid> 
      </Grid> 
    </Box> 
  ); 
}; 

export default SecurityMonitoring;
