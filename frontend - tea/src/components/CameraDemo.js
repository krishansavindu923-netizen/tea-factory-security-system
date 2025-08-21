import React from 'react';
import LiveCameraStream from './LiveCameraStream';
import './CameraDemo.css';

const CameraDemo = () => {
  return (
    <div className="camera-demo-container">
      <div className="demo-header">
        <h1>🎥 Tea Factory Security System</h1>
        <h2>Live CCTV Monitoring Demo</h2>
        <p>Real-time camera streaming demonstration</p>
      </div>
      
      <div className="demo-content">
        <div className="camera-grid">
          <LiveCameraStream 
            cameraLocation="Main Entrance" 
            zone="Zone A" 
          />
        </div>
        
        <div className="demo-instructions">
          <h3>📋 Demo Instructions:</h3>
          <ol>
            <li>Click <strong>"▶️ Start Camera"</strong> to begin live streaming</li>
            <li>Allow camera permissions when prompted</li>
            <li>Use <strong>"🔴 Start Recording"</strong> to simulate recording</li>
            <li>Take snapshots with <strong>"📸 Snapshot"</strong> button</li>
            <li>Stop the stream with <strong>"⏹️ Stop Camera"</strong></li>
          </ol>
          
          <div className="demo-features">
            <h4>✨ Key Features:</h4>
            <ul>
              <li>Real-time HD video streaming</li>
              <li>Live timestamp overlay</li>
              <li>Recording simulation</li>
              <li>Snapshot capture & download</li>
              <li>Mobile responsive design</li>
              <li>Professional CCTV interface</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraDemo;
