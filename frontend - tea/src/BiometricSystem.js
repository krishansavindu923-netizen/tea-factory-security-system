import React, { useState, useRef, useEffect, useCallback } from 'react';

const BiometricSystem = () => {
  const [mode, setMode] = useState('authenticate');
  const [employeeId, setEmployeeId] = useState('');
  const [cardId, setCardId] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ✅ UPDATED: API Base URL changed to port 5001
  const API_BASE_URL = 'http://localhost:5001';

  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      console.log('📋 Loading employees...');
      const response = await fetch(`${API_BASE_URL}/api/employees`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
      console.log(`✅ Loaded ${data.length} employees`);
      
    } catch (error) {
      console.error('❌ Failed to load employees:', error);
      setMessage({ type: 'error', text: 'Failed to load employees. Check if backend is running on port 5001.' });
    }
  }, [API_BASE_URL]);

  // Load access logs
  const loadAccessLogs = useCallback(async () => {
    try {
      console.log('📊 Loading access logs...');
      const response = await fetch(`${API_BASE_URL}/api/access-logs`);
      
      if (response.ok) {
        const data = await response.json();
        setAccessLogs(Array.isArray(data) ? data : []);
        console.log(`✅ Loaded ${data.length} access logs`);
      }
    } catch (error) {
      console.error('❌ Failed to load access logs:', error);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    loadEmployees();
    loadAccessLogs();
  }, [loadEmployees, loadAccessLogs]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Start camera with better quality
  const startCamera = async () => {
    setCameraError('');
    setMessage(null);
    setCameraReady(false);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser. Please use Chrome, Firefox, or Edge.');
      }

      console.log('🎥 Starting high-quality camera...');
      
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded, waiting for focus...');
          
          setTimeout(() => {
            setCameraReady(true);
            setMessage({ 
              type: 'success', 
              text: '📹 Camera ready! Position your face clearly and capture when ready.' 
            });
            console.log('✅ Camera fully ready for high-quality capture');
          }, 3000);
        };

        videoRef.current.onerror = (e) => {
          console.error('❌ Video error:', e);
          setCameraError('Camera failed to load. Please refresh and try again.');
        };
      }
      
    } catch (error) {
      console.error('❌ Camera error:', error);
      
      let errorMessage = 'Camera access failed. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '❌ Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '❌ No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = '❌ Camera not supported. Please use HTTPS or a modern browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '❌ Camera is being used by another application. Please close other apps and try again.';
      } else {
        errorMessage += error.message || 'Unknown camera error.';
      }
      
      setCameraError(errorMessage);
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      console.log('🛑 Stopping camera...');
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 Stopped track: ${track.kind}`);
      });
      setStream(null);
      setCameraReady(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setMessage({ type: 'success', text: '⏹️ Camera stopped' });
    }
  }, [stream]);

  // Enhanced photo capture
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setMessage({ type: 'error', text: '❌ Camera not ready. Please start camera first.' });
      return;
    }

    if (!stream || !cameraReady) {
      setMessage({ type: 'error', text: '❌ Camera not ready. Please wait for camera to focus and try again.' });
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setMessage({ type: 'error', text: '❌ Video not ready. Please wait for camera to load completely.' });
        return;
      }

      console.log('📸 Capturing high-quality photo...', {
        width: video.videoWidth,
        height: video.videoHeight
      });
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      
      if (!imageData || imageData.length < 30000) {
        setMessage({ 
          type: 'error', 
          text: '❌ Poor image quality detected. Please ensure good lighting and try again.' 
        });
        return;
      }

      const faceTemplate = imageData;
      
      console.log('✅ High-quality photo captured:', {
        size: imageData.length,
        format: 'JPEG 95% quality'
      });
      
      if (mode === 'register') {
        registerBiometric(faceTemplate);
      } else {
        authenticateUser(faceTemplate);
      }
      
    } catch (error) {
      console.error('❌ Capture error:', error);
      setMessage({ type: 'error', text: '❌ Failed to capture photo. Please try again.' });
    }
  };

  // ✅ UPDATED: Register biometric with new API URL
  const registerBiometric = async (faceTemplate) => {
    if (!employeeId) {
      setMessage({ type: 'error', text: '❌ Please select an employee first.' });
      return;
    }

    if (!faceTemplate || faceTemplate.length < 30000) {
      setMessage({ 
        type: 'error', 
        text: '❌ Image quality too low. Please capture a clearer photo with good lighting.' 
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 Registering biometric with high-quality image...', {
        employeeId,
        imageSize: faceTemplate.length
      });
      
      const response = await fetch(`${API_BASE_URL}/api/biometric/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          employeeId: parseInt(employeeId),
          faceTemplate: faceTemplate,
          cardId: cardId?.trim() || null,
          imageQuality: 'high'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response:', response.status, errorText);
        
        let errorMessage;
        if (response.status === 400) {
          errorMessage = 'Invalid image data or employee information. Please try capturing again.';
        } else if (response.status === 409) {
          errorMessage = 'Employee already registered. Please select a different employee.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please check if backend is running properly on port 5001.';
        } else {
          errorMessage = `Registration failed (${response.status}). Please try again.`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Biometric registration successful');
        setMessage({ 
          type: 'success', 
          text: '✅ Biometric registered successfully! Face template saved with high quality.' 
        });
        
        setEmployeeId('');
        setCardId('');
        stopCamera();
        await loadEmployees();
        
      } else {
        throw new Error(result.error || 'Registration failed unexpectedly');
      }
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        errorMessage = '❌ Cannot connect to server. Please check if backend is running on port 5001.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Authenticate user with new API URL
  const authenticateUser = async (faceTemplate) => {
    setLoading(true);
    
    try {
      console.log('🔐 Authenticating user...');
      
      const response = await fetch(`${API_BASE_URL}/api/biometric/authenticate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          faceTemplate: faceTemplate,
          cardId: cardId?.trim() || null,
          location: 'Main Entrance'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Authentication request failed');
      }
      
      if (result.authenticated) {
        console.log('✅ Authentication successful:', result.employee?.name);
        setMessage({ 
          type: 'success', 
          text: `🎉 ACCESS GRANTED! Welcome ${result.employee?.name || 'User'} (${result.employee?.role || 'Employee'})` 
        });
        setCardId('');
        await loadAccessLogs();
      } else {
        console.log('❌ Authentication failed');
        setMessage({ type: 'error', text: '🚫 ACCESS DENIED - Authentication failed' });
      }
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      
      let errorMessage;
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        errorMessage = '❌ Cannot connect to server. Please check if backend is running on port 5001.';
      } else {
        errorMessage = `🚫 ${error.message || 'Authentication failed'}`;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Authenticate card with new API URL
  const authenticateCard = async () => {
    if (!cardId?.trim()) {
      setMessage({ type: 'error', text: 'Please enter Card ID' });
      return;
    }

    setLoading(true);
    
    try {
      console.log('💳 Authenticating card:', cardId);
      
      const response = await fetch(`${API_BASE_URL}/api/biometric/authenticate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          cardId: cardId.trim(),
          location: 'Card Reader - Main Gate'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Card authentication failed');
      }
      
      if (result.authenticated) {
        console.log('✅ Card authentication successful');
        setMessage({ 
          type: 'success', 
          text: `🎉 CARD ACCESS GRANTED! Welcome ${result.employee?.name || 'User'}` 
        });
        setCardId('');
        await loadAccessLogs();
      } else {
        console.log('❌ Card authentication failed');
        setMessage({ type: 'error', text: '🚫 CARD ACCESS DENIED - Invalid card' });
      }
      
    } catch (error) {
      console.error('❌ Card authentication error:', error);
      setMessage({ type: 'error', text: `❌ ${error.message || 'Card authentication failed'}` });
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Fire alert with new API URL
  const triggerFireAlert = async () => {
    try {
      console.log('🔥 Triggering fire alert...');
      
      const response = await fetch(`${API_BASE_URL}/api/fire-alert`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to trigger fire alert');
      }
      
      if (result.success) {
        console.log('✅ Fire alert triggered successfully');
        setMessage({ 
          type: 'success', 
          text: `🔥 FIRE ALERT TRIGGERED! Emergency response activated at ${new Date().toLocaleTimeString()}` 
        });
      } else {
        throw new Error(result.error || 'Fire alert failed');
      }
      
    } catch (error) {
      console.error('❌ Fire alert error:', error);
      setMessage({ type: 'error', text: `❌ ${error.message || 'Fire alert system error'}` });
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div style={{
      fontFamily: "'Segoe UI', Arial, sans-serif",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      minHeight: "100vh",
      padding: "20px"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "30px", color: "white" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "700", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
          🔐 Tea Factory Biometric System
        </h1>
        <p style={{ fontSize: "1.1rem", opacity: 0.9 }}>Face Recognition & ID Card Access Control - Port 5001</p>
      </div>

      <div style={{
        maxWidth: "1200px", 
        margin: "0 auto", 
        background: "#fff", 
        borderRadius: "20px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)", 
        overflow: "hidden"
      }}>
        
        {/* Mode Selector */}
        <div style={{
          background: "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)",
          padding: "25px", 
          color: "white"
        }}>
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px", justifyContent: "center" }}>
            <button
              onClick={() => {
                setMode('register');
                setMessage(null);
                setCameraError('');
              }}
              style={{
                padding: "12px 25px", 
                border: "2px solid rgba(255,255,255,0.3)", 
                borderRadius: "25px",
                background: mode === 'register' ? "rgba(255,255,255,0.2)" : "transparent",
                color: "white", 
                fontWeight: "600", 
                cursor: "pointer", 
                transition: "all 0.3s ease"
              }}
            >
              📝 Register Biometric
            </button>
            <button
              onClick={() => {
                setMode('authenticate');
                setMessage(null);
                setCameraError('');
              }}
              style={{
                padding: "12px 25px", 
                border: "2px solid rgba(255,255,255,0.3)", 
                borderRadius: "25px",
                background: mode === 'authenticate' ? "rgba(255,255,255,0.2)" : "transparent",
                color: "white", 
                fontWeight: "600", 
                cursor: "pointer", 
                transition: "all 0.3s ease"
              }}
            >
              🔓 Authenticate Access
            </button>
          </div>
        </div>

        <div style={{ padding: "30px" }}>
          
          {/* Message Display */}
          {message && (
            <div style={{
              marginBottom: "20px", 
              padding: "15px 25px", 
              borderRadius: "12px", 
              fontSize: "16px", 
              fontWeight: "500",
              color: message.type === "success" ? "#0f5132" : "#721c24",
              background: message.type === "success" 
                ? "linear-gradient(135deg, #d1eddd 0%, #c3e6cb 100%)" 
                : "linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%)",
              border: `2px solid ${message.type === "success" ? "#a3d9a5" : "#f1aeb5"}`,
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center"
            }}>
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                style={{
                  background: "none", 
                  border: "none", 
                  color: "inherit",
                  fontSize: "20px", 
                  cursor: "pointer", 
                  padding: "0 5px"
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Photo capture instructions */}
          {stream && (
            <div style={{
              marginBottom: "20px", 
              padding: "15px 25px", 
              borderRadius: "12px",
              background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
              border: "2px solid #2196f3", 
              color: "#0d47a1"
            }}>
              <h4 style={{ margin: "0 0 10px 0" }}>📸 Photo Capture Instructions</h4>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px" }}>
                <li><strong>Wait for "Camera Ready" message</strong> before capturing</li>
                <li>Ensure good lighting on your face</li>
                <li>Look directly at the camera</li>
                <li>Remove glasses and hats if possible</li>
                <li>Stay still during capture</li>
                <li>Keep face centered in the video frame</li>
              </ul>
            </div>
          )}

          {/* Camera Error Display */}
          {cameraError && (
            <div style={{
              marginBottom: "20px", 
              padding: "15px 25px", 
              borderRadius: "12px",
              background: "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
              border: "2px solid #ffc107", 
              color: "#856404"
            }}>
              <h4 style={{ margin: "0 0 10px 0" }}>📹 Camera Troubleshooting</h4>
              <p style={{ margin: "0 0 10px 0" }}>{cameraError}</p>
              <div style={{ fontSize: "14px" }}>
                <strong>Quick fixes:</strong>
                <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                  <li>Click camera icon 🎥 in browser address bar → Allow</li>
                  <li>Use HTTPS: https://localhost:3000</li>
                  <li>Close other apps using camera</li>
                  <li>Try Chrome, Firefox, or Edge browser</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setCameraError('');
                  startCamera();
                }}
                style={{
                  background: "#ffc107", 
                  color: "#856404", 
                  border: "none",
                  padding: "8px 15px", 
                  borderRadius: "5px", 
                  cursor: "pointer", 
                  marginTop: "10px"
                }}
              >
                🔄 Retry Camera
              </button>
            </div>
          )}

          {/* Main Content Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
            
            {/* Left Column - Face Recognition */}
            <div style={{
              background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
              borderRadius: "15px", 
              padding: "25px"
            }}>
              <h3 style={{ marginBottom: "20px", color: "#8b4513" }}>
                👤 Face Recognition System
              </h3>
              
              {mode === 'register' && (
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Select Employee:
                  </label>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    style={{
                      width: "100%", 
                      padding: "12px 16px", 
                      borderRadius: "10px",
                      border: "2px solid #e0e0e0", 
                      fontSize: "16px", 
                      outline: "none"
                    }}
                  >
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.id} - {emp.name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Camera Section with quality indicators */}
              <div style={{ textAlign: "center", marginBottom: "15px" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted
                    style={{ 
                      width: "100%", 
                      height: "280px", 
                      borderRadius: "15px",
                      background: "#000", 
                      objectFit: "cover",
                      border: cameraReady 
                        ? "4px solid #28a745" 
                        : stream 
                        ? "4px solid #ffc107" 
                        : "4px solid #dc3545"
                    }}
                  />
                  
                  {/* Camera status overlay */}
                  <div style={{
                    position: "absolute", 
                    top: "10px", 
                    left: "10px",
                    background: cameraReady 
                      ? "rgba(40, 167, 69, 0.9)" 
                      : stream 
                      ? "rgba(255, 193, 7, 0.9)" 
                      : "rgba(220, 53, 69, 0.9)",
                    color: "white", 
                    padding: "8px 12px", 
                    borderRadius: "20px",
                    fontSize: "14px", 
                    fontWeight: "700"
                  }}>
                    {cameraReady ? "🟢 Ready" : stream ? "🟡 Focusing..." : "🔴 Off"}
                  </div>

                  {/* Face guidance overlay */}
                  {stream && (
                    <div style={{
                      position: "absolute", 
                      top: "50%", 
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      border: "3px dashed rgba(255,255,255,0.8)",
                      borderRadius: "50%", 
                      width: "180px", 
                      height: "180px",
                      pointerEvents: "none"
                    }} />
                  )}
                </div>
                
                <canvas ref={canvasRef} style={{ display: "none" }} />
                
                {/* Camera status text */}
                <div style={{ 
                  marginTop: "15px", 
                  fontSize: "16px", 
                  fontWeight: "700",
                  color: cameraReady ? "#28a745" : stream ? "#ffc107" : "#666"
                }}>
                  {cameraReady 
                    ? "✅ Camera Ready - High Quality Capture Available!" 
                    : stream 
                    ? "⏳ Camera focusing... Please wait 3 seconds"
                    : "📷 Camera Off"
                  }
                </div>
              </div>

              {/* Control buttons */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button 
                  onClick={startCamera}
                  disabled={stream || loading}
                  style={{ 
                    flex: 1, 
                    padding: '14px', 
                    backgroundColor: (stream || loading) ? '#6c757d' : '#28a745',
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontWeight: '700',
                    cursor: (stream || loading) ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  📹 {stream ? 'Camera Active' : 'Start Camera'}
                </button>
                <button 
                  onClick={capturePhoto}
                  disabled={!cameraReady || loading}
                  style={{ 
                    flex: 1, 
                    padding: '14px', 
                    backgroundColor: (!cameraReady || loading) ? '#6c757d' : '#007bff',
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontWeight: '700',
                    cursor: (!cameraReady || loading) ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {loading ? '⏳ Processing...' : mode === 'register' ? '📷 Register Face' : '🔓 Authenticate'}
                </button>
                <button 
                  onClick={stopCamera}
                  disabled={!stream}
                  style={{ 
                    flex: 1, 
                    padding: '14px', 
                    backgroundColor: !stream ? '#6c757d' : '#dc3545',
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontWeight: '700',
                    cursor: !stream ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ⏹️ Stop Camera
                </button>
              </div>
            </div>

            {/* Right Column - ID Card & Emergency */}
            <div style={{
              background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
              borderRadius: "15px", 
              padding: "25px"
            }}>
              <h3 style={{ marginBottom: "20px", color: "#2c3e50" }}>
                🆔 ID Card & Emergency System
              </h3>
              
              {/* Card ID Section */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Card ID Number:
                </label>
                <input
                  type="text"
                  placeholder="Enter card ID (e.g., CARD001)"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  style={{
                    width: "100%", 
                    padding: "12px 16px", 
                    borderRadius: "10px",
                    border: "2px solid #e0e0e0", 
                    fontSize: "16px", 
                    outline: "none", 
                    marginBottom: "15px"
                  }}
                />
                <button
                  onClick={authenticateCard}
                  disabled={loading || !cardId?.trim()}
                  style={{
                    width: "100%", 
                    padding: "15px", 
                    fontSize: "16px", 
                    fontWeight: "600",
                    backgroundColor: (loading || !cardId?.trim()) ? '#6c757d' : '#ff6b35',
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px',
                    cursor: (loading || !cardId?.trim()) ? 'not-allowed' : 'pointer',
                    marginBottom: "20px"
                  }}
                >
                  {loading ? '⏳ Authenticating...' : '🔑 Authenticate Card'}
                </button>
              </div>

              {/* Fire Alert Section */}
              <div style={{ 
                borderTop: "2px solid rgba(255,255,255,0.3)", 
                paddingTop: "20px"
              }}>
                <h4 style={{ color: "#2c3e50", marginBottom: "15px" }}>🚨 Emergency Alert System</h4>
                <button
                  onClick={triggerFireAlert}
                  style={{
                    width: "100%", 
                    padding: "15px", 
                    fontSize: "16px", 
                    fontWeight: "600",
                    backgroundColor: '#e74c3c', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px',
                    cursor: 'pointer', 
                    marginBottom: "15px"
                  }}
                >
                  🔥 Trigger Fire Alert
                </button>
                <div style={{ 
                  padding: "15px", 
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.7)", 
                  fontSize: "14px", 
                  color: "#666"
                }}>
                  <strong>Emergency Procedures:</strong><br/>
                  1. Press fire alert for immediate response<br/>
                  2. System will notify security personnel<br/>
                  3. Follow evacuation protocols<br/>
                  4. Contact emergency services if needed
                </div>
              </div>
            </div>
          </div>

          {/* Access Logs */}
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "15px", 
            overflow: "hidden", 
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
          }}>
            <div style={{
              background: "rgba(255,255,255,0.1)", 
              color: "white", 
              padding: "20px",
              fontSize: "1.3rem", 
              fontWeight: "600", 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span>📊 Recent Access Activity</span>
              <button
                onClick={loadAccessLogs}
                style={{
                  background: "rgba(255,255,255,0.2)", 
                  color: "white", 
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "20px", 
                  padding: "8px 15px", 
                  cursor: "pointer", 
                  fontSize: "14px"
                }}
              >
                🔄 Refresh
              </button>
            </div>
            
            <div style={{ padding: "20px", maxHeight: "300px", overflowY: "auto" }}>
              {accessLogs.length === 0 ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)" }}>
                  No access logs found
                </p>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {accessLogs.slice(0, 10).map((log) => (
                    <div key={log.id || Math.random()} style={{
                      background: "rgba(255,255,255,0.1)", 
                      padding: "12px", 
                      borderRadius: "8px",
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      color: "white"
                    }}>
                      <div>
                        <strong>{log.employee_name || 'Unknown User'}</strong>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          📍 {log.location} • {log.access_method}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          padding: "4px 12px", 
                          borderRadius: "12px", 
                          fontSize: "12px", 
                          fontWeight: "600",
                          background: log.access_status === 'SUCCESS' ? "#28a745" : "#dc3545"
                        }}>
                          {log.access_status === 'SUCCESS' ? '✅ SUCCESS' : '❌ DENIED'}
                        </span>
                        <div style={{ 
                          fontSize: "12px", 
                          opacity: 0.7, 
                          marginTop: "4px" 
                        }}>
                          {new Date(log.access_time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Statistics Dashboard */}
          <div style={{
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px", 
            marginTop: "30px"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
              borderRadius: "15px", 
              padding: "20px", 
              color: "white", 
              textAlign: "center"
            }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem" }}>{employees.length}</h3>
              <p style={{ margin: 0, opacity: 0.9 }}>👥 Total Employees</p>
            </div>
            <div style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              borderRadius: "15px", 
              padding: "20px", 
              color: "white", 
              textAlign: "center"
            }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem" }}>
                {employees.filter(emp => emp.biometric_enrolled).length}
              </h3>
              <p style={{ margin: 0, opacity: 0.9 }}>🔐 Biometric Enrolled</p>
            </div>
            <div style={{
              background: "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
              borderRadius: "15px", 
              padding: "20px", 
              color: "white", 
              textAlign: "center"
            }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem" }}>{accessLogs.length}</h3>
              <p style={{ margin: 0, opacity: 0.9 }}>📊 Access Attempts</p>
            </div>
            <div style={{
              background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
              borderRadius: "15px", 
              padding: "20px", 
              color: "#2c3e50", 
              textAlign: "center"
            }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "2rem" }}>
                {accessLogs.filter(log => log.access_status === 'SUCCESS').length}
              </h3>
              <p style={{ margin: 0, opacity: 0.8 }}>✅ Successful Access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricSystem;
