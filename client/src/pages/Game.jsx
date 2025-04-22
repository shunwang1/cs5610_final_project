import { useState, useEffect, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Box,
  Tooltip
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import sseService from '../services/sseService';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GameBoard from '../components/GameBoard';
import GameInfo from '../components/GameInfo';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import CustomSnackbar from '../components/CustomSnackbar';

// Create default empty board
const createEmptyBoard = () => {
  return Array(10).fill().map(() => 
    Array(10).fill().map(() => ({
      hasShip: false,
      isHit: false,
      isMiss: false,
      shipId: null
    }))
  );
};

const Game = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Initialize board data
  const [player1Board, setPlayer1Board] = useState(createEmptyBoard());
  const [player2Board, setPlayer2Board] = useState(createEmptyBoard());
  const sseInitialized = useRef(false);
  // Add click debounce control
  const [cellLoading, setCellLoading] = useState(false);
  const [loadingCell, setLoadingCell] = useState(null); // Store coordinates of the loading cell
  const isProcessingClick = useRef(false);
  const [joiningGame, setJoiningGame] = useState(false);
  
  // Add notification message state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' // 'success', 'info', 'warning', 'error'
  });

  // Determine if it's the player's turn
  const isPlayerTurn = game && user && game.state === 'active' && 
    game.currentTurn && game.currentTurn._id === user._id;

  // Close notification message
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Show notification message
  const showMessage = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Fetch game data
  const fetchGame = async () => {
    try {
      console.log('Fetching game data:', id);
      setLoading(true);
      
      const response = await api.get(`/api/games/${id}`);
      const newGameData = response.data;
      
      console.log('Retrieved game data:', newGameData);
      
      if (!newGameData) {
        setError('Failed to get game data, server returned empty data');
        setLoading(false);
        return;
      }

      // Update game object state first
      setGame(prevGame => {
        const gameBeforeUpdate = prevGame;
        if (gameBeforeUpdate && newGameData) {
          if (gameBeforeUpdate.state !== newGameData.state) {
            if (newGameData.state === 'active') showMessage('Game has started!', 'success');
            else if (newGameData.state === 'completed') showMessage('Game has ended!', 'info');
            else if (newGameData.state === 'closed') showMessage('Game has been closed', 'warning');
          }
          
          // Ensure newGameData.currentTurn exists before comparing
          if (newGameData.currentTurn && gameBeforeUpdate.currentTurn?._id !== newGameData.currentTurn._id) {
            if (user && newGameData.currentTurn._id === user._id) {
              showMessage('It\'s your turn!', 'info');
            } else if (newGameData.currentTurn.username) {
              showMessage(`It's ${newGameData.currentTurn.username}'s turn`, 'info');
            }
          }
          
          if ((!gameBeforeUpdate.player2 && newGameData.player2) || (gameBeforeUpdate.state === 'open' && newGameData.state === 'active')) {
            const joinedPlayerName = newGameData.player2?.username || 'Player 2';
            showMessage(`${joinedPlayerName} has joined the game!`, 'success');
          }
        }
        return newGameData; // Return complete game data
      });
      
      // Store board data returned by server (deep copy to be safe)
      if (newGameData.board1) {
        setPlayer1Board(JSON.parse(JSON.stringify(newGameData.board1)));
      } else {
        // If server didn't return board1 (e.g., when game just created), set to empty board
        setPlayer1Board({ ships: [], shots: [] });
      }
      
      if (newGameData.board2) {
        setPlayer2Board(JSON.parse(JSON.stringify(newGameData.board2)));
      } else {
        // If server didn't return board2 (e.g., when just created or waiting for player)
        setPlayer2Board({ ships: [], shots: [] });
      }
          
      setError('');
      setLoading(false);
    } catch (err) {
      console.error('Failed to get game info:', err);
      setError(err.response?.data?.message || 'Failed to get game information');
      setLoading(false);
    }
  };

  // Handle SSE event
  const handleGameEvent = (data) => {
    console.log('Received game update event:', data);
    fetchGame();
  };

  // Initialize game and SSE connection
  useEffect(() => {
    if (id) {
      // Initial game data load
      fetchGame();

      // Set up SSE connection and game subscription
      const setupSSE = async () => {
        try {
          if (!sseInitialized.current) {
            await sseService.initSSE();
            sseInitialized.current = true;
          }
          
          await sseService.subscribeToGame(id);
          sseService.addGameEventListener(id, handleGameEvent);
          console.log('Successfully set up SSE connection and game subscription');
        } catch (error) {
          console.error('SSE setup failed:', error);
          showMessage('Real-time update connection failed, game state may not update automatically', 'error');
        }
      };
      
      setupSSE();
    } else {
      setError('Game ID does not exist');
      setLoading(false);
    }
    
    // Cleanup function
    return () => {
      sseService.removeGameEventListener(id, handleGameEvent);
    };
  }, [id]);

  // Add function to copy link
  const handleCopyLink = () => {
    const gameUrl = window.location.href;
    
    // Try to use modern API to copy
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(gameUrl)
        .then(() => {
          showMessage('Game link copied to clipboard', 'success');
        })
        .catch((err) => {
          console.error('Copy failed:', err);
          showMessage('Cannot copy link, please copy manually', 'error');
        });
    } else {
      // Fallback method
      fallbackCopyToClipboard(gameUrl);
    }
  };

  // Fallback copy method for older browsers
  const fallbackCopyToClipboard = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make the textarea out of viewport
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        showMessage('Game link copied to clipboard', 'success');
      } else {
        showMessage('Failed to copy link, please copy manually', 'warning');
      }
    } catch (err) {
      console.error('Fallback clipboard copy failed:', err);
      showMessage('Cannot copy link automatically, please copy manually', 'error');
    }
  };

  // Handle cell click
  const handleCellClick = async (row, col) => {
    // Prevent multiple clicks
    if (isProcessingClick.current) return;
    
    try {
      isProcessingClick.current = true;
      setCellLoading(true);
      
      // Clearly record that the opponent's board was clicked
      const isPlayer1 = user && game.player1._id === user._id;
      
      // Save coordinates of clicked cell, ensure loading shows in correct location
      setLoadingCell({ 
        row, 
        col, 
        isOpponentBoard: true  // Mark this as a click on opponent's board
      });
      
      console.log(`Player ${isPlayer1 ? '1' : '2'} clicked opponent's board:`, row, col);
      
      // Send shot request - modify request endpoint and parameter format
      const response = await api.post(`/api/games/${id}/move`, { 
        x: row, 
        y: col 
      });
      
      console.log('Shot result:', response.data);
      
      // Get latest game state
      fetchGame();
      
      // Show result message
      if (response.data.hit) {
        showMessage('Hit!', 'success');
      } else {
        showMessage('Miss, opponent\'s turn', 'info');
      }
      
    } catch (err) {
      console.error('Shot request failed:', err);
      showMessage(err.response?.data?.message || 'Cannot complete operation, please try again later', 'error');
      
      // Reset UI state
      setCellLoading(false);
      setLoadingCell(null);
    } finally {
      // Short delay to reset click state, prevent rapid clicking
      setTimeout(() => {
        isProcessingClick.current = false;
        setCellLoading(false);
        setLoadingCell(null);
      }, 300);
    }
  };

  // Handle join game
  const handleJoinGame = async () => {
    if (!user) {
      showMessage('Please log in to join the game', 'warning');
      return;
    }
    
    try {
      setJoiningGame(true);
      
      // Send join game request
      const response = await api.post(`/api/games/${id}/join`);
      console.log('Join game result:', response.data);
      
      // Get latest game state
      fetchGame();
      
      showMessage('Successfully joined the game', 'success');
    } catch (err) {
      console.error('Failed to join game:', err);
      showMessage(err.response?.data?.message || 'Failed to join game, please try again later', 'error');
    } finally {
      setJoiningGame(false);
    }
  };

  // Handle refresh game
  const handleRefreshGame = () => {
    fetchGame();
  };

  // Format date time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Main render function
  if (loading && !game) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner message="Loading game..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Tooltip title="Return to game list">
            <Button
              component={RouterLink}
              to="/games"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 1 }}
            >
              Back to List
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRefreshGame}
            sx={{ ml: 'auto' }}
          >
            Refresh Game
          </Button>
        </Box>

        <ErrorAlert message={error} />

        <Paper sx={{ p: 3, mb: 3 }}>
          <GameInfo 
            game={game}
            user={user}
            onJoinGame={handleJoinGame}
            onCopyLink={handleCopyLink}
            joiningGame={joiningGame}
            isPlayerTurn={isPlayerTurn}
            formatDateTime={formatDateTime}
          />
          
          {game && (
            <Box sx={{ mt: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="h6" align="center" gutterBottom sx={{
                      minHeight: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {game.currentTurn && game.state === 'active' && game.player1._id === game.currentTurn._id && (
                        <Box component="span" sx={{
                          position: 'absolute',
                          left: { xs: 0, sm: '15%' },
                          transform: 'translateX(-100%)',
                          fontSize: '1.2rem',
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 0.6, transform: 'translateX(-100%) scale(0.9)' },
                            '50%': { opacity: 1, transform: 'translateX(-100%) scale(1.1)' },
                            '100%': { opacity: 0.6, transform: 'translateX(-100%) scale(0.9)' }
                          }
                        }}>
                          👉
                        </Box>
                      )}
                      {game.player1.username}'s Board
                      {user && game.player1._id === user._id && ' (You)'}
                    </Typography>
                    <GameBoard
                      boardData={player1Board}
                      isPlayerBoard={user && game.player1._id === user._id}
                      onCellClick={handleCellClick}
                      isPlayerTurn={isPlayerTurn}
                      user={user}
                      game={game}
                      cellLoading={cellLoading}
                      loadingCell={loadingCell}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="h6" align="center" gutterBottom sx={{
                      minHeight: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {game.currentTurn && game.state === 'active' && game.player2 && game.player2._id === game.currentTurn._id && (
                        <Box component="span" sx={{
                          position: 'absolute',
                          left: { xs: 0, sm: '15%' },
                          transform: 'translateX(-100%)',
                          fontSize: '1.2rem',
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 0.6, transform: 'translateX(-100%) scale(0.9)' },
                            '50%': { opacity: 1, transform: 'translateX(-100%) scale(1.1)' },
                            '100%': { opacity: 0.6, transform: 'translateX(-100%) scale(0.9)' }
                          }
                        }}>
                          👉
                        </Box>
                      )}
                      {game.player2 ? game.player2.username : 'Waiting for player to join'}'s Board
                      {user && game.player2 && game.player2._id === user._id && ' (You)'}
                    </Typography>
                    <GameBoard
                      boardData={player2Board}
                      isPlayerBoard={user && game.player2 && game.player2._id === user._id}
                      onCellClick={handleCellClick}
                      isPlayerTurn={isPlayerTurn}
                      user={user}
                      game={game}
                      cellLoading={cellLoading}
                      loadingCell={loadingCell}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
      
      <CustomSnackbar 
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Container>
  );
};

export default Game; 