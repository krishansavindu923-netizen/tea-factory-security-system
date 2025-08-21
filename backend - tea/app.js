const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

// Import email alert service
const { sendAlert } = require('./emailAlert');
// Import free alert services
const { sendAllFreeAlerts } = require('./combinedFreeAlerts');

const app = express();

// ========== SOCKET.IO SETUP (CRITICAL) ==========
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket connection logging
io.on('connection', (socket) => {
  console.log('🔔 Client connected to socket:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔕 Client disconnected from socket:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// ========== DATABASE CONNECTION ========== 
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'tea_factory_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL Database: teafactory');
});

// ========== DATABASE TABLE VERIFICATION/CREATION ========== 
const ensureTableStructure = () => {
  const createEmployeesTable = `
    CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      department VARCHAR(50) NOT NULL,
      role VARCHAR(50),
      status VARCHAR(20) DEFAULT 'Active',
      biometric_enrolled BOOLEAN DEFAULT FALSE,
      face_template LONGTEXT,
      fingerprint_template LONGTEXT,
      card_id VARCHAR(50),
      last_access DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const createAccessLogsTable = `
    CREATE TABLE IF NOT EXISTS access_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT,
      employee_name VARCHAR(100),
      location VARCHAR(100) DEFAULT 'Main Entrance',
      access_method ENUM('Face Recognition', 'Card', 'Manual', 'Fire Alert', 'Emergency') NOT NULL,
      access_status ENUM('SUCCESS', 'DENIED') NOT NULL,
      access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
    )
  `;

  db.query(createEmployeesTable, (err) => {
    if (err) {
      console.error('❌ Employees table creation failed:', err);
    } else {
      console.log('✅ Employees table verified');
    }
  });

  db.query(createAccessLogsTable, (err) => {
    if (err) {
      console.error('❌ Access logs table creation failed:', err);
    } else {
      console.log('✅ Access logs table verified');
    }
  });
};

// Call table structure verification
ensureTableStructure();

// ========== ROOT ENDPOINT ========== 
app.get('/', (req, res) => {
  res.json({
    message: `🏭 Tea Factory Security API Server running on port ${PORT}`,
    status: 'success',
    port: PORT,
    version: '2.0',
    features: [
      'Employee Management',
      'Biometric Authentication',
      'Multi-Platform Alerts',
      'Socket.IO Fire Alarm',
      'Access Logging'
    ],
    timestamp: new Date().toISOString()
  });
});

// ========== EMPLOYEE CRUD ENDPOINTS ========== 

// GET - Read all employees 
app.get('/api/employees', (req, res) => {
  console.log('📋 Fetching all employees...');
  
  db.query('SELECT * FROM employees ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error occurred',
        details: err.message
      });
    }
    
    console.log(`✅ Retrieved ${results.length} employees`);
    res.json(results);
  });
});

// GET - Read single employee by ID 
app.get('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid employee ID'
    });
  }
  
  console.log(`👤 Fetching employee ID: ${id}`);
  
  db.query('SELECT * FROM employees WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error occurred',
        details: err.message
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    console.log(`✅ Employee found: ${results[0].name}`);
    res.json(results);
  });
});

// POST - Create new employee 
app.post('/api/employees', (req, res) => {
  const { name, department, role, status } = req.body;
  
  console.log('➕ Adding new employee:', name);
  
  // Enhanced validation
  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Employee name is required',
      field: 'name'
    });
  }
  
  if (!department || department.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Department is required',
      field: 'department'
    });
  }

  // Check name length
  if (name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Employee name too long (max 100 characters)',
      field: 'name'
    });
  }
  
  const query = 'INSERT INTO employees (name, department, role, status) VALUES (?, ?, ?, ?)';
  
  db.query(
    query,
    [name.trim(), department.trim(), role || '', status || 'Active'],
    (err, results) => {
      if (err) {
        console.error('❌ Database insert error:', err);
        
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({
            success: false,
            error: 'Employee with this name already exists'
          });
        }
        
        return res.status(500).json({
          success: false,
          error: 'Failed to add employee. Database error occurred.',
          details: err.message
        });
      }
      
      console.log(`✅ Employee added: ${name.trim()} (ID: ${results.insertId})`);
      
      res.status(201).json({
        success: true,
        insertedId: results.insertId,
        message: 'Employee added successfully',
        employee: {
          id: results.insertId,
          name: name.trim(),
          department: department.trim(),
          role: role || '',
          status: status || 'Active'
        }
      });
    }
  );
});

// PUT - Update existing employee 
app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const { name, department, role, status } = req.body;
  
  console.log(`✏️ Updating employee ID: ${id}`);
  
  // Validate ID
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid employee ID'
    });
  }

  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Employee name is required'
    });
  }
  
  if (!department || department.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Department is required'
    });
  }

  // Check if employee exists first
  db.query('SELECT id FROM employees WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error occurred'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    const updateQuery = 'UPDATE employees SET name=?, department=?, role=?, status=?, updated_at=NOW() WHERE id=?';
    
    db.query(
      updateQuery,
      [name.trim(), department.trim(), role || '', status || 'Active', id],
      (err, updateResults) => {
        if (err) {
          console.error('❌ Database error:', err);
          return res.status(500).json({
            success: false,
            error: 'Failed to update employee',
            details: err.message
          });
        }
        
        console.log(`✅ Employee updated: ${name.trim()} (ID: ${id})`);
        
        res.json({
          success: true,
          updatedId: parseInt(id),
          message: 'Employee updated successfully'
        });
      }
    );
  });
});

// DELETE - Delete employee 
app.delete('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  
  console.log(`🗑️ Deleting employee ID: ${id}`);
  
  // Validate ID
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid employee ID'
    });
  }

  // Get employee info first
  db.query('SELECT id, name FROM employees WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error occurred'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    const employeeName = results[0].name;
    
    db.query('DELETE FROM employees WHERE id=?', [id], (err, deleteResults) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete employee',
          details: err.message
        });
      }
      
      console.log(`🗑️ Employee deleted: ${employeeName} (ID: ${id})`);
      
      res.json({
        success: true,
        deletedId: parseInt(id),
        deletedName: employeeName,
        message: `Employee '${employeeName}' deleted successfully`
      });
    });
  });
});

// ========== BIOMETRIC SYSTEM ENDPOINTS ========== 

// POST - Register biometric data 
app.post('/api/biometric/register', (req, res) => {
  const { employeeId, faceTemplate, fingerprintTemplate, cardId } = req.body;
  
  console.log('📸 Biometric registration request for employee:', employeeId);
  
  if (!employeeId || isNaN(employeeId)) {
    return res.status(400).json({
      success: false,
      error: 'Valid Employee ID is required'
    });
  }

  if (!faceTemplate && !fingerprintTemplate && !cardId) {
    return res.status(400).json({
      success: false,
      error: 'At least one biometric template or card ID is required'
    });
  }

  // Check if employee exists first
  const checkQuery = 'SELECT * FROM employees WHERE id = ?';
  
  db.query(checkQuery, [employeeId], (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error occurred'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    const updateQuery = `
      UPDATE employees 
      SET face_template=?, fingerprint_template=?, card_id=?, biometric_enrolled=TRUE, updated_at=NOW() 
      WHERE id=?
    `;
    
    db.query(
      updateQuery,
      [faceTemplate || null, fingerprintTemplate || null, cardId || null, employeeId],
      (err, updateResults) => {
        if (err) {
          console.error('❌ Database error:', err);
          return res.status(500).json({
            success: false,
            error: 'Biometric registration failed',
            details: err.message
          });
        }
        
        console.log(`🔐 Biometric registered for Employee ID: ${employeeId}`);
        
        // Log access registration
        const logQuery = `
          INSERT INTO access_logs (employee_id, employee_name, access_method, access_status, location) 
          VALUES (?, ?, 'Manual', 'SUCCESS', 'Biometric Registration')
        `;
        
        db.query(logQuery, [employeeId, results[0].name], (logErr) => {
          if (logErr) console.error('❌ Log error:', logErr);
        });
        
        res.json({
          success: true,
          message: 'Biometric data registered successfully',
          employeeId: parseInt(employeeId)
        });
      }
    );
  });
});

// POST - Authenticate access 
app.post('/api/biometric/authenticate', (req, res) => {
  const { faceTemplate, fingerprintTemplate, cardId, location } = req.body;
  
  console.log('🔐 Authentication request received');
  
  let query = 'SELECT * FROM employees WHERE biometric_enrolled=TRUE AND status="Active"';
  
  db.query(query, (err, employees) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Authentication failed',
        details: err.message
      });
    }
    
    let matchedEmployee = null;
    let accessMethod = 'UNKNOWN';
    
    // Face recognition matching
    if (faceTemplate) {
      for (let emp of employees) {
        if (emp.face_template && emp.face_template.length > 100 &&
            emp.face_template.substring(0, 100) === faceTemplate.substring(0, 100)) {
          matchedEmployee = emp;
          accessMethod = 'Face Recognition';
          break;
        }
      }
    }
    
    // Card ID matching
    if (!matchedEmployee && cardId) {
      matchedEmployee = employees.find(emp => emp.card_id === cardId);
      if (matchedEmployee) accessMethod = 'Card';
    }
    
    // Fingerprint matching (for future implementation)
    if (!matchedEmployee && fingerprintTemplate) {
      for (let emp of employees) {
        if (emp.fingerprint_template && emp.fingerprint_template.length > 50 &&
            emp.fingerprint_template.substring(0, 50) === fingerprintTemplate.substring(0, 50)) {
          matchedEmployee = emp;
          accessMethod = 'Fingerprint';
          break;
        }
      }
    }
    
    if (matchedEmployee) {
      // Update last access time
      db.query('UPDATE employees SET last_access=NOW() WHERE id=?', [matchedEmployee.id]);
      
      // Log successful access
      const logQuery = `
        INSERT INTO access_logs (employee_id, employee_name, access_method, access_status, location) 
        VALUES (?, ?, ?, 'SUCCESS', ?)
      `;
      
      db.query(logQuery, [matchedEmployee.id, matchedEmployee.name, accessMethod, location || 'Main Entrance'], (logErr) => {
        if (logErr) console.error('❌ Log error:', logErr);
      });
      
      console.log(`✅ ACCESS GRANTED: ${matchedEmployee.name} via ${accessMethod}`);
      
      res.json({
        success: true,
        authenticated: true,
        employee: {
          id: matchedEmployee.id,
          name: matchedEmployee.name,
          department: matchedEmployee.department,
          role: matchedEmployee.role
        },
        accessMethod: accessMethod,
        accessTime: new Date().toISOString(),
        message: `Welcome ${matchedEmployee.name}!`
      });
    } else {
      console.log(`❌ ACCESS DENIED via ${accessMethod}`);
      
      // Log failed access attempt
      const logQuery = `
        INSERT INTO access_logs (employee_id, employee_name, access_method, access_status, location) 
        VALUES (NULL, 'Unknown', ?, 'DENIED', ?)
      `;
      
      db.query(logQuery, [accessMethod, location || 'Main Entrance'], (logErr) => {
        if (logErr) console.error('❌ Log error:', logErr);
      });
      
      res.status(401).json({
        success: false,
        authenticated: false,
        message: 'Access denied - Authentication failed'
      });
    }
  });
});

// ========== ORIGINAL EMAIL ALERT ENDPOINTS ========== 

// Original fire alert with email only
app.post('/api/fire-alert', async (req, res) => {
  const alertTime = new Date().toISOString();
  console.log(`🔥 FIRE ALERT RECEIVED at ${alertTime}!`);
  
  try {
    // Log fire alert
    const logQuery = `
      INSERT INTO access_logs (employee_id, employee_name, access_method, access_status, location) 
      VALUES (NULL, 'System', 'Fire Alert', 'SUCCESS', 'Emergency System')
    `;
    
    db.query(logQuery, (logErr) => {
      if (logErr) console.error('❌ Log error:', logErr);
    });

    const emailSent = await sendAlert('FIRE EMERGENCY', 'Fire detected in production area! Immediate evacuation required!');
    
    // ⚡ SOCKET EMIT FOR BROWSER SOUND
    console.log('🔥 EMIT SIREN ON SOCKET!');
    io.emit('fire-alarm', { triggered: true, alertTime });
    
    res.json({
      success: true,
      alertTime: alertTime,
      message: 'Fire alert received and email notification sent',
      emailSent: emailSent,
      status: 'EMERGENCY_DETECTED'
    });
  } catch (error) {
    console.error('❌ Fire alert failed:', error);
    res.status(500).json({
      success: false,
      error: 'Alert system error',
      details: error.message
    });
  }
});

// Original access denied alert
app.post('/api/access-alert', async (req, res) => {
  const { employeeName, location } = req.body;
  
  console.log(`🚫 Access denied: ${employeeName} at ${location}`);
  
  try {
    const emailSent = await sendAlert(
      'ACCESS DENIED',
      `Unauthorized access attempt by ${employeeName || 'Unknown Person'} at ${location || 'Main Entrance'}`
    );
    
    res.json({
      success: true,
      message: 'Access denied alert sent',
      emailSent: emailSent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Access alert failed:', error);
    res.status(500).json({
      success: false,
      error: 'Alert system error'
    });
  }
});

// Original emergency alert
app.post('/api/emergency-alert', async (req, res) => {
  const { alertType, message, location } = req.body;
  
  console.log(`🚨 Emergency alert: ${alertType}`);
  
  try {
    const fullMessage = `${message} Location: ${location || 'Unknown'}`;
    const emailSent = await sendAlert(alertType, fullMessage);
    
    res.json({
      success: true,
      message: 'Emergency alert sent',
      emailSent: emailSent,
      alertType: alertType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Emergency alert failed:', error);
    res.status(500).json({
      success: false,
      error: 'Alert system error'
    });
  }
});

// ========== NEW FREE MULTI-PLATFORM ALERT ENDPOINTS ========== 

// Free multi-platform fire alert endpoint WITH SOCKET EMIT
app.post('/api/free-fire-alert', async (req, res) => {
  console.log('🔥 FREE FIRE ALERT TRIGGERED!');
  console.log('🚨 Sending FIRE EMERGENCY via all FREE platforms...');
  
  try {
    const alertResults = await sendAllFreeAlerts(
      'FIRE EMERGENCY',
      'Fire detected in production area! Immediate evacuation required!'
    );

    // ⚡ SOCKET EMIT FOR BROWSER SOUND
    console.log('🔥 EMIT SIREN ON SOCKET!');
    io.emit('fire-alarm', { triggered: true, alertTime: new Date().toISOString() });
    
    res.json({
      success: true,
      message: 'Free fire alert sent via multiple platforms',
      platforms: {
        email: alertResults.results.email.success,
        sms: alertResults.results.sms.success,
        whatsapp: alertResults.results.whatsapp.success
      },
      successCount: alertResults.successfulPlatforms,
      totalPlatforms: alertResults.totalPlatforms,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Free fire alert failed:', error);
    res.status(500).json({
      success: false,
      error: 'Multi-platform alert system error'
    });
  }
});

// Free access denied alert endpoint
app.post('/api/free-access-alert', async (req, res) => {
  const { employeeName, location } = req.body;
  
  try {
    const alertResults = await sendAllFreeAlerts(
      'ACCESS DENIED',
      `Unauthorized access attempt by ${employeeName || 'Unknown Person'} at ${location || 'Main Entrance'}`
    );
    
    res.json({
      success: true,
      message: 'Free access denied alert sent',
      platforms: {
        email: alertResults.results.email.success,
        sms: alertResults.results.sms.success,
        whatsapp: alertResults.results.whatsapp.success
      },
      successCount: alertResults.successfulPlatforms,
      totalPlatforms: alertResults.totalPlatforms
    });
  } catch (error) {
    console.error('❌ Free access alert failed:', error);
    res.status(500).json({
      success: false,
      error: 'Multi-platform alert system error'
    });
  }
});

// Free motion detection alert endpoint
app.post('/api/free-motion-alert', async (req, res) => {
  try {
    const alertResults = await sendAllFreeAlerts(
      'MOTION DETECTED',
      'Suspicious movement detected in restricted area - Production Floor'
    );
    
    res.json({
      success: true,
      message: 'Free motion alert sent',
      platforms: {
        email: alertResults.results.email.success,
        sms: alertResults.results.sms.success,
        whatsapp: alertResults.results.whatsapp.success
      },
      successCount: alertResults.successfulPlatforms,
      totalPlatforms: alertResults.totalPlatforms
    });
  } catch (error) {
    console.error('❌ Free motion alert failed:', error);
    res.status(500).json({
      success: false,
      error: 'Multi-platform alert system error'
    });
  }
});

// ========== ACCESS LOGS ENDPOINT ========== 

app.get('/api/access-logs', (req, res) => {
  console.log('📊 Fetching access logs...');
  
  const query = `
    SELECT 
      al.*,
      e.name as employee_name,
      e.department
    FROM access_logs al 
    LEFT JOIN employees e ON al.employee_id = e.id 
    ORDER BY al.access_time DESC 
    LIMIT 50
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch access logs'
      });
    }
    
    console.log(`✅ Retrieved ${results.length} access logs`);
    res.json(results);
  });
});

