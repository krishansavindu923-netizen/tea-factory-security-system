import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Grid, Card, CardContent, Typography, Box, Alert, LinearProgress, Chip, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { io } from "socket.io-client";

// === Fire alarm browser sound component ===
function FireAlarmSound() {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:5001"); // use backend port
    socket.on('fire-alarm', () => {
      setPlay(true);
      setTimeout(() => setPlay(false), 20000);
    });
    return () => socket.disconnect();
  }, []);

  return play ? <audio src="/sounds/fire-alarm.mp3" autoPlay loop /> : null;
}

// === Dashboard component ===
const Dashboard = () => {
  const [liveData, setLiveData] = useState({
    temperature: 24.5,
    humidity: 65,
    workers: 45,
    alerts: 0,
    systemStatus: 'OPERATIONAL'
  });

  const [activityLog, setActivityLog] = useState([
    { id: 1, time: '09:15', event: '✅ Employee Check-in: Kasun Silva', status: 'success' },
    { id: 2, time: '09:12', event: '📹 Camera Online: Zone A', status: 'info' },
    { id: 3, time: '09:10', event: '🚪 Access Granted: Main Entrance', status: 'success' },
    { id: 4, time: '09:08', event: '🔍 Motion Detected: Packaging Area', status: 'warning' },
    { id: 5, time: '09:05', event: '🛡️ Security Scan Complete', status: 'success' }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [chartError, setChartError] = useState(null);

  const securityData = useMemo(() => [
    { name: 'Security', value: 95, color: '#4CAF50' },
    { name: 'Fire Safety', value: 100, color: '#2196F3' },
    { name: 'Access Control', value: 88, color: '#FF9800' },
    { name: 'Surveillance', value: 92, color: '#9C27B0' }
  ], []);

  const temperatureData = useMemo(() => [
    { time: '09:00', temp: 24.2 },
    { time: '09:05', temp: 24.8 },
    { time: '09:10', temp: 25.1 },
    { time: '09:15', temp: parseFloat(liveData.temperature.toFixed(1)) },
  ], [liveData.temperature]);

  const generateRandomActivity = useCallback(() => {
    const activities = [
      'Temperature sensor calibrated',
      'Camera feed refreshed', 
      'Access log updated',
      'Security scan completed',
      'Motion sensor reset'
    ];
    return {
      id: Date.now(),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      event: '🔄 System Update: ' + activities[Math.floor(Math.random() * activities.length)],
      status: 'info'
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    const interval = setInterval(() => {
      try {
        setLiveData(prev => ({
          ...prev,
          temperature: Math.max(20, Math.min(30, 24 + Math.random() * 6)),
          humidity: Math.max(40, Math.min(80, 60 + Math.random() * 20)),
          workers: Math.max(35, Math.min(55, 40 + Math.floor(Math.random() * 15)))
        }));

        if (Math.random() > 0.8) {
          const newActivity = generateRandomActivity();
          setActivityLog(prev => [newActivity, ...prev.slice(0, 8)]);
        }
      } catch (error) {
        console.error('Error updating live data:', error);
        setChartError('Failed to update live data');
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimer);
    };
  }, [generateRandomActivity]);

  const StatusCard = React.memo(({ title, value, unit, color, icon }) => (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card 
        elevation={8} 
        sx={{ 
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 160
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" color="white" gutterBottom sx={{ fontWeight: 500 }}>
                {title}
              </Typography>
              <Typography variant="h3" color="white" sx={{ fontWeight: 'bold', mb: 1 }}>
                {typeof value === 'number' ? value.toString() : value}{unit}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={85} 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.3)', 
                  '& .MuiLinearProgress-bar': { bgcolor: 'rgba(255,255,255,0.8)' },
                  height: 6,
                  borderRadius: 3
                }} 
              />
            </Box>
            <Typography variant="h2" sx={{ opacity: 0.3, color: 'white', fontSize: '3rem' }}>
              {icon}
            </Typography>
          </Box>
        </CardContent>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 100,
          height: 100,
          bgcolor: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          zIndex: 1
        }} />
      </Card>
    </motion.div>
  ));

  const ChartSkeleton = () => (
    <Card elevation={6}>
      <CardContent>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Box sx={{ flexGrow: 1, p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Skeleton variant="text" width={400} height={60} sx={{ mb: 3 }} />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={160} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <ChartSkeleton />
          </Grid>
          <Grid item xs={12} md={4}>
            <ChartSkeleton />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* === Fire Alarm Audio === */}
      <FireAlarmSound />

      {/* Header */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Typography variant="h3" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
          🏭 Security Command Center
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
          Real-time monitoring and control system for Craig Tea Factory
        </Typography>
        
        {chartError ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            ⚠️ {chartError}
          </Alert>
        ) : (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 4, 
              fontSize: '1.1rem',
              '& .MuiAlert-icon': { fontSize: '1.5rem' }
            }}
          >
            🟢 All Systems Operational - Factory Secure & Running Smoothly
          </Alert>
        )}
      </motion.div>

      {/* Live Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard 
            title="🌡️ Temperature"
            value={liveData.temperature.toFixed(1)}
            unit="°C"
            color="#FF5722"
            icon="🌡️"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard 
            title="💧 Humidity"
            value={liveData.humidity.toFixed(0)}
            unit="%"
            color="#2196F3"
            icon="💧"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard 
            title="👥 Workers"
            value={liveData.workers}
            unit=" Active"
            color="#4CAF50"
            icon="👥"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard 
            title="🚨 Alerts"
            value={liveData.alerts}
            unit=" Active"
            color="#9C27B0"
            icon="🚨"
          />
        </Grid>
      </Grid>

      {/* Charts & Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={6} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                📊 Security System Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={securityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#666" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#2E7D32" 
                    radius={[4, 4, 0, 0]}
                    name="Performance %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card elevation={6}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                📈 Temperature Monitoring
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={temperatureData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                    domain={[20, 30]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => `Time: ${value}`}
                    formatter={(value) => [`${value}°C`, 'Temperature']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temp" 
                    stroke="#FF5722" 
                    strokeWidth={3} 
                    dot={{ fill: '#FF5722', r: 6 }}
                    activeDot={{ r: 8, fill: '#FF5722' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={6} sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                🔴 Live Activity Feed
              </Typography>
              <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
                {activityLog.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Box sx={{ 
                      mb: 2, 
                      p: 2, 
                      bgcolor: '#f8f9fa', 
                      borderRadius: 2, 
                      borderLeft: `4px solid ${
                        activity.status === 'success' ? '#4CAF50' : 
                        activity.status === 'warning' ? '#FF9800' : '#2196F3'
                      }`,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateX(5px)' }
                    }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                          {activity.time}
                        </Typography>
                        <Chip 
                          label={activity.status.toUpperCase()} 
                          size="small" 
                          color={
                            activity.status === 'success' ? 'success' : 
                            activity.status === 'warning' ? 'warning' : 'info'
                          }
                        />
                      </Box>
                      <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                        {activity.event}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
