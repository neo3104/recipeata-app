import React, { createContext, useContext, useState } from 'react';

export type UndoRedoAction = {
  type: string; // 例: 'pin', 'favorite', 'comment', 'edit', ...
  payload: any;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
  description?: string; // UI表示用
  timestamp?: Date; // 操作時刻（省略可能に変更）
};

interface UndoRedoContextType {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  pushAction: (action: UndoRedoAction) => void;
  lastActionDescription: string | null;
  undoStack: UndoRedoAction[];
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

export const useUndoRedo = () => {
  const context = useContext(UndoRedoContext);
  if (!context) throw new Error('useUndoRedo must be used within an UndoRedoProvider');
  return context;
};

export const UndoRedoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [undoStack, setUndoStack] = useState<UndoRedoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoAction[]>([]);
  const [lastActionDescription, setLastActionDescription] = useState<string | null>(null);

  const pushAction = (action: UndoRedoAction) => {
    const actionWithTimestamp = {
      ...action,
      timestamp: new Date(),
    };
    setUndoStack(prev => [...prev, actionWithTimestamp]);
    setRedoStack([]); // 新しい操作が入ったらredoはリセット
    setLastActionDescription(action.description || null);
  };

  const undo = async () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    await action.undo();
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);
    setLastActionDescription(action.description || null);
  };

  const redo = async () => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    await action.redo();
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);
    setLastActionDescription(action.description || null);
  };

  return (
    <UndoRedoContext.Provider value={{
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      undo,
      redo,
      pushAction,
      lastActionDescription,
      undoStack,
    }}>
      {children}
    </UndoRedoContext.Provider>
  );
}; 