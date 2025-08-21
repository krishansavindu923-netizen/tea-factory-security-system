// src/components/TrainingModule.js
import { Box, Typography, Divider, Paper, Stepper, Step, StepLabel, List, ListItem, Chip } from "@mui/material";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

// *** IMPORTANT ***
// Copy both images to: public/training/
//      public/training/employee_page.jpg
//      public/training/biometric_page.jpg

export default function TrainingModule() {
  return (
    <Box sx={{ maxWidth: 800, margin: "40px auto", px: 2, py: 2 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, background: "linear-gradient(135deg,#e3f2fd 70%,#e8eafc 100%)" }}>
        <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
          <span role="img" aria-label="leaf">🌱</span> Quick User Guide
        </Typography>
        <Typography align="center" sx={{ mb: 3, color: 'text.secondary' }}>
          Learn the basics of using the Tea Factory Security System with visual examples.
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {/* --- PHOTO #1: Employee Management Page --- */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <img
            src="/training/employee_page.jpg"
            alt="Employee Management page"
            style={{
              marginBottom: 10,
              borderRadius: 10,
              border: '2px solid #90caf9',
              boxShadow: '0 4px 16px #90caf988',
              maxWidth: "95%",
              maxHeight: 350,
              objectFit: "contain",
            }}
          />
          <Typography variant="body2" pb={2} color="#1976d2" fontWeight="500">
            <PersonAddIcon sx={{ verticalAlign: "-4px" }} /> Employee Management Page
          </Typography>
        </Box>

        <Stepper orientation="vertical" nonLinear sx={{ mb: 3 }}>
          <Step active>
            <StepLabel icon={<PersonAddIcon color="primary" />}>
              <Typography fontWeight="bold">1. Add Employee</Typography>
            </StepLabel>
            <Box pl={4} pb={2}>
              <List dense>
                <ListItem>Fill in employee name, department, position, and status (Active/Inactive).</ListItem>
                <ListItem>Click <Chip color="success" size="small" label="Add Employee" /> button.</ListItem>
                <ListItem>Use <Chip label="Edit" size="small" color="primary" /> / <Chip label="Delete" size="small" color="error" /> to manage entries.</ListItem>
                <ListItem>Use the search bar to find employees quickly by name/department/role.</ListItem>
              </List>
            </Box>
          </Step>
        </Stepper>

        {/* --- PHOTO #2: Biometric/Alert Page --- */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <img
            src="/training/biometric_page.jpg"
            alt="Biometric System page"
            style={{
              marginBottom: 10,
              borderRadius: 10,
              border: '2px solid #f48fb1',
              boxShadow: '0 4px 16px #f48fb188',
              maxWidth: "95%",
              maxHeight: 350,
              objectFit: "contain",
            }}
          />
          <Typography variant="body2" pb={2} color="#c2185b" fontWeight="500">
            <CameraAltIcon sx={{ verticalAlign: "-4px" }} /> Biometric & Emergency System Page
          </Typography>
        </Box>

        <Stepper orientation="vertical" nonLinear sx={{ mb: 3 }}>
          <Step active>
            <StepLabel icon={<CameraAltIcon color="secondary" />}>
              <Typography fontWeight="bold">2. Face/ID Authentication</Typography>
            </StepLabel>
            <Box pl={4} pb={2}>
              <List dense>
                <ListItem>Click <Chip size="small" label="Biometric System" /> from top bar.</ListItem>
                <ListItem>For face recognition: Start the camera, have the user look at screen, click <Chip size="small" label="Authenticate" color="primary" />.</ListItem>
                <ListItem>To use card: Enter/scanning the card ID and click <Chip size="small" label="Authenticate Card" color="default" icon={<CreditCardIcon />} />.</ListItem>
                <ListItem>System shows <Chip label="SUCCESS" color="success" size="small"/> or <Chip label="DENIED" color="error" size="small"/> for each attempt.</ListItem>
              </List>
            </Box>
          </Step>
          <Step active>
            <StepLabel icon={<WarningAmberIcon color="error" />}>
              <Typography fontWeight="bold">3. Emergency Alert</Typography>
            </StepLabel>
            <Box pl={4} pb={2}>
              <List dense>
                <ListItem>Click <Chip color="error" label="Trigger Fire Alert" icon={<WarningAmberIcon />} size="small"/> button for emergencies.</ListItem>
                <ListItem>Browser will play fire alarm and system will auto-send alerts.</ListItem>
                <ListItem>Follow the on-screen emergency procedure steps.</ListItem>
              </List>
            </Box>
          </Step>
          <Step active>
            <StepLabel icon={<FormatListBulletedIcon color="success" />}>
              <Typography fontWeight="bold">4. Monitor Activity</Typography>
            </StepLabel>
            <Box pl={4} pb={2}>
              <List dense>
                <ListItem>Check <Chip label="Recent Access Activity" size="small" /> logs (below camera) for all attempts.</ListItem>
                <ListItem>Refresh logs for latest data. See colored badges for success/denied status.</ListItem>
                <ListItem>Dashboard summary cards at the bottom show total employees, access, successes.</ListItem>
              </List>
            </Box>
          </Step>
        </Stepper>
        <Divider sx={{ mt: 2, mb: 2 }} />
        <Typography variant="body2" align="center" color="text.secondary">
          For any further assistance, please contact your system admin.<br />
          This guide visually matches the <b>Employee</b> and <b>Biometric System</b> pages for easy understanding.
        </Typography>
      </Paper>
    </Box>
  );
}