// ========== SYSTEM STATUS ENDPOINTS ========== 

app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  
  db.query('SELECT COUNT(*) as employeeCount FROM employees', (err, results) => {
    if (err) {
      return res.status(500).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: 'Database connection failed'
      });
    }
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      employeeCount: results[0].employeeCount,
      server: 'Tea Factory Security API v2.0 with FREE Multi-Platform Alerts + Socket.IO',
      port: PORT
    });
  });
});

// ========== ERROR HANDLING ========== 

app.use((err, req, res, next) => {
  console.error('❌ Error occurred:', err.stack);
  
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 400;
    message = 'Duplicate entry - Record already exists';
  }
  
  if (err.code === 'ER_NO_SUCH_TABLE') {
    statusCode = 500;
    message = 'Database table not found - Check database setup';
  }
  
  if (err.code === 'ECONNREFUSED') {
    statusCode = 500;
    message = 'Database connection failed';
  }
  
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 Handler 
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/employees',
      'GET /api/employees/:id',
      'POST /api/employees',
      'PUT /api/employees/:id',
      'DELETE /api/employees/:id',
      'POST /api/biometric/register',
      'POST /api/biometric/authenticate',
      'POST /api/fire-alert',
      'POST /api/access-alert',
      'POST /api/emergency-alert',
      'POST /api/free-fire-alert',
      'POST /api/free-access-alert',
      'POST /api/free-motion-alert',
      'GET /api/access-logs'
    ]
  });
});

// ========== SERVER STARTUP (CRITICAL: USE http.listen) ========== 

http.listen(PORT, () => {
  console.log(`🏭 Tea Factory Security API Server running on port ${PORT}`);
  console.log(`📧 Email Alert System: ENABLED`);
  console.log(`📱 FREE Multi-Platform Alert System: ENABLED`);
  console.log(`🔊 Socket.IO Fire Alarm System: ENABLED`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Employees API: http://localhost:${PORT}/api/employees`);
  console.log(`🔐 Biometric API: http://localhost:${PORT}/api/biometric/*`);
  console.log(`🔥 Alert APIs: http://localhost:${PORT}/api/*-alert`);
  console.log(`🆓 FREE Alert APIs: http://localhost:${PORT}/api/free-*-alert`);
  console.log('✅ All endpoints ready with Socket.IO real-time fire alarm system!');
});

// Graceful shutdown 
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Tea Factory Security API...');
  db.end(() => {
    console.log('🔌 Database connection closed.');
    process.exit(0);
  });
});

module.exports = app;
