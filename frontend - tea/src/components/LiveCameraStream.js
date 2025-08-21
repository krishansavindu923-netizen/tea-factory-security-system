import React, { useRef, useEffect, useState, useCallback } from 'react';
import './LiveCameraStream.css';

const LiveCameraStream = ({ cameraLocation = "Main Entrance", zone = "Zone A" }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [streamRef, setStreamRef] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          facingMode: 'environment', // Use back camera on mobile
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamRef(stream);
        setIsStreaming(true);
        setError(null);
        console.log('Camera started successfully');
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      let errorMessage = 'Camera access failed. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      setError(errorMessage);
      setIsStreaming(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef) {
      streamRef.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      setStreamRef(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setIsRecording(false);
    setError(null);
  }, [streamRef]);

  // Toggle recording (simulation)
  const toggleRecording = useCallback(() => {
    if (!isStreaming) return;
    
    setIsRecording(prev => !prev);
    console.log(isRecording ? 'Recording stopped' : 'Recording started');
  }, [isStreaming, isRecording]);

  // Take snapshot
  const takeSnapshot = useCallback(() => {
    if (!videoRef.current || !isStreaming) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-snapshot-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.9);
  }, [isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="live-camera-container">
      {/* Camera Header */}
      <div className="camera-header">
        <div className="camera-info">
          <h3>{cameraLocation}</h3>
          <span className="zone-label">📍 Location: {zone}</span>
        </div>
        <div className="camera-status">
          <div className={`status-indicator ${isStreaming ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isStreaming ? '🟢 Online' : '⚫ Offline'}
            </span>
          </div>
          {isRecording && (
            <div className="recording-indicator">
              <span className="rec-dot"></span>
              <span className="rec-text">REC</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div className="video-container">
        {error ? (
          <div className="error-display">
            <div className="error-icon">❌</div>
            <div className="error-text">{error}</div>
            <button onClick={startCamera} className="retry-btn">
              🔄 Try Again
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="live-video"
              autoPlay
              muted
              playsInline
              style={{ display: isStreaming ? 'block' : 'none' }}
            />
            
            {!isStreaming && (
              <div className="camera-placeholder">
                <div className="placeholder-content">
                  <div className="camera-icon">📹</div>
                  <div className="placeholder-text">LIVE FEED</div>
                  <div className="resolution-text">HD 1080p</div>
                  <div className="offline-text">Camera Offline</div>
                </div>
              </div>
            )}

            {/* Video Overlay */}
            {isStreaming && (
              <div className="video-overlay">
                <div className="overlay-info">
                  <div className="timestamp">{formatTime(currentTime)}</div>
                  <div className="location">📍 {cameraLocation} - {zone}</div>
                  {isRecording && (
                    <div className="recording-time">
                      🔴 REC {formatRecordingTime(recordingTime)}
                    </div>
                  )}
                </div>
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  <span>LIVE FEED</span>
                </div>
              </div>
            )}
          </>
        )}
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Last Activity */}
      <div className="camera-footer">
        <div className="last-activity">
          <span>Last Activity: {isStreaming ? 'Live now' : '1 hour ago'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="camera-controls">
        {isStreaming ? (
          <>
            <button onClick={stopCamera} className="control-btn stop-btn">
              ⏹️ Stop Camera
            </button>
            <button 
              onClick={toggleRecording} 
              className={`control-btn ${isRecording ? 'recording' : 'record-btn'}`}
            >
              {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
            </button>
            <button onClick={takeSnapshot} className="control-btn snapshot-btn">
              📸 Snapshot
            </button>
          </>
        ) : (
          <button onClick={startCamera} className="control-btn start-btn">
            ▶️ Start Camera
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveCameraStream;
