import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import { Close, Notifications, NotificationsActive } from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';

interface NotificationHistoryProps {
  open: boolean;
  onClose: () => void;
}

const NotificationHistory = ({ open, onClose }: NotificationHistoryProps) => {
  const { notificationHistory, markAsRead, clearHistory, unreadCount } = useNotification();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications />
          <Typography variant="h6">通知履歴</Typography>
          {unreadCount > 0 && (
            <Chip 
              label={unreadCount} 
              color="error" 
              size="small" 
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {notificationHistory.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              通知はありません
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={clearHistory}
                color="error"
              >
                履歴をクリア
              </Button>
            </Box>
            <List>
              {notificationHistory.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem 
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      }
                    }}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {!notification.read && (
                            <NotificationsActive sx={{ fontSize: 16, color: 'primary.main' }} />
                          )}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: notification.read ? 'normal' : 'bold',
                              flex: 1
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Chip 
                            label={notification.type} 
                            color={getTypeColor(notification.type) as any}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.timestamp)}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < notificationHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationHistory; 