import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface NotificationSettings {
  recipeAdded: boolean;
  recipeEdited: boolean;
  recipeLiked: boolean;
  recipeCommented: boolean;
}

export interface AppSettings {
  // 通知設定
  notifications: NotificationSettings;
  // レシピ一覧設定
  recipesPerPage: number;
  // 表示設定
  showRecipeImages: boolean;
  showRecipeTags: boolean;
  showRecipeAuthor: boolean;
  // 検索設定
  enableFuzzySearch: boolean;
  searchHistoryEnabled: boolean;
  // その他の設定
  autoSaveEnabled: boolean;
  confirmDelete: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateNotificationSettings: (notificationSettings: Partial<NotificationSettings>) => void;
  resetToDefaults: () => void;
}

const defaultSettings: AppSettings = {
  notifications: {
    recipeAdded: true,
    recipeEdited: true,
    recipeLiked: true,
    recipeCommented: true,
  },
  recipesPerPage: 12,
  showRecipeImages: true,
  showRecipeTags: true,
  showRecipeAuthor: true,
  enableFuzzySearch: true,
  searchHistoryEnabled: true,
  autoSaveEnabled: true,
  confirmDelete: true,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  updateNotificationSettings: () => {},
  resetToDefaults: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem('recipeata-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  const saveSettings = (newSettings: AppSettings) => {
    localStorage.setItem('recipeata-settings', JSON.stringify(newSettings));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  const updateNotificationSettings = (notificationSettings: Partial<NotificationSettings>) => {
    const updated = {
      ...settings,
      notifications: { ...settings.notifications, ...notificationSettings }
    };
    setSettings(updated);
    saveSettings(updated);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      updateNotificationSettings,
      resetToDefaults,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}; 