import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useSettings } from './SettingsContext';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationHistory {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
  details?: {
    action: string; // 'like', 'comment', 'recipe_add', 'recipe_edit', 'recipe_delete', 'profile_edit'
    recipeId?: string;
    recipeTitle?: string;
    commentText?: string;
    userId?: string;
    userName?: string;
    userStore?: string;
    additionalInfo?: any;
  };
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, details?: NotificationHistory['details']) => void;
  notificationHistory: NotificationHistory[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearHistory: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
  notificationHistory: [],
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearHistory: () => {},
  unreadCount: 0,
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const { settings } = useSettings();

  // 未読数を計算
  const unreadCount = notificationHistory.filter(n => !n.read).length;

  // 通知履歴をlocalStorageから読み込み
  React.useEffect(() => {
    const savedHistory = localStorage.getItem('recipeata-notifications');
    if (savedHistory) {
      setNotificationHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 通知履歴をlocalStorageに保存
  const saveHistory = (history: NotificationHistory[]) => {
    localStorage.setItem('recipeata-notifications', JSON.stringify(history));
  };

  const showNotification = (msg: string, t: NotificationType = 'info', details?: NotificationHistory['details']) => {
    if (!settings.notificationsEnabled) return;
    setMessage(msg);
    setType(t);
    setOpen(true);

    // 通知履歴に追加
    const newNotification: NotificationHistory = {
      id: Date.now().toString(),
      message: msg,
      type: t,
      timestamp: Date.now(),
      read: false,
      details,
    };

    setNotificationHistory(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // 最新50件まで保持
      saveHistory(updated);
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setNotificationHistory(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      saveHistory(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotificationHistory(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveHistory(updated);
      return updated;
    });
  };

  const clearHistory = () => {
    setNotificationHistory([]);
    localStorage.removeItem('recipeata-notifications');
  };

  const handleClose = (_: any, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      notificationHistory, 
      markAsRead, 
      markAllAsRead,
      clearHistory, 
      unreadCount 
    }}>
      {children}
      <Snackbar open={open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleClose} severity={type} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}; 