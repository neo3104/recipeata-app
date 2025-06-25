import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircle from '@mui/icons-material/AccountCircle';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { Avatar, Menu, MenuItem, ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../theme';

import { useNotification } from '../contexts/NotificationContext';
import NotificationHistory from './NotificationHistory';
import SettingsDialog from './SettingsDialog';
import { useUser } from '../contexts/UserContext';
import { useUndoRedo } from '../contexts/UndoRedoContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotification();
  const { user } = useUser();
  const { canUndo, canRedo, undo, redo } = useUndoRedo();

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
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fff3e0', width: '100vw' }}>
        <Box sx={{ position: 'relative', width: '100vw' }}>
          <AppBar position="fixed" sx={{ background: 'linear-gradient(90deg, #FFE0B2 0%, #FFB74D 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'visible', position: 'fixed', marginBottom: '-1px', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, width: '100vw', left: 0, right: 0 }}>
            <Toolbar sx={{
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
              boxShadow: 'none',
              background: 'linear-gradient(90deg, #FFE0B2 0%, #FFB74D 100%)',
              minHeight: '56px',
              color: '#4E342E',
            }}>
              {!isHomePage && (
                <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 900, color: '#4E342E' }}>
                <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                  CookShare
                </RouterLink>
              </Typography>
              <IconButton color="inherit" onClick={() => setNotificationOpen(true)} sx={{ color: '#4E342E' }}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <IconButton color="inherit" onClick={undo} disabled={!canUndo} sx={{ color: canUndo ? '#4E342E' : 'grey.400' }}>
                <UndoIcon />
              </IconButton>
              <IconButton color="inherit" onClick={redo} disabled={!canRedo} sx={{ color: canRedo ? '#4E342E' : 'grey.400' }}>
                <RedoIcon />
              </IconButton>
              <IconButton
                edge="end"
                color="inherit"
                aria-label="settings"
                onClick={() => setSettingsOpen(true)}
                sx={{ color: '#4E342E' }}
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
                  sx={{ color: '#4E342E' }}
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
        </Box>
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'transparent', mt: '32px', p: 3 }}>
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
              width: 56,
              height: 56,
              minHeight: 56,
              minWidth: 56,
              boxShadow: 3,
            }}
            onClick={handleAddRecipe}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="18" y="8" width="4" height="24" rx="2" fill="#fff" />
              <rect x="8" y="18" width="24" height="4" rx="2" fill="#fff" />
            </svg>
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