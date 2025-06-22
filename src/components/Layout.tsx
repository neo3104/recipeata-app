import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { Avatar, Menu, MenuItem, ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../theme';

import { useNotification } from '../contexts/NotificationContext';
import NotificationHistory from './NotificationHistory';
import SettingsDialog from './SettingsDialog';
import { useUser } from '../contexts/UserContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotification();
  const { user } = useUser();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isHomePage = location.pathname === '/';
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMyPage = () => {
    navigate('/mypage');
    handleClose();
  };

  const handleAddRecipe = () => {
    navigate('/add');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="fixed">
          <Toolbar>
            {!isHomePage && (
              <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                Recipeata
              </RouterLink>
            </Typography>
            <IconButton color="inherit" onClick={() => setNotificationOpen(true)}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton
              edge="end"
              color="inherit"
              aria-label="settings"
              onClick={() => setSettingsOpen(true)}
            >
              <SettingsIcon />
            </IconButton>
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                {user?.photoURL ? <Avatar src={user.photoURL} /> : <AccountCircle />}
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleMyPage}>マイページ</MenuItem>
                {/* <MenuItem>ログアウト</MenuItem> */}
              </Menu>
            </div>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', mt: '64px', p: 3 }}>
          {children}
        </Box>

        {isHomePage && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            onClick={handleAddRecipe}
          >
            <AddIcon />
          </Fab>
        )}

        <NotificationHistory 
          open={notificationOpen} 
          onClose={() => setNotificationOpen(false)} 
        />
        <SettingsDialog 
          open={settingsOpen} 
          onClose={() => setSettingsOpen(false)} 
        />
      </Box>
    </ThemeProvider>
  );
};

export default Layout; 