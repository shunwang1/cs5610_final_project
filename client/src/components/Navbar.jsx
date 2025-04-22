import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Close drawer if open
      if (drawerOpen) {
        setDrawerOpen(false);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    {
      text: 'Games',
      link: '/games',
      show: true
    },
    {
      text: 'High Scores',
      link: '/high-scores',
      show: true
    },
    {
      text: 'Login',
      link: '/login',
      show: !isLoggedIn
    },
    {
      text: 'Register',
      link: '/register',
      show: !isLoggedIn
    }
  ];

  const drawer = (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={handleDrawerToggle}
    >
      <Box
        sx={{ width: 250 }}
        role="presentation"
        onClick={handleDrawerToggle}
      >
        <List>
          {navItems.map((item, index) => (
            item.show && (
              <ListItem 
                button 
                component={RouterLink} 
                to={item.link} 
                key={index}
              >
                <ListItemText primary={item.text} />
              </ListItem>
            )
          ))}
          {isLoggedIn && (
            <ListItem button onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </ListItem>
          )}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          Battleship Game
        </Typography>

        {isLoggedIn && (
          <Typography sx={{ mr: 2 }}>
            Hello, {user?.username}
          </Typography>
        )}

        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            {drawer}
          </>
        ) : (
          <Box>
            {navItems.map((item, index) => (
              item.show && (
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to={item.link} 
                  key={index}
                  sx={{ mx: 0.5 }}
                >
                  {item.text}
                </Button>
              )
            ))}
            
            {isLoggedIn && (
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={{ mx: 0.5 }}
              >
                Logout
              </Button>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 