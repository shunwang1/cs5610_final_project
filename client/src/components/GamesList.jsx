import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Box,
  Divider
} from '@mui/material';

const GamesList = ({ 
  title, 
  games, 
  formatDate, 
  emptyMessage, 
  showJoinButton = false, 
  showWinner = false,
  currentUser = null,
  onJoinGame
}) => {
  const navigate = useNavigate();
  
  // Navigate to game page
  const handleGoToGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      {games.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
          {emptyMessage || 'No games available'}
        </Typography>
      ) : (
        <List>
          {games.map((game, index) => {
            // Check if user is the winner
            const isWinner = currentUser && 
              game.winner && 
              game.winner._id === currentUser._id;
              
            // Get opponent info
            const getOpponentName = () => {
              if (!currentUser) return null;
              
              if (game.player1._id === currentUser._id) {
                return game.player2?.username || 'Waiting for player';
              } else {
                return game.player1.username;
              }
            };
            
            return (
              <React.Fragment key={game._id}>
                {index > 0 && <Divider component="li" />}
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                        <Button
                          variant="text"
                          color="primary"
                          onClick={() => handleGoToGame(game._id)}
                        >
                          View Game
                        </Button>
                        
                        {showJoinButton && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => onJoinGame(game._id)}
                          >
                            Join
                          </Button>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ mt: 1, display: 'block' }}>
                        <Typography component="span" variant="body2" color="textPrimary" display="block">
                          Player 1: {game.player1.username}
                        </Typography>
                        
                        <Typography component="span" variant="body2" color="textPrimary" display="block">
                          Player 2: {game.player2 ? game.player2.username : 'Waiting to join'}
                        </Typography>
                        
                        {currentUser && getOpponentName() && (
                          <Typography component="span" variant="body2" color="textPrimary" display="block">
                            Opponent: {getOpponentName()}
                          </Typography>
                        )}
                        
                        <Typography component="span" variant="body2" color="text.secondary" display="block">
                          Start time: {formatDate(game.createdAt)}
                        </Typography>
                        
                        {game.endedAt && (
                          <Typography component="span" variant="body2" color="text.secondary" display="block">
                            End time: {formatDate(game.endedAt)}
                          </Typography>
                        )}
                        
                        {showWinner && game.winner && (
                          <Typography 
                            component="span" 
                            variant="body2" 
                            color={isWinner ? "success.main" : "textPrimary"}
                            fontWeight={isWinner ? "bold" : "normal"}
                            display="block"
                          >
                            Winner: {game.winner.username} {isWinner ? '(You)' : ''}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Paper>
  );
};

export default GamesList; 