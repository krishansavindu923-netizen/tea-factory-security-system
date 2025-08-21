// src/components/TestAudio.js
import { useState } from "react";
import { Button, Box, Typography, Fade, CircularProgress } from '@mui/material';
import { VolumeUp, Check } from '@mui/icons-material';

export default function TestAudio() {
  const [audioWorks, setAudioWorks] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showButton, setShowButton] = useState(true);

  const testAudio = async () => {
    setTesting(true);
    try {
      console.log("🔊 Testing audio...");
      const audio = new Audio('/sounds/fire-alarm.mp3');
      await audio.play();
      setAudioWorks(true);
      console.log("✅ Audio test successful");
      
      // Stop after 3 seconds
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        setTesting(false);
        
        // Hide button after successful test
        setTimeout(() => {
          setShowButton(false);
        }, 2000);
      }, 3000);
      
    } catch (error) {
      console.error("❌ Audio test failed:", error);
      setAudioWorks(false);
      setTesting(false);
      alert("Audio blocked by browser or file not found!\n\nMake sure:\n1. File exists at /public/sounds/fire-alarm.mp3\n2. You clicked somewhere on page first");
    }
  };

  return (
    <Fade in={showButton}>
      <Box sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1300
      }}>
        <Button
          variant="contained"
          size="large"
          startIcon={testing ? <CircularProgress size={20} color="inherit" /> : audioWorks ? <Check /> : <VolumeUp />}
          onClick={testAudio}
          disabled={testing}
          sx={{
            backgroundColor: audioWorks ? '#4CAF50' : '#FF9800',
            color: 'white',
            fontWeight: 'bold',
            px: 3,
            py: 1.5,
            borderRadius: 3,
            boxShadow: 6,
            '&:hover': {
              backgroundColor: audioWorks ? '#45a049' : '#f57c00',
              transform: 'translateY(-2px)',
              boxShadow: 8
            },
            transition: 'all 0.3s ease'
          }}
        >
          {testing ? 'Testing...' : audioWorks ? 'Audio Works!' : 'Test Fire Alarm'}
        </Button>

        {audioWorks && !testing && (
          <Fade in={audioWorks}>
            <Typography 
              variant="caption" 
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 1,
                color: '#4CAF50',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              ✅ System Ready!
            </Typography>
          </Fade>
        )}
      </Box>
    </Fade>
  );
}
