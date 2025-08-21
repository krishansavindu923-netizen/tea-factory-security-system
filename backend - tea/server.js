const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
// --- Socket.io setup --- //
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, {
  cors: { origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'], credentials: true }
});
io.on('connection', (socket) => {
  console.log('🔔 Browser connected for fire alarm');
  socket.on('disconnect', () => console.log('🔕 Browser disconnected'));
});

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Sanju2001@', // Your MySQL password
  database: 'tea_factory_db'
});
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL database');
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Tea Factory Backend Server is running!',
    status: 'success',
    port: PORT
  });
});

app.get('/api/employees', (req, res) => {
  const query = 'SELECT * FROM employees ORDER BY id DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database error occurred' });
    }
    console.log(`📋 Retrieved ${results.length} employees`);
    res.json(results);
  });
});

app.post('/api/employees', (req, res) => {
  const { name, department, role, status } = req.body;
  if (!name || !department) {
    return res.status(400).json({ error: 'Name and department are required' });
  }
  const query = 'INSERT INTO employees (name, department, role, status) VALUES (?, ?, ?, ?)';
  db.query(query, [name, department, role || '', status || 'Active'], (err, results) => {
    if (err) {
      console.error('❌ Insert error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Employee with this name already exists' });
      }
      return res.status(500).json({ error: 'Failed to add employee' });
    }
    console.log('✅ Employee added:', results.insertId);
    res.status(201).json({ 
      success: true,
      message: 'Employee added successfully',
      insertedId: results.insertId
    });
  });
});

app.post('/api/biometric/register', (req, res) => {
  const { employeeId, faceTemplate, cardId } = req.body;
  if (!employeeId || !faceTemplate) {
    return res.status(400).json({ error: 'Employee ID and face template are required' });
  }
  const checkQuery = 'SELECT * FROM employees WHERE id = ?';
  db.query(checkQuery, [employeeId], (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const updateQuery = `
      UPDATE employees
      SET face_template = ?, card_id = ?, biometric_enrolled = 1, updated_at = NOW()
      WHERE id = ?
    `;
    db.query(updateQuery, [faceTemplate, cardId, employeeId], (err, updateResults) => {
      if (err) {
        console.error('❌ Biometric update error:', err);
        return res.status(500).json({ error: 'Failed to register biometric data' });
      }
      console.log('✅ Biometric data registered for employee:', employeeId);
      res.json({
        success: true,
        message: 'Biometric data registered successfully'
      });
    });
  });
});

app.get('/api/access-logs', (req, res) => {
  const query = `
    SELECT al.*, e.name as employee_name
    FROM access_logs al
    LEFT JOIN employees e ON al.employee_id = e.id
    ORDER BY al.access_time DESC
    LIMIT 50
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Access logs error:', err);
      return res.status(500).json({ error: 'Failed to load access logs' });
    }
    res.json(results);
  });
});

// 🔥 FIRE ALERT ENDPOINT (plays browser sound via socket.io)
app.post('/api/fire-alert', (req, res) => {
  console.log('🔥 Fire alert triggered at:', new Date().toISOString());
  // ==> This plays alarm on all browser/mobile apps now!
  io.emit('fire-alarm', { triggered: true, timestamp: new Date().toISOString() });
  res.json({
    success: true,
    message: 'Fire alert triggered successfully (alarm sound + notifications)',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ==== Start server (IMPORTANT: use http.listen) ====
http.listen(PORT, () => {
  console.log(`🚀 Tea Factory Backend Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});
module.exports = app;
