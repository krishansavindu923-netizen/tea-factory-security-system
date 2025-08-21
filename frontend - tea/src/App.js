import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { FaUsers, FaFingerprint, FaVideo } from "react-icons/fa";
import BiometricSystem from './BiometricSystem';

// iVCam Integrated Camera Component
const iVCamIntegratedStream = ({ cameraLocation, zone }) => {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get available video devices
  const getVideoDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      // Auto-detect iVCam device
      const ivcamDevice = videoDevices.find(device => 
        device.label.toLowerCase().includes('ivcam') || 
        device.label.toLowerCase().includes('e2esoft')
      );
      
      if (ivcamDevice) {
        setSelectedDevice(ivcamDevice.deviceId);
        console.log('✅ iVCam detected:', ivcamDevice.label);
      } else if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
        console.log('📹 Default camera selected:', videoDevices.label);
      }
    } catch (err) {
      console.error('Error getting devices:', err);
      setError('Failed to get camera devices');
    }
  }, []);

  useEffect(() => {
    getVideoDevices();
  }, [getVideoDevices]);

  // Start camera
  const startCamera = async (deviceId = selectedDevice) => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this browser');
      }

      console.log('Starting camera with device:', deviceId);
      
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setStream(mediaStream);
        setIsStreaming(true);
        console.log('✅ Camera started successfully');
      }
      
    } catch (err) {
      console.error('Camera error:', err);
      
      let errorMessage = 'Camera access failed. ';
      
      switch(err.name) {
        case 'NotAllowedError':
          errorMessage += 'Please allow camera permissions and refresh.';
          break;
        case 'NotFoundError':
          errorMessage += 'Camera device not found. Check if iVCam is running.';
          break;
        case 'NotReadableError':
          errorMessage += 'Camera is being used by another application.';
          break;
        default:
          errorMessage += err.message || 'Please try again.';
      }
      
      setError(errorMessage);
      setIsStreaming(false);
    }
  };

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, [stream]);

  // Handle device change
  const handleDeviceChange = (e) => {
    const newDeviceId = e.target.value;
    setSelectedDevice(newDeviceId);
    
    if (isStreaming) {
      stopCamera();
      setTimeout(() => startCamera(newDeviceId), 500);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
      border: "2px solid #e0e0e0",
      margin: "15px",
      width: "350px",
      transition: "transform 0.3s ease"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "12px 15px",
        color: "white"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
              📹 {cameraLocation}
            </h4>
            <small style={{ opacity: 0.9 }}>📍 {zone}</small>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: "bold"
          }}>
            <span style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: isStreaming ? "#27ae60" : "#e74c3c",
              display: "inline-block",
              animation: isStreaming ? "pulse 2s infinite" : "none"
            }}></span>
            <span>{isStreaming ? "🟢 LIVE" : "⚫ Offline"}</span>
          </div>
        </div>
        
        {/* Device Selection */}
        <select
          value={selectedDevice}
          onChange={handleDeviceChange}
          style={{
            width: "100%",
            padding: "6px 8px",
            fontSize: "12px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.3)",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            outline: "none"
          }}
        >
          <option value="" style={{ color: "#333" }}>Select Camera Device</option>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId} style={{ color: "#333" }}>
              {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
            </option>
          ))}
        </select>
      </div>

      {/* Video Container */}
      <div style={{
        position: "relative",
        background: "#000",
        height: "240px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {error ? (
          <div style={{
            textAlign: "center",
            color: "#e74c3c",
            padding: "20px",
            fontSize: "13px"
          }}>
            <div style={{ fontSize: "28px", marginBottom: "15px" }}>❌</div>
            <div style={{ marginBottom: "15px", lineHeight: "1.4" }}>{error}</div>
            <button
              onClick={() => startCamera()}
              style={{
                background: "#3498db",
                color: "white",
                border: "none",
                padding: "10px 15px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              🔄 Try Again
            </button>
          </div>
        ) : isStreaming ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
            <div style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "11px",
              lineHeight: "1.3"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px" }}>🔴 LIVE STREAM</div>
              <div style={{ color: "#f39c12" }}>📱➡️💻 iVCam Active</div>
              <div style={{ color: "#ecf0f1", fontSize: "10px" }}>
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
            <div style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(46, 204, 113, 0.9)",
              color: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "bold"
            }}>
              HD Quality
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", color: "white" }}>
            <div style={{ fontSize: "40px", marginBottom: "15px" }}>📱</div>
            <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "5px" }}>iVCam Ready</div>
            <div style={{ fontSize: "13px", color: "#bdc3c7", marginBottom: "8px" }}>Phone Camera → PC</div>
            <div style={{ fontSize: "11px", color: "#f39c12" }}>
              {devices.length > 0 ? `${devices.length} device(s) available` : 'Detecting cameras...'}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        background: "#f8f9fa",
        padding: "12px",
        display: "flex",
        justifyContent: "center",
        gap: "10px"
      }}>
        {isStreaming ? (
          <>
            <button
              onClick={stopCamera}
              style={{
                background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                boxShadow: "0 4px 12px rgba(231, 76, 60, 0.3)"
              }}
            >
              ⏹️ Stop Camera
            </button>
            <button
              onClick={getVideoDevices}
              style={{
                background: "linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              🔄 Refresh
            </button>
          </>
        ) : (
          <button
            onClick={() => startCamera()}
            disabled={!selectedDevice}
            style={{
              background: selectedDevice 
                ? "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)"
                : "#95a5a6",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: selectedDevice ? "pointer" : "not-allowed",
              fontSize: "12px",
              fontWeight: "600",
              boxShadow: selectedDevice ? "0 4px 12px rgba(39, 174, 96, 0.3)" : "none"
            }}
          >
            {selectedDevice ? "▶️ Start iVCam" : "📱 Select Device First"}
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        background: "#ecf0f1",
        padding: "8px 12px",
        fontSize: "10px",
        color: "#7f8c8d",
        textAlign: "center",
        borderTop: "1px solid #bdc3c7"
      }}>
        Last Activity: {isStreaming ? 'Live now' : '1 minute ago'}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  // Navigation state
  const [currentView, setCurrentView] = useState('dashboard');

  // Employee management states
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", department: "", role: "", status: "Active" });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch employees function
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/employees");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Fetch employees error:', error);
      
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        setMsg({ 
          type: "error", 
          text: "Cannot connect to server. Please check if the backend is running." 
        });
      } else {
        setMsg({ 
          type: "error", 
          text: error.message || "Failed to load employees. Please try again." 
        });
      }
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchEmployees();
    }
  }, [currentView, fetchEmployees]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  // Handle form change
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle form submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    setMsg(null);
    
    if (!form.name.trim()) {
      setMsg({ type: "error", text: "Employee name is required" });
      return;
    }
    
    if (!form.department.trim()) {
      setMsg({ type: "error", text: "Department is required" });
      return;
    }
    
    setLoading(true);
    
    try {
      const url = editingId 
        ? `http://localhost:5001/api/employees/${editingId}`
        : "http://localhost:5001/api/employees";
      
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success !== false) {
        setMsg({ 
          type: "success", 
          text: data.message || (editingId ? "Employee updated successfully!" : "Employee added successfully!")
        });
        setForm({ name: "", department: "", role: "", status: "Active" });
        setEditingId(null);
        fetchEmployees();
      } else {
        throw new Error(data.error || 'Operation failed');
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        setMsg({ 
          type: "error", 
          text: "Cannot connect to server. Please check if the backend is running." 
        });
      } else if (error.message.includes('already exists')) {
        setMsg({ 
          type: "error", 
          text: "Employee with this name already exists. Please use a different name." 
        });
      } else {
        setMsg({ 
          type: "error", 
          text: error.message || "An unexpected error occurred. Please try again." 
        });
      }
    } finally {
      setLoading(false);
    }
  }, [form, editingId, fetchEmployees]);

  // Handle edit
  const handleEdit = useCallback((employee) => {
    setForm({
      name: employee.name || "",
      department: employee.department || "",
      role: employee.role || "",
      status: employee.status || "Active"
    });
    setEditingId(employee.id);
    setMsg(null);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const response = await fetch(`http://localhost:5001/api/employees/${id}`, {
          method: "DELETE"
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (data.success !== false) {
          setMsg({ type: "success", text: data.message || "Employee deleted successfully!" });
          fetchEmployees();
        } else {
          throw new Error(data.error || 'Delete operation failed');
        }
        
      } catch (error) {
        console.error('Delete error:', error);
        setMsg({ 
          type: "error", 
          text: error.message || "Error deleting employee. Please try again." 
        });
      }
    }
  }, [fetchEmployees]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setForm({ name: "", department: "", role: "", status: "Active" });
    setEditingId(null);
    setMsg(null);
  }, []);

  // Filter employees
  const filteredEmployees = useMemo(() => 
    employees.filter(emp =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [employees, searchTerm]);

  // Navigation component
  const Navigation = useCallback(() => (
    <div style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px 0",
      marginBottom: "0",
      borderBottom: "3px solid rgba(255,255,255,0.1)"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        maxWidth: "1000px",
        margin: "0 auto"
      }}>
        <button
          onClick={() => setCurrentView('dashboard')}
          style={{
            padding: "15px 25px",
            borderRadius: "25px",
            border: currentView === 'dashboard' 
              ? "2px solid rgba(255,255,255,0.8)" 
              : "2px solid rgba(255,255,255,0.3)",
            background: currentView === 'dashboard' 
              ? "rgba(255,255,255,0.25)" 
              : "rgba(255,255,255,0.05)",
            color: "white",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "14px",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <FaUsers size={16} />
          Employee Management
        </button>
        <button
          onClick={() => setCurrentView('biometric')}
          style={{
            padding: "15px 25px",
            borderRadius: "25px",
            border: currentView === 'biometric' 
              ? "2px solid rgba(255,255,255,0.8)" 
              : "2px solid rgba(255,255,255,0.3)",
            background: currentView === 'biometric' 
              ? "rgba(255,255,255,0.25)" 
              : "rgba(255,255,255,0.05)",
            color: "white",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "14px",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <FaFingerprint size={16} />
          Biometric System
        </button>
        <button
          onClick={() => setCurrentView('cctv')}
          style={{
            padding: "15px 25px",
            borderRadius: "25px",
            border: currentView === 'cctv' 
              ? "2px solid rgba(255,255,255,0.8)" 
              : "2px solid rgba(255,255,255,0.3)",
            background: currentView === 'cctv' 
              ? "rgba(255,255,255,0.25)" 
              : "rgba(255,255,255,0.05)",
            color: "white",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "14px",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <FaVideo size={16} />
          CCTV System
        </button>
      </div>
    </div>
  ), [currentView]);

  // Employee Dashboard
  const EmployeeDashboard = useMemo(() => (
    <div style={{
      fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      minHeight: "100vh",
      padding: "0"
    }}>
      {/* Header */}
      <div style={{
        textAlign: "center",
        padding: "40px",
        color: "white"
      }}>
        <h1 style={{ 
          fontSize: "2.8rem", 
          fontWeight: "700", 
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          marginBottom: "10px"
        }}>
          🍃 Tea Factory Security System
        </h1>
        <p style={{ fontSize: "1.2rem", opacity: 0.9 }}>Employee Management Dashboard</p>
      </div>

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        background: "#fff",
        borderRadius: "20px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        
        {/* Search Bar */}
        <div style={{
          background: "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)",
          padding: "25px",
          color: "white"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "15px"
          }}>
            <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>🔍 Search Employees:</span>
            <input
              type="text"
              placeholder="Search by name, department, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 20px",
                fontSize: "16px",
                border: "none",
                borderRadius: "25px",
                outline: "none",
                boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)"
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
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
                Clear
              </button>
            )}
          </div>
          <small style={{ opacity: 0.8 }}>
            {filteredEmployees.length} of {employees.length} employees shown
          </small>
        </div>

        <div style={{ padding: "30px" }}>
          
          {/* Global Message */}
          {msg && (
            <div style={{
              marginBottom: "20px",
              padding: "15px 25px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "500",
              color: msg.type === "success" ? "#0f5132" : "#721c24",
              background: msg.type === "success" 
                ? "linear-gradient(135deg, #d1eddd 0%, #c3e6cb 100%)" 
                : "linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%)",
              border: `2px solid ${msg.type === "success" ? "#a3d9a5" : "#f1aeb5"}`,
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              {msg.type === "success" ? "✅" : "❌"} {msg.text}
            </div>
          )}

          {/* Add/Edit Employee Form */}
          <div style={{
            background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
            borderRadius: "15px",
            padding: "25px",
            marginBottom: "30px",
            border: "2px solid #f4a261"
          }}>
            <h2 style={{ 
              fontSize: "1.5rem", 
              marginBottom: "20px",
              color: "#8b4513",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              {editingId ? "✏️ Edit Employee" : "➕ Add New Employee"}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                gap: "15px", 
                marginBottom: "20px" 
              }}>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Employee Name *"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "2px solid #e0e0e0",
                    fontSize: "16px",
                    outline: "none"
                  }}
                  required
                />
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Department *"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "2px solid #e0e0e0",
                    fontSize: "16px",
                    outline: "none"
                  }}
                  required
                />
                <input
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="Role/Position"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "2px solid #e0e0e0",
                    fontSize: "16px",
                    outline: "none"
                  }}
                />
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "2px solid #e0e0e0",
                    fontSize: "16px",
                    outline: "none",
                    background: "white"
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading
                      ? "#6c757d"
                      : editingId 
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px 25px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                  }}
                >
                  {loading ? "⏳ Processing..." : editingId ? "🔄 Update Employee" : "➕ Add Employee"}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      background: "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "12px 25px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                    }}
                  >
                    ❌ Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Employee Table */}
          {loading ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px",
              fontSize: "18px",
              color: "#666"
            }}>
              <div style={{ marginBottom: "20px", fontSize: "3rem" }}>⏳</div>
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px",
              fontSize: "18px",
              color: "#888"
            }}>
              <div style={{ marginBottom: "20px", fontSize: "3rem" }}>
                {searchTerm ? "🔍" : "📋"}
              </div>
              {searchTerm ? `No employees found matching "${searchTerm}"` : "No employees found."}
            </div>
          ) : (
            <div style={{
              background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}>
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "20px",
                fontSize: "1.3rem",
                fontWeight: "600"
              }}>
                👥 Employee Directory ({filteredEmployees.length})
              </div>
              
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse"
                }}>
                  <thead>
                    <tr style={{ background: "rgba(102, 126, 234, 0.1)" }}>
                      <th style={{
                        padding: "15px 10px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#333",
                        borderBottom: "2px solid rgba(102, 126, 234, 0.2)"
                      }}>ID</th>
                      <th style={{
                        padding: "15px 10px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#333",
                        borderBottom: "2px solid rgba(102, 126, 234, 0.2)"
                      }}>👤 Name</th>
                      <th style={{
                        padding: "15px 10px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#333",
                        borderBottom: "2px solid rgba(102, 126, 234, 0.2)"
                      }}>🏢 Department</th>
                      <th style={{
                        padding: "15px 10px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#333",
                        borderBottom: "2px solid rgba(102, 126, 234, 0.2)"
                      }}>💼 Role</th>
                      <th style={{
                        padding: "15px 10px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#333",
                        borderBottom: "2px solid rgba(102, 126, 234, 0.2)"
                      }}>📊 Status</th>
                      <th style={{
                        padding: "15px 10px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#333",
                        borderBottom: "2px solid rgba(102, 126, 234, 0.2)"
                      }}>⚙️ Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp, index) => (
                      <tr key={emp.id}
                        style={{
                          background: index % 2 === 0 
                            ? "rgba(255,255,255,0.8)" 
                            : "rgba(102, 126, 234, 0.05)"
                        }}
                      >
                        <td style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid rgba(0,0,0,0.1)",
                          fontSize: "14px"
                        }}>{emp.id}</td>
                        <td style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid rgba(0,0,0,0.1)",
                          fontSize: "14px",
                          fontWeight: "600"
                        }}>{emp.name}</td>
                        <td style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid rgba(0,0,0,0.1)",
                          fontSize: "14px"
                        }}>{emp.department}</td>
                        <td style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid rgba(0,0,0,0.1)",
                          fontSize: "14px"
                        }}>{emp.role}</td>
                        <td style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid rgba(0,0,0,0.1)",
                          fontSize: "14px"
                        }}>
                          <span style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            color: "white",
                            background: emp.status === "Active" 
                              ? "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                              : emp.status === "On Leave"
                              ? "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
                              : "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)"
                          }}>
                            {emp.status}
                          </span>
                        </td>
                        <td style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid rgba(0,0,0,0.1)",
                          fontSize: "14px"
                        }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => handleEdit(emp)}
                              style={{
                                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "600"
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(emp.id, emp.name)}
                              style={{
                                background: "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "600"
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center",
        padding: "30px",
        color: "rgba(255,255,255,0.8)",
        fontSize: "14px"
      }}>
        <p>© 2025 Tea Factory Security System | Powered by React & iVCam</p>
      </div>
    </div>
  ), [form, editingId, msg, loading, filteredEmployees, handleSubmit, handleEdit, handleDelete, cancelEdit]);

  // CCTV System Component
  const CCTVSystem = () => (
    <div style={{
      fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <div style={{
        textAlign: "center",
        padding: "30px",
        color: "white"
      }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "700", 
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          marginBottom: "10px" 
        }}>
          🎥 Security Monitoring Center
        </h1>
        <p style={{ fontSize: "1.1rem", opacity: 0.9 }}>
          Real-time surveillance with iVCam integration
        </p>
      </div>

      {/* Status Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        maxWidth: "1000px",
        margin: "0 auto 30px auto"
      }}>
        <div style={{
          background: "#27ae60",
          color: "white",
          padding: "25px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 8px 25px rgba(39, 174, 96, 0.3)"
        }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "5px" }}>5</div>
          <div style={{ fontSize: "1.1rem" }}>Cameras Online</div>
        </div>
        <div style={{
          background: "#e74c3c",
          color: "white",
          padding: "25px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 8px 25px rgba(231, 76, 60, 0.3)"
        }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "5px" }}>1</div>
          <div style={{ fontSize: "1.1rem" }}>Cameras Offline</div>
        </div>
        <div style={{
          background: "#f39c12",
          color: "white",
          padding: "25px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 8px 25px rgba(243, 156, 18, 0.3)"
        }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "5px" }}>3</div>
          <div style={{ fontSize: "1.1rem" }}>Active Alerts</div>
        </div>
        <div style={{
          background: "#9b59b6",
          color: "white",
          padding: "25px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 8px 25px rgba(155, 89, 182, 0.3)"
        }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "5px" }}>98%</div>
          <div style={{ fontSize: "1.1rem" }}>System Uptime</div>
        </div>
      </div>

      {/* Camera Grid */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        background: "white",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ 
          marginBottom: "25px", 
          color: "#333", 
          fontSize: "1.8rem",
          textAlign: "center"
        }}>
          📹 Live Camera Feeds (iVCam Integration)
        </h2>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "20px",
          justifyItems: "center"
        }}>
          <iVCamIntegratedStream cameraLocation="Main Entrance" zone="Zone A" />
          <iVCamIntegratedStream cameraLocation="Production Floor" zone="Zone B" />
          <iVCamIntegratedStream cameraLocation="Packaging Area" zone="Zone C" />
          <iVCamIntegratedStream cameraLocation="Storage Room" zone="Zone D" />
          <iVCamIntegratedStream cameraLocation="Loading Bay" zone="Zone E" />
          <iVCamIntegratedStream cameraLocation="Quality Control" zone="Zone F" />
        </div>

        <div style={{
          marginTop: "30px",
          padding: "20px",
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          borderRadius: "15px",
          textAlign: "center",
          border: "2px solid #dee2e6"
        }}>
          <h3 style={{ 
            color: "#667eea", 
            marginBottom: "15px",
            fontSize: "1.3rem"
          }}>
            📋 iVCam Demo Instructions
          </h3>
          <p style={{ 
            color: "#666", 
            margin: 0, 
            lineHeight: "1.6",
            fontSize: "1rem"
          }}>
            🔹 Install iVCam app on your phone and PC<br/>
            🔹 Connect both devices via Wi-Fi or USB<br/>
            🔹 Select "iVCam" device from dropdown menus above<br/>
            🔹 Click "▶️ Start iVCam" to begin high-quality streaming<br/>
            🔹 Perfect for presentations and live demos! 📱➡️🖥️
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Navigation />
      {currentView === 'dashboard' && EmployeeDashboard}
      {currentView === 'biometric' && <BiometricSystem />}
      {currentView === 'cctv' && <CCTVSystem />}
    </div>
  );
}

export default App;
