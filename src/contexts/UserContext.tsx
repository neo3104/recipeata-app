import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export interface NotificationSettings {
  recipeAdded: boolean;
  recipeEdited: boolean;
  recipeLiked: boolean;
  recipeCommented: boolean;
}

export interface User {
  name: string;
  store: string;
  notificationSettings: NotificationSettings;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

const defaultNotificationSettings: NotificationSettings = {
  recipeAdded: true,
  recipeEdited: true,
  recipeLiked: true,
  recipeCommented: true,
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  updateNotificationSettings: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('recipeata-user');
    if (savedUser) {
      setUserState(JSON.parse(savedUser));
    }
  }, []);

  const setUser = (user: User | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem('recipeata-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('recipeata-user');
    }
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setUserState(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        notificationSettings: {
          ...defaultNotificationSettings,
          ...prev.notificationSettings,
          ...settings,
        },
      };
      localStorage.setItem('recipeata-user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateNotificationSettings }}>
      {children}
    </UserContext.Provider>
  );
}; 