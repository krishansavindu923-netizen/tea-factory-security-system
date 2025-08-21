// src/components/FireAlarmSound.js (Ultra-Compact Dot Version)
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Box, Fade, Alert, Tooltip } from '@mui/material';
import { VolumeUp } from '@mui/icons-material';

export default function FireAlarmSound() {
  const [play, setPlay] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    console.log("🔥 FireAlarmSound component mounted");
    
    const socket = io("http://localhost:5001");
    
    socket.on('connect', () => {
      console.log("✅ Socket connected");
      setConnected(true);
    });
    
    socket.on('fire-alarm', (data) => {
      console.log("🔥 FIRE ALARM EVENT RECEIVED:", data);
      setPlay(true);
      setShowAlert(true);
      
      setTimeout(() => {
        setPlay(false);
        setShowAlert(false);
      }, 20000);
    });
    
    socket.on('disconnect', () => {
      console.log("❌ Socket disconnected");
      setConnected(false);
    });
    
    return () => socket.disconnect();
  }, []);

  return (
    <>
      {/* Ultra-Small Status Dot */}
      <Tooltip title={connected ? "System Connected" : "System Disconnected"} arrow>
        <Box sx={{
          position: 'fixed',
          top: 8,
          right: 8,
          zIndex: 1200,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: connected ? '#4CAF50' : '#f44336',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          animation: connected ? 'none' : 'blink 1s infinite',
          '@keyframes blink': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.5 },
            '100%': { opacity: 1 }
          }
        }} />
      </Tooltip>

      {/* Fire Alarm Alert */}
      <Fade in={showAlert}>
        <Alert 
          severity="error" 
          icon={<VolumeUp />}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1400,
            width: 400,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            animation: 'pulse 1s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.7 },
              '100%': { opacity: 1 }
            }
          }}
        >
          🚨 FIRE EMERGENCY! EVACUATE IMMEDIATELY! 🚨
        </Alert>
      </Fade>

      {/* Audio Element */}
      {play && (
        <audio 
          src="/sounds/fire-alarm.mp3" 
          autoPlay 
          loop 
          onError={(e) => console.error("Audio error:", e)}
          onPlay={() => console.log("🔊 Audio playing")}
        />
      )}
    </>
  );
}
