import React, { useState } from 'react';
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
  Pagination,
} from '@mui/material';
import { Close, Notifications, NotificationsActive, Launch } from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import { usePagination } from '../hooks/usePagination';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';

interface NotificationHistoryProps {
  open: boolean;
  onClose: () => void;
}

const NotificationHistory = ({ open, onClose }: NotificationHistoryProps) => {
  const { notificationHistory, markAsRead, markAllAsRead, clearHistory, unreadCount } = useNotification();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  // usePaginationでページネーション
  const {
    currentPage: notificationPage,
    totalPages: notificationTotalPages,
    paginatedData: paginatedNotifications,
    setCurrentPage: setNotificationPage
  } = usePagination(notificationHistory, settings.notificationsPerPage);

  const notificationsToShow = showAll ? notificationHistory : paginatedNotifications;

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

  const handleDetailOpen = (notification: any) => {
    setSelectedNotification(notification);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setSelectedNotification(null);
  };

  const handleGoToRecipe = (recipeId: string) => {
    handleDetailClose();
    navigate(`/recipe/${recipeId}`);
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'like': return 'いいね';
      case 'comment': return 'コメント';
      case 'recipe_add': return 'レシピ追加';
      case 'recipe_edit': return 'レシピ編集';
      case 'recipe_delete': return 'レシピ削除';
      case 'profile_edit': return 'プロフィール編集';
      default: return '不明';
    }
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={markAllAsRead}
                color="primary"
                disabled={notificationHistory.length === 0 || unreadCount === 0}
              >
                すべて既読
              </Button>
              <Button 
                variant={showAll ? 'contained' : 'outlined'}
                size="small" 
                onClick={() => setShowAll(v => !v)}
                color="secondary"
                disabled={notificationHistory.length === 0}
              >
                {showAll ? 'ページ送り表示' : 'すべて表示'}
              </Button>
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
              {notificationsToShow.map((notification, index) => (
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
                          <Button size="small" variant="text" onClick={e => { e.stopPropagation(); handleDetailOpen(notification); }}>
                            詳細
                          </Button>
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
            {notificationTotalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={notificationTotalPages}
                  page={notificationPage}
                  onChange={(_, page) => setNotificationPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>
      {/* 詳細ダイアログ */}
      <Dialog open={detailOpen} onClose={handleDetailClose} maxWidth="sm" fullWidth>
        <DialogTitle>通知の詳細</DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle1" gutterBottom>メッセージ</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedNotification.message}</Typography>
              
              <Typography variant="subtitle1" gutterBottom>種別</Typography>
              <Chip label={selectedNotification.type} color={getTypeColor(selectedNotification.type)} size="small" sx={{ mb: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>日時</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>{formatDate(selectedNotification.timestamp)}</Typography>
              
              {selectedNotification.details && (
                <>
                  <Typography variant="subtitle1" gutterBottom>アクション</Typography>
                  <Chip 
                    label={getActionLabel(selectedNotification.details.action)} 
                    color="primary" 
                    size="small" 
                    sx={{ mb: 2 }} 
                  />
                  
                  {selectedNotification.details.recipeTitle && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>レシピ</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {selectedNotification.details.recipeTitle}
                        </Typography>
                        {selectedNotification.details.recipeId && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Launch />}
                            onClick={() => handleGoToRecipe(selectedNotification.details.recipeId)}
                          >
                            レシピを見る
                          </Button>
                        )}
                      </Box>
                    </>
                  )}
                  
                  {selectedNotification.details.commentText && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>コメント内容</Typography>
                      <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                        {selectedNotification.details.commentText}
                      </Typography>
                    </>
                  )}
                  
                  {selectedNotification.details.userName && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>ユーザー</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        名前: {selectedNotification.details.userName}
                      </Typography>
                      {selectedNotification.details.userStore && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          店舗: {selectedNotification.details.userStore}
                        </Typography>
                      )}
                    </>
                  )}
                  
                  {selectedNotification.details.additionalInfo && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>追加情報</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {selectedNotification.details.additionalInfo.isLike !== undefined && 
                          (selectedNotification.details.additionalInfo.isLike ? 'いいねしました' : 'いいねを解除しました')
                        }
                      </Typography>
                    </>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2 }}>
          {selectedNotification?.details?.recipeId && (
            <Button
              variant="contained"
              startIcon={<Launch />}
              onClick={() => handleGoToRecipe(selectedNotification.details.recipeId)}
            >
              レシピを見る
            </Button>
          )}
          <Button onClick={handleDetailClose} variant="outlined">閉じる</Button>
        </Box>
      </Dialog>
    </Dialog>
  );
};

export default NotificationHistory; 