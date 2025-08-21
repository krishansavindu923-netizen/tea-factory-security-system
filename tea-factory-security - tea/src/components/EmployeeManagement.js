import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Grid,
  Avatar,
  Alert,
  Skeleton,
  CircularProgress,
  MenuItem,
  IconButton
} from '@mui/material';
import { 
  Add, 
  Person, 
  Search, 
  Edit, 
  Delete,
  Refresh,
  Close
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const EmployeeManagement = () => {
  // ✅ State Management - Fixed
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ FIXED: Form state with proper initialization
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    role: '',
    status: 'Active'
  });
  
  const [formErrors, setFormErrors] = useState({});

  // ✅ FIXED: Proper onChange handler that preserves cursor position
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Clear any existing error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, [formErrors]);

  // ✅ Fetch employees from backend
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5001/api/employees');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch employees (${response.status})`);
      }
      
      const data = await response.json();
      console.log('✅ Fetched employees:', data.length);
      setEmployees(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error('❌ Error fetching employees:', err);
      setError('Failed to load employees. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load employees on mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // ✅ Form validation
  const validateForm = useCallback((data) => {
    const errors = {};
    
    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!data.department || data.department.trim().length < 2) {
      errors.department = 'Department is required';
    }
    
    return errors;
  }, []);

  // ✅ FIXED: Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // ✅ Prevent page reload
    
    const errors = validateForm(formData);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const url = editingId 
        ? `http://localhost:5001/api/employees/${editingId}`
        : 'http://localhost:5001/api/employees';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save employee');
      }
      
      const result = await response.json();
      setSuccess(result.message || (editingId ? 'Employee updated!' : 'Employee added!'));
      
      // Refresh list and close dialog
      await fetchEmployees();
      handleCloseDialog();
      
    } catch (err) {
      console.error('❌ Error saving employee:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ FIXED: Handle dialog close with proper cleanup
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      department: '',
      role: '',
      status: 'Active'
    });
    setFormErrors({});
  }, []);

  // ✅ Handle edit
  const handleEdit = useCallback((employee) => {
    setFormData({
      name: employee.name || '',
      department: employee.department || '',
      role: employee.role || '',
      status: employee.status || 'Active'
    });
    setEditingId(employee.id);
    setFormErrors({});
    setDialogOpen(true);
  }, []);

  // ✅ Handle delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`http://localhost:5001/api/employees/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }
      
      setSuccess('Employee deleted successfully!');
      await fetchEmployees();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter employees
  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status color helper
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': case 'active': return 'success';
      case 'absent': case 'inactive': return 'error';
      case 'late': case 'on leave': return 'warning';
      default: return 'default';
    }
  };

  // Count calculations
  const presentCount = employees.filter(emp => 
    ['present', 'active'].includes(emp.status?.toLowerCase())
  ).length;
  
  const absentCount = employees.filter(emp => 
    ['absent', 'inactive'].includes(emp.status?.toLowerCase())
  ).length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
          👥 Employee Management System
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
          Monitor and manage factory workforce
        </Typography>
      </motion.div>

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card elevation={4} sx={{ background: 'linear-gradient(135deg, #4CAF50, #45a049)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="white" variant="h6" gutterBottom>
                      Present Today
                    </Typography>
                    <Typography color="white" variant="h3" fontWeight="bold">
                      {presentCount}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                    <Person fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card elevation={4} sx={{ background: 'linear-gradient(135deg, #f44336, #d32f2f)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="white" variant="h6" gutterBottom>
                      Absent Today
                    </Typography>
                    <Typography color="white" variant="h3" fontWeight="bold">
                      {absentCount}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                    <Person fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card elevation={4} sx={{ background: 'linear-gradient(135deg, #2196F3, #1976D2)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="white" variant="h6" gutterBottom>
                      Total Employees
                    </Typography>
                    <Typography color="white" variant="h3" fontWeight="bold">
                      {employees.length}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                    <Person fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search employees by name, department, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchEmployees}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card elevation={5}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Employee Directory ({filteredEmployees.length})
            </Typography>
            
            {loading ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Employee Name</strong></TableCell>
                      <TableCell><strong>Department</strong></TableCell>
                      <TableCell><strong>Role</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton width={150} /></TableCell>
                        <TableCell><Skeleton width={100} /></TableCell>
                        <TableCell><Skeleton width={100} /></TableCell>
                        <TableCell><Skeleton width={80} /></TableCell>
                        <TableCell><Skeleton width={120} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : filteredEmployees.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography variant="h6" color="textSecondary">
                  {searchTerm ? `No employees found matching "${searchTerm}"` : 'No employees found'}
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => setDialogOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Add First Employee
                </Button>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Employee Name</strong></TableCell>
                      <TableCell><strong>Department</strong></TableCell>
                      <TableCell><strong>Role</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployees.map((employee, index) => (
                      <motion.tr
                        key={employee.id}
                        component={TableRow}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        sx={{ 
                          '&:hover': { bgcolor: '#f8f9fa' },
                          '&:nth-of-type(odd)': { bgcolor: '#fafafa' }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, bgcolor: '#2E7D32' }}>
                              {employee.name?.charAt(0) || 'U'}
                            </Avatar>
                            {employee.name}
                          </Box>
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.role || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={employee.status || 'Unknown'} 
                            color={getStatusColor(employee.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(employee)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(employee.id, employee.name)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Employee FAB */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* ✅ FIXED: Add/Edit Employee Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmit // ✅ Handle form submission properly
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingId ? '✏️ Edit Employee' : '➕ Add New Employee'}
          <IconButton onClick={handleCloseDialog}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {/* ✅ FIXED: All inputs with proper name attributes and controlled values */}
          <TextField
            name="name"
            label="Full Name *"
            value={formData.name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            autoFocus
            required
            error={!!formErrors.name}
            helperText={formErrors.name}
          />
          
          <TextField
            name="department"
            label="Department *"
            value={formData.department}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            error={!!formErrors.department}
            helperText={formErrors.department}
          />
          
          <TextField
            name="role"
            label="Role/Position"
            value={formData.role}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          
          <TextField
            name="status"
            label="Status"
            value={formData.status}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            select
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
            <MenuItem value="Present">Present</MenuItem>
            <MenuItem value="Absent">Absent</MenuItem>
            <MenuItem value="On Leave">On Leave</MenuItem>
          </TextField>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {submitting ? 'Saving...' : editingId ? 'Update Employee' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeManagement;
