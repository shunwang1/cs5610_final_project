import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Grid,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import GamesList from '../components/GamesList';

const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const Games = () => {
  const navigate = useNavigate();
  const { user, initialized } = useAuth();
  const [games, setGames] = useState({
    open: [],
    myOpen: [],
    myActive: [],
    myCompleted: [],
    other: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Get theme and media query for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/games');
      
      // Process game data categorization
      const responseData = response.data;
      
      // Ensure response data format is correct
      if (!responseData || !responseData.data) {
        throw new Error('Invalid server response data');
      }
      
      const gamesData = responseData.data;
      const categorizedGames = {
        open: [],
        myOpen: [],
        myActive: [],
        myCompleted: [],
        other: [],
      };
      
      if (user) {
        // User is logged in, can categorize games
        // Process open games
        if (Array.isArray(gamesData.openGames)) {
          gamesData.openGames.forEach(game => {
            if (game.player1._id === user._id) {
              categorizedGames.myOpen.push(game);
            } else {
              categorizedGames.open.push(game);
            }
          });
        }
        
        // Process active games
        if (Array.isArray(gamesData.activeGames)) {
          gamesData.activeGames.forEach(game => {
            const isMyGame = game.player1._id === user._id || (game.player2 && game.player2._id === user._id);
            if (isMyGame) {
              categorizedGames.myActive.push(game);
            } else {
              categorizedGames.other.push(game);
            }
          });
        }
        
        // Process completed games
        if (Array.isArray(gamesData.completedGames)) {
          gamesData.completedGames.forEach(game => {
            const isMyGame = game.player1._id === user._id || (game.player2 && game.player2._id === user._id);
            if (isMyGame) {
              categorizedGames.myCompleted.push(game);
            } else {
              categorizedGames.other.push(game);
            }
          });
        }
      } else {
        // User not logged in, all games categorized as other
        categorizedGames.other = [
          ...(Array.isArray(gamesData.activeGames) ? gamesData.activeGames : []),
          ...(Array.isArray(gamesData.completedGames) ? gamesData.completedGames : [])
        ];
      }
      
      setGames(categorizedGames);
      setError('');
    } catch (err) {
      console.error('Failed to get game list:', err);
      setError('Failed to get game list, please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch games after authentication state is initialized
    if (initialized) {
      fetchGames();
    } else {
      console.log('Waiting for authentication state to initialize...');
    }
  }, [user, initialized]);

  const handleCreateGame = async () => {
    try {
      const response = await api.post('/api/games');
      const gameId = response.data.gameId;
      navigate(`/game/${gameId}`);
    } catch (err) {
      console.error('Failed to create game:', err);
      setError('Failed to create game, please try again later.');
    }
  };

  const handleJoinGame = async (gameId) => {
    try {
      await api.post(`/api/games/${gameId}/join`);
      navigate(`/game/${gameId}`);
    } catch (err) {
      console.error('Failed to join game:', err);
      setError('Failed to join game, please try again later.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner message="Loading game list..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
          Games List
        </Typography>
        
        <ErrorAlert message={error} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 3, gap: 2 }}>
          {user && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleCreateGame}
              fullWidth={isMobile}
              sx={{ mb: isMobile ? 1 : 0, boxSizing: 'border-box' }}
            >
              Create New Game
            </Button>
          )}
          <Button 
            variant="outlined" 
            onClick={fetchGames}
            fullWidth={isMobile}
            sx={{ boxSizing: 'border-box' }}
          >
            Refresh List
          </Button>
        </Box>
        
        {!user ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <GamesList 
                title="Active Games"
                games={games.other.filter(game => game.state === 'active')}
                formatDate={formatDate}
                emptyMessage="No active games currently"
                showJoinButton={false}
              />
            </Grid>
            <Grid item xs={12}>
              <GamesList 
                title="Completed Games"
                games={games.other.filter(game => game.state === 'completed')}
                formatDate={formatDate}
                emptyMessage="No completed games"
                showWinner={true}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <GamesList 
                title="Available Games"
                games={games.open}
                formatDate={formatDate}
                emptyMessage="No available games to join"
                showJoinButton={true}
                onJoinGame={handleJoinGame}
              />
            </Grid>
            <Grid item xs={12}>
              <GamesList 
                title="My Open Games"
                games={games.myOpen}
                formatDate={formatDate}
                emptyMessage="You don't have any open games"
                currentUser={user}
              />
            </Grid>
            <Grid item xs={12}>
              <GamesList 
                title="My Active Games"
                games={games.myActive}
                formatDate={formatDate}
                emptyMessage="You don't have any active games"
                currentUser={user}
              />
            </Grid>
            <Grid item xs={12}>
              <GamesList 
                title="My Completed Games"
                games={games.myCompleted}
                formatDate={formatDate}
                emptyMessage="You don't have any completed games"
                showWinner={true}
                currentUser={user}
              />
            </Grid>
            <Grid item xs={12}>
              <GamesList 
                title="Other Games"
                games={games.other}
                formatDate={formatDate}
                emptyMessage="No other games"
                showWinner={true}
              />
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Games; 