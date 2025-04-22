import React from 'react';
import { 
  Typography, 
  Box, 
  Chip, 
  Button,
  Grid
} from '@mui/material';

const GameInfo = ({ 
  game, 
  user, 
  onJoinGame, 
  onCopyLink, 
  joiningGame,
  isPlayerTurn,
  formatDateTime 
}) => {
  // Determine the style for game state label
  const getStateColor = (state) => {
    switch(state) {
      case 'open': return 'primary';
      case 'active': return 'success';
      case 'completed': return 'secondary';
      default: return 'default';
    }
  };

  // Determine if the player is a participant in the game
  const isParticipant = game && user && 
    (game.player1._id === user._id || 
     (game.player2 && game.player2._id === user._id));

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom textAlign="center">
        Battleship Game
      </Typography>
      
      {game && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1">Game Status:</Typography>
                <Chip 
                  label={
                    game.state === 'open' ? 'Waiting for players' : 
                    game.state === 'active' ? 'In progress' : 
                    game.state === 'completed' ? 'Completed' : 
                    'Unknown'
                  } 
                  color={getStateColor(game.state)} 
                  size="small" 
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1">Start Time:</Typography>
                <Typography variant="body2">
                  {formatDateTime(game.createdAt)}
                </Typography>
              </Box>
            </Grid>
            
            {game.endedAt && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle1">End Time:</Typography>
                  <Typography variant="body2">
                    {formatDateTime(game.endedAt)}
                  </Typography>
                </Box>
              </Grid>
            )}
  
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1">Player 1:</Typography>
                <Typography variant="body2" fontWeight={user && game.player1._id === user._id ? 'bold' : 'normal'}>
                  {game.player1.username}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1">Player 2:</Typography>
                <Typography variant="body2" fontWeight={user && game.player2 && game.player2._id === user._id ? 'bold' : 'normal'}>
                  {game.player2 ? game.player2.username : 'Waiting for player...'}
                </Typography>
              </Box>
            </Grid>
            
            {game.state === 'active' && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle1">Current Turn:</Typography>
                  <Chip 
                    label={game.currentTurn?.username || 'Loading...'} 
                    color={isPlayerTurn ? 'success' : 'default'} 
                    size="small" 
                  />
                </Box>
              </Grid>
            )}
            
            {game.state === 'completed' && game.winner && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle1">Winner:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    {game.winner.username}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={onCopyLink}
            >
              Copy Game Link
            </Button>
            
            {user && game.state === 'open' && !isParticipant && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={onJoinGame}
                disabled={joiningGame}
              >
                {joiningGame ? 'Joining...' : 'Join Game'}
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default GameInfo; 