import React, { useMemo } from 'react';
import { Box, Tooltip, useTheme, useMediaQuery } from '@mui/material';

const GameBoard = ({ 
  boardData, 
  isPlayerBoard, 
  onCellClick, 
  isPlayerTurn, 
  user, 
  game, 
  cellLoading, 
  loadingCell 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Calculate cell size based on screen dimensions
  const cellSize = isMobile ? 30 : isTablet ? 35 : 40;
  
  // Process board data from {ships, shots} format to 2D array needed for rendering
  const processedBoardData = useMemo(() => {
    // Create empty 10x10 board
    const emptyBoard = Array(10).fill().map(() => 
      Array(10).fill().map(() => ({
        hasShip: false,
        isHit: false,
        isMiss: false,
        shipId: null
      }))
    );
    
    // If old format (2D array), return directly
    if (Array.isArray(boardData) && boardData.length === 10 && Array.isArray(boardData[0])) {
      return boardData;
    }
    
    // If {ships, shots} format, fill the board
    if (boardData && typeof boardData === 'object') {
      const { ships = [], shots = [] } = boardData;
      
      // Process ship positions
      ships.forEach(ship => {
        if (ship.positions && Array.isArray(ship.positions)) {
          ship.positions.forEach(pos => {
            if (pos && typeof pos.row === 'number' && typeof pos.col === 'number' &&
                pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10) {
              emptyBoard[pos.row][pos.col].hasShip = true;
              emptyBoard[pos.row][pos.col].isHit = pos.hit === true;
              emptyBoard[pos.row][pos.col].shipId = ship.id || null;
            }
          });
        }
      });
      
      // Process shot positions, but ensure they display on the correct board
      // If it's player's own board, display opponent's shots
      // If it's opponent's board, display player's own shots
      if (game && user) {
        // Determine if current user is player1 or player2
        const isPlayer1 = game.player1 && user._id === game.player1._id;
        const isPlayer2 = game.player2 && user._id === game.player2._id;
        
        // Determine which board data to display
        if ((isPlayer1 && isPlayerBoard) || (isPlayer2 && isPlayerBoard)) {
          // On own board, display opponent's shots
          const opponentShots = isPlayer1 ? game.board2?.shots || [] : game.board1?.shots || [];
          
          opponentShots.forEach(shot => {
            if (shot && typeof shot.row === 'number' && typeof shot.col === 'number' &&
                shot.row >= 0 && shot.row < 10 && shot.col >= 0 && shot.col < 10) {
              // Only set isMiss flag for misses
              if (shot.hit === false) {
                emptyBoard[shot.row][shot.col].isMiss = true;
              }
            }
          });
        } else if ((isPlayer1 && !isPlayerBoard) || (isPlayer2 && !isPlayerBoard)) {
          // On opponent's board, display own shots
          const myShots = isPlayer1 ? game.board1?.shots || [] : game.board2?.shots || [];
          
          myShots.forEach(shot => {
            if (shot && typeof shot.row === 'number' && typeof shot.col === 'number' &&
                shot.row >= 0 && shot.row < 10 && shot.col >= 0 && shot.col < 10) {
              // Only set isMiss flag for misses
              if (shot.hit === false) {
                emptyBoard[shot.row][shot.col].isMiss = true;
              }
            }
          });
        }
      } else {
        // Legacy logic for compatibility
        shots.forEach(shot => {
          if (shot && typeof shot.row === 'number' && typeof shot.col === 'number' &&
              shot.row >= 0 && shot.row < 10 && shot.col >= 0 && shot.col < 10) {
            // Miss positions
            if (shot.hit === false) {
              emptyBoard[shot.row][shot.col].isMiss = true;
            }
          }
        });
      }
      
      return emptyBoard;
    }
    
    // Default return empty board
    return emptyBoard;
  }, [boardData, game, user, isPlayerBoard]);

  // Get cell color based on state
  const getCellColor = (cell, isPlayerBoard) => {
    if (cell.isHit) return '#ff6b6b'; // Hit cells show red
    if (cell.isMiss) return '#77acf1'; // Miss cells show blue
    
    // Show ships on player's own board or when game is completed
    if (isPlayerBoard || (game && game.state === 'completed')) {
      if (cell.hasShip) return '#7bc86c'; // Cells with ships show green
    }
    
    return '#f8f9fa'; // Default background
  };

  // Get cell content based on state
  const getCellContent = (cell, isPlayerBoard) => {
    if (cell.isHit) return '💥'; // Hit cells show explosion
    if (cell.isMiss) return '🌊'; // Miss cells show water
    
    // Only show ships on player's own board or when game is completed
    if ((isPlayerBoard || (game && game.state === 'completed')) && cell.hasShip) {
      return '🚢';
    }
    
    return '';
  };

  // Determine if cell is clickable
  const isCellClickable = (row, col) => {
    // Only logged in users can click
    if (!user) return false;
    
    // Only active games allow clicking
    if (!game || game.state !== 'active') return false;
    
    // Can only click opponent's board
    if (isPlayerBoard) return false;
    
    // Must be player's turn
    if (!isPlayerTurn) return false;
    
    // Get cell
    const cell = processedBoardData[row][col];
    
    // Already clicked cells can't be clicked again
    if (cell.isHit || cell.isMiss) return false;
    
    return true;
  };
  
  // Determine whether to show loading state
  const shouldShowLoading = (rowIndex, colIndex) => {
    if (!cellLoading || !loadingCell) return false;
    
    // Check if current board should display loading
    if (loadingCell.isOpponentBoard !== undefined) {
      // If player board but loading is on opponent board, don't show
      if (isPlayerBoard && loadingCell.isOpponentBoard) return false;
      
      // If opponent board but loading is on player board, don't show
      if (!isPlayerBoard && !loadingCell.isOpponentBoard) return false;
    }
    
    return loadingCell.row === rowIndex && loadingCell.col === colIndex;
  };

  // Render 10x10 board with simple square cells
  return (
    <Box sx={{ 
      width: 'fit-content', 
      mx: 'auto', 
      display: 'inline-block',
      border: isPlayerBoard ? '3px solid #2196f3' : '1px solid #ddd',
      borderRadius: '8px',
      p: 1,
      backgroundColor: '#f5f5f5',
      boxShadow: isPlayerBoard ? '0 0 10px rgba(33, 150, 243, 0.3)' : 'none',
      position: 'relative',
      '&::before': isPlayerBoard ? {
        content: '""',
        position: 'absolute',
        top: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#2196f3',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap'
      } : {}
    }}>
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(10, ${cellSize}px)`,
        gridTemplateRows: `repeat(10, ${cellSize}px)`,
        gap: '2px',
      }}>
        {processedBoardData.map((row, rowIndex) => 
          row.map((cell, colIndex) => {
            const isClickable = isCellClickable(rowIndex, colIndex);
            const isLoading = shouldShowLoading(rowIndex, colIndex);
            
            return (
              <Tooltip key={`cell-${rowIndex}-${colIndex}`} title={isClickable ? 'Click to attack' : ''} arrow>
                <Box
                  sx={{
                    backgroundColor: getCellColor(cell, isPlayerBoard),
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid #ddd',
                    cursor: isClickable ? 'pointer' : 'default',
                    opacity: isLoading ? 0.7 : 1,
                    fontSize: `${cellSize * 0.6}px`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      opacity: isClickable ? 0.8 : 1,
                      transform: isClickable ? 'scale(1.05)' : 'none',
                      boxShadow: isClickable ? '0 0 5px rgba(0,0,0,0.2)' : 'none'
                    }
                  }}
                  onClick={() => isClickable && onCellClick(rowIndex, colIndex)}
                >
                  {isLoading ? '...' : getCellContent(cell, isPlayerBoard)}
                </Box>
              </Tooltip>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default GameBoard; 