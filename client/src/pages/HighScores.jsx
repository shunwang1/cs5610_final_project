import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Card,
  CardContent
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const HighScores = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/scores');
        setScores(response.data.data);
      } catch (error) {
        console.error('Failed to get leaderboard:', error);
        setError('Failed to fetch leaderboard data, please try again later');
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  // Render using cards on mobile devices
  const renderMobileScores = () => {
    return scores.map((player, index) => (
      <Card 
        key={player._id} 
        sx={{ 
          mb: 2, 
          bgcolor: user && user._id === player._id ? 'primary.light' : 'background.paper',
          boxShadow: 2
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="span" color="text.primary">
              #{index + 1}
            </Typography>
            <Typography variant="h6" component="span" color="text.primary">
              {player.username}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body1">
              Wins: <strong>{player.wins || 0}</strong>
            </Typography>
            <Typography variant="body1">
              Losses: <strong>{player.losses || 0}</strong>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    ));
  };

  // Render using table on desktop devices
  const renderDesktopScores = () => {
    return (
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Username</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Wins</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Losses</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scores.map((player, index) => (
              <TableRow 
                key={player._id}
                sx={{ 
                  bgcolor: user && user._id === player._id ? 'primary.light' : 'inherit',
                  '&:nth-of-type(odd)': {
                    bgcolor: user && user._id === player._id 
                      ? 'primary.light' 
                      : 'action.hover',
                  },
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{ fontWeight: user && user._id === player._id ? 'bold' : 'normal' }}>
                  {player.username}
                </TableCell>
                <TableCell align="right">{player.wins || 0}</TableCell>
                <TableCell align="right">{player.losses || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
          Leaderboard
        </Typography>
        
        {scores.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography>
              No leaderboard data yet. Start playing to compete for rankings!
            </Typography>
          </Paper>
        ) : (
          isMobile ? renderMobileScores() : renderDesktopScores()
        )}
      </Box>
    </Container>
  );
};

export default HighScores; 