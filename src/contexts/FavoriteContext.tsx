import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface FavoriteContextType {
  favorites: string[]; // お気に入りレシピのID配列
  addFavorite: (recipeId: string) => Promise<void>;
  removeFavorite: (recipeId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
  loading: boolean;
  error: string | null;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoriteContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoriteProvider');
  }
  return context;
};

interface FavoriteProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export const FavoriteProvider: React.FC<FavoriteProviderProps> = ({ children, userId }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ユーザーのお気に入りを取得
  const fetchFavorites = async () => {
    if (!userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setFavorites(userData.favorites || []);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('お気に入り取得エラー:', err);
      setError('お気に入りの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // お気に入りを追加
  const addFavorite = async (recipeId: string) => {
    if (!userId) {
      setError('ログインが必要です');
      return;
    }

    try {
      setError(null);
      
      const userDoc = doc(db, 'users', userId);
      const newFavorites = [...favorites, recipeId];
      
      await setDoc(userDoc, { favorites: newFavorites }, { merge: true });
      setFavorites(newFavorites);
    } catch (err) {
      console.error('お気に入り追加エラー:', err);
      setError('お気に入りの追加に失敗しました');
    }
  };

  // お気に入りを削除
  const removeFavorite = async (recipeId: string) => {
    if (!userId) {
      setError('ログインが必要です');
      return;
    }

    try {
      setError(null);
      
      const userDoc = doc(db, 'users', userId);
      const newFavorites = favorites.filter(id => id !== recipeId);
      
      await setDoc(userDoc, { favorites: newFavorites }, { merge: true });
      setFavorites(newFavorites);
    } catch (err) {
      console.error('お気に入り削除エラー:', err);
      setError('お気に入りの削除に失敗しました');
    }
  };

  // お気に入りかどうかチェック
  const isFavorite = (recipeId: string): boolean => {
    return favorites.includes(recipeId);
  };

  // ユーザーIDが変更されたらお気に入りを再取得
  useEffect(() => {
    fetchFavorites();
  }, [userId]);

  const value: FavoriteContextType = {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    loading,
    error,
  };

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
}; 