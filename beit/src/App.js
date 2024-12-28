import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Alert as MuiAlert } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, ErrorOutline } from '@mui/icons-material';
import axios from 'axios';

const App = () => {
  const [metrics, setMetrics] = useState([]);
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Fetch data from Flask API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, servicesRes, alertsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/metrics'),
          axios.get('http://localhost:5000/api/services'),
          axios.get('http://localhost:5000/api/alerts')
        ]);
        setMetrics(metricsRes.data);
        setServices(servicesRes.data);
        setAlerts(alertsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval); // Cleanup interval
  }, []);

  return (
    <Container maxWidth="xl" sx={{ pt: 3 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        DevOps Dashboard
      </Typography>

      {/* Alerts Section */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Active Alerts
        </Typography>
        <Grid container spacing={2}>
          {alerts.length === 0 ? (
            <MuiAlert severity="info" sx={{ width: '100%' }}>
              No active alerts.
            </MuiAlert>
          ) : (
            alerts.map((alert) => (
              <Grid item xs={12} sm={6} md={4} key={alert.id}>
                <MuiAlert
                  severity={alert.severity === 'critical' ? 'error' : 'warning'}
                  icon={alert.severity === 'critical' ? <ErrorOutline /> : <CheckCircle />}
                >
                  <strong>{alert.title}</strong>
                  <p>{alert.description}</p>
                </MuiAlert>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* System Metrics Section */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          System Metrics (Last 24 Hours)
        </Typography>
        <Paper elevation={3} sx={{ p: 2 }}>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU Usage" />
              <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory Usage" />
              <Line type="monotone" dataKey="disk" stroke="#ff7300" name="Disk Usage" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* Services Section */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Container Services
        </Typography>
        <Grid container spacing={2}>
          {services.length === 0 ? (
            <MuiAlert severity="info" sx={{ width: '100%' }}>
              No containers found.
            </MuiAlert>
          ) : (
            services.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <Paper elevation={3} sx={{ p: 2, backgroundColor: service.status === 'healthy' ? '#c8e6c9' : '#ffebee' }}>
                  <Typography variant="h6">{service.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.description}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
                    Status: <span style={{ color: service.status === 'healthy' ? 'green' : 'red' }}>
                      {service.status}
                    </span>
                  </Typography>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default App;
