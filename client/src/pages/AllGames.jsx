import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  useMediaQuery,
  useTheme,
  Stack
} from '@mui/material';
import api from '../services/api';

const AllGames = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [games, setGames] = useState({
    openGames: [],
    activeGames: [],
    completedGames: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/games');
        setGames(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to get game list');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const handleCreateGame = async () => {
    try {
      const response = await api.post('/api/games');
      navigate(`/game/${response.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create game');
    }
  };

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

  const renderGameList = (games, title) => {
    if (games.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {games.map((game) => (
            <div key={game._id}>
              <ListItem 
                sx={{ 
                  flexDirection: isMobile ? 'column' : 'row', 
                  alignItems: isMobile ? 'flex-start' : 'center',
                  py: 2 
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="bold">
                      {game.player1?.username} {game.player2 ? `vs ${game.player2?.username}` : '(Waiting for opponent)'}
                    </Typography>
                  }
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      <Typography variant="body2">
                        Game ID: {game._id.substring(0, 8)}...
                      </Typography>
                      <Typography variant="body2">
                        Started: {formatDate(game.startTime)}
                      </Typography>
                      {game.endTime && (
                        <Typography variant="body2">
                          Ended: {formatDate(game.endTime)}
                        </Typography>
                      )}
                      {game.winner && (
                        <Typography variant="body2" color="primary" fontWeight="medium">
                          Winner: {game.winner?.username}
                        </Typography>
                      )}
                    </Stack>
                  }
                  sx={{ mb: isMobile ? 1 : 0 }}
                />
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate(`/game/${game._id}`)}
                  fullWidth={isMobile}
                  sx={{ minWidth: isMobile ? '100%' : '120px' }}
                >
                  {game.state === 'open' ? 'Join Game' : 'View Game'}
                </Button>
              </ListItem>
              <Divider />
            </div>
          ))}
        </List>
      </Box>
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
      <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'stretch' : 'center'} mb={3}>
          <Typography variant="h5" component="h1" gutterBottom={isMobile}>
            All Games
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateGame}
            fullWidth={isMobile}
            sx={{ mt: isMobile ? 1 : 0 }}
          >
            Create New Game
          </Button>
        </Box>

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => window.location.reload()}
          >
            Refresh List
          </Button>
        </Box>

        {renderGameList(games.openGames, 'Open Games')}
        {renderGameList(games.activeGames, 'Active Games')}
        {renderGameList(games.completedGames, 'Completed Games')}

        {Object.values(games).every(arr => arr.length === 0) && (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No games available. Create a new game to get started!
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default AllGames; 