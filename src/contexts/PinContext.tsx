import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface PinContextType {
  pins: string[];
  addPin: (recipeId: string) => Promise<void>;
  removePin: (recipeId: string) => Promise<void>;
  isPinned: (recipeId: string) => boolean;
  loading: boolean;
  error: string | null;
  removeAllPins: () => Promise<void>;
}

const PinContext = createContext<PinContextType | undefined>(undefined);

export const usePins = () => {
  const context = useContext(PinContext);
  if (context === undefined) {
    throw new Error('usePins must be used within a PinProvider');
  }
  return context;
};

interface PinProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export const PinProvider: React.FC<PinProviderProps> = ({ children, userId }) => {
  const [pins, setPins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ピン情報を取得
  const fetchPins = async () => {
    if (!userId) {
      setPins([]);
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
        setPins(userData.pins || []);
      } else {
        setPins([]);
      }
    } catch (err) {
      setError('ピン情報の取得に失敗しました');
      setPins([]);
    } finally {
      setLoading(false);
    }
  };

  // ピン追加
  const addPin = async (recipeId: string) => {
    if (!userId) {
      setError('ログインが必要です');
      return;
    }
    try {
      setError(null);
      const userDoc = doc(db, 'users', userId);
      const newPins = [...new Set([...pins, recipeId])];
      await setDoc(userDoc, { pins: newPins }, { merge: true });
      setPins(newPins);
    } catch (err) {
      setError('ピン追加に失敗しました');
    }
  };

  // ピン削除
  const removePin = async (recipeId: string) => {
    if (!userId) {
      setError('ログインが必要です');
      return;
    }
    try {
      setError(null);
      const userDoc = doc(db, 'users', userId);
      const newPins = pins.filter(id => id !== recipeId);
      await setDoc(userDoc, { pins: newPins }, { merge: true });
      setPins(newPins);
    } catch (err) {
      setError('ピン削除に失敗しました');
    }
  };

  // ピン判定
  const isPinned = (recipeId: string) => pins.includes(recipeId);

  // 全てのピンを一括で外す
  const removeAllPins = async () => {
    if (!userId) {
      setError('ログインが必要です');
      return;
    }
    try {
      setError(null);
      const userDoc = doc(db, 'users', userId);
      await setDoc(userDoc, { pins: [] }, { merge: true });
      setPins([]);
    } catch (err) {
      setError('全ピン解除に失敗しました');
    }
  };

  useEffect(() => {
    fetchPins();
  }, [userId]);

  const value: PinContextType = {
    pins,
    addPin,
    removePin,
    isPinned,
    loading,
    error,
    removeAllPins,
  };

  return (
    <PinContext.Provider value={value}>
      {children}
    </PinContext.Provider>
  );
}; 