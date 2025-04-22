import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Stack
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 8, maxWidth: 1400, mx: 'auto' }}>
        {/* Title section */}
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{ fontWeight: 'bold', mb: 4 }}
        >
          Battleship Challenge
        </Typography>

        {/* Game introduction */}
        <Paper sx={{ p: { xs: 4, md: 6 }, mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            Game Introduction
          </Typography>
          <Typography variant="h6">
            Battleship Challenge is a classic naval strategy game. Players must place their ships in their own waters and guess the locations of their opponent's ships to sink them.
          </Typography>
          <Typography variant="h6">
            Game Features:
          </Typography>
          <Box component="ul" sx={{ fontSize: '1.25rem' }}>
            <li>Real-time Battles: Play with players from around the world</li>
            <li>Leaderboard System: Track player records and showcase the best players</li>
            <li>Easy to Learn: Simple rules with rich strategic gameplay</li>
          </Box>
        </Paper>

        {/* Quick access */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={4} 
          justifyContent="center"
        >
          <Card sx={{ width: { xs: '100%', md: '30%' }, p: 2, boxSizing: 'border-box' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                Start a New Game
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => user ? navigate('/games') : navigate('/login')}
                size="large"
                fullWidth
                sx={{ mt: 2, py: 1.5 }}
              >
                {user ? 'Create Game' : 'Login First'}
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ width: { xs: '100%', md: '30%' }, p: 2, boxSizing: 'border-box' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                View Leaderboard
              </Typography>
              <Button 
                variant="contained" 
                color="secondary"
                onClick={() => navigate('/high-scores')}
                size="large"
                fullWidth
                sx={{ mt: 2, py: 1.5 }}
              >
                View Rankings
              </Button>
            </CardContent>
          </Card>

          {!user && (
            <Card sx={{ width: { xs: '100%', md: '30%' }, p: 2 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  Join the Game
                </Typography>
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => navigate('/login')}
                  size="large"
                  fullWidth
                  sx={{ mt: 2, py: 1.5 }}
                >
                  Login/Register
                </Button>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>
    </Container>
  );
};

export default Home; 