import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Notifications from '@mui/icons-material/Notifications';
import Settings from '@mui/icons-material/Settings';
import Badge from '@mui/material/Badge';
import { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import NotificationHistory from './NotificationHistory';
import SettingsDialog from './SettingsDialog';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotification();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isHomePage = location.pathname === '/';

  const handleBack = () => {
    navigate(-1);
  };

  const handleNotificationClick = () => {
    setNotificationOpen(true);
  };

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" color="inherit">
        <Toolbar>
          {!isHomePage && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="back"
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
          )}
          <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
            レシピ管理アプリ
          </Typography>
          <IconButton
            size="large"
            color="inherit"
            aria-label="notifications"
            onClick={handleNotificationClick}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton
            size="large"
            color="inherit"
            aria-label="settings"
            onClick={handleSettingsClick}
            sx={{ mr: 1 }}
          >
            <Settings />
          </IconButton>
          <IconButton
            size="large"
            color="inherit"
            aria-label="mypage"
            component={RouterLink}
            to="/mypage"
          >
            <AccountCircle />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        <Toolbar />
        <Outlet />
      </Box>
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        component={RouterLink}
        to="/add"
      >
        <AddIcon />
      </Fab>
      <NotificationHistory 
        open={notificationOpen} 
        onClose={() => setNotificationOpen(false)} 
      />
      <SettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </Box>
  );
}

export default Layout; 