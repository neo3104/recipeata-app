import React, { createContext, useContext, useState } from 'react';

export type ProgressStatus = '未対応' | '対応中' | '完了';

export interface UndoRedoProgressItem {
  key: string;
  label: string;
  status: ProgressStatus;
}

interface UndoRedoProgressContextType {
  progressList: UndoRedoProgressItem[];
  setStatus: (key: string, status: ProgressStatus) => void;
}

const initialProgress: UndoRedoProgressItem[] = [
  { key: 'pin', label: 'ピン刺し', status: '完了' },
  { key: 'favorite', label: 'お気に入り', status: '完了' },
  { key: 'delete', label: 'レシピ削除', status: '完了' },
  { key: 'edit', label: 'レシピ編集', status: '完了' },
  { key: 'add', label: 'レシピ追加', status: '完了' },
  { key: 'comment', label: 'コメント追加・削除', status: '完了' },
];

const UndoRedoProgressContext = createContext<UndoRedoProgressContextType | undefined>(undefined);

export const useUndoRedoProgress = () => {
  const context = useContext(UndoRedoProgressContext);
  if (!context) throw new Error('useUndoRedoProgress must be used within an UndoRedoProgressProvider');
  return context;
};

export const UndoRedoProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progressList, setProgressList] = useState<UndoRedoProgressItem[]>(initialProgress);

  const setStatus = (key: string, status: ProgressStatus) => {
    setProgressList(list => list.map(item => item.key === key ? { ...item, status } : item));
  };

  return (
    <UndoRedoProgressContext.Provider value={{ progressList, setStatus }}>
      {children}
    </UndoRedoProgressContext.Provider>
  );
}; 