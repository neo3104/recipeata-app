import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Recipe, Comment, Like } from '../types';
import { useUser } from './UserContext';

// FirestoreのTimestampを安全にDateオブジェクトに変換するヘルパー関数
const safeToDate = (value: any): Date => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  // 文字列や数値からDateへの変換を試みる
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  // 不明な形式やnull/undefinedの場合は現在時刻を返すなど、エラーを防ぐ
  return new Date();
};

interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  addRecipe: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments'>) => Promise<string>;
  updateRecipe: (id: string, recipeData: Partial<Recipe>, editor?: { name: string; store: string; userId: string }, diff?: string) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  restoreRecipe: (recipe: Recipe) => Promise<void>;
  getRecipeById: (id: string) => Recipe | undefined;
  toggleLike: (recipeId: string, user: { userId: string, userName: string, userPhotoURL?: string }) => Promise<void>;
  addComment: (recipeId: string, comment: Omit<Comment, 'id' | 'createdAt'>, parentId?: string) => Promise<void>;
  deleteComment: (recipeId: string, commentId: string, parentId?: string) => Promise<void>;
}

export const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const useRecipes = (): RecipeContextType => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user) {
        // ユーザーがいない（ログアウト状態など）場合はレシピを取得しない
        setRecipes([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const q = query(collection(db, "recipes"), orderBy("createdAt", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        
        const recipesDataPromises = querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          if (!data.createdById) {
            console.warn(`Recipe with id ${doc.id} is missing createdById`);
            return null;
          }

          // 画像URLを取得
          let mainImageUrl = '';
          if (data.mainImageUrl && typeof data.mainImageUrl === 'string' && (data.mainImageUrl.startsWith('http://') || data.mainImageUrl.startsWith('https://'))) {
            mainImageUrl = data.mainImageUrl;
          } else {
            mainImageUrl = '';
          }

          return {
            id: doc.id,
            ...data,
            mainImageUrl, // 取得したURLで上書き
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
            createdBy: {
              ...data.createdBy,
              photoURL: data.createdBy?.photoURL ?? undefined,
            },
            comments: (data.comments || []).map((c: any) => ({
              ...c,
              createdAt: safeToDate(c.createdAt),
              createdBy: {
                ...c.createdBy,
                photoURL: c.createdBy?.photoURL ?? undefined,
              },
              replies: (c.replies || []).map((r: any) => ({
                ...r,
                createdAt: safeToDate(r.createdAt),
                createdBy: {
                  ...r.createdBy,
                  photoURL: r.createdBy?.photoURL ?? undefined,
                },
              })),
            })),
            likes: (data.likes || []).map((l: any) => ({
              ...l,
              userPhotoURL: l.userPhotoURL ?? undefined,
            })),
          } as Recipe;
        });

        const recipesData = (await Promise.all(recipesDataPromises)).filter((r): r is Recipe => r !== null);
        
        setRecipes(recipesData);
      } catch (e) {
        console.error("Error fetching recipes: ", e);
        setError("レシピの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchRecipes();
    }
  }, [user, userLoading]);

  const addRecipe = async (
    recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments'>,
  ): Promise<string> => {
    try {
      setLoading(true);
      const docData = {
        ...recipeData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        likes: [],
        comments: [],
      };

      const docRef = await addDoc(collection(db, "recipes"), docData);
      
      const newRecipe: Recipe = {
        ...(docData as Omit<Recipe, 'id'|'createdAt'|'updatedAt'>),
        id: docRef.id,
        createdAt: docData.createdAt.toDate(),
        updatedAt: docData.updatedAt.toDate(),
      };
      
      setRecipes((prev) => [newRecipe, ...prev]);
      return docRef.id;
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("レシピの追加に失敗しました。");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  function isSame(val1: any, val2: any) {
    if (val1 === undefined && val2 === undefined) return true;
    if (val1 === '' && val2 === '') return true;
    if (val1 === null && val2 === null) return true;
    return val1 === val2;
  }

  function generateRecipeDiff(before: Partial<Recipe>, after: Partial<Recipe>): any {
    const diff: any = {};
    // タイトル
    if (!isSame(before.title, after.title)) {
      diff.title = { before: before.title, after: after.title };
    }
    // 説明
    if (!isSame(before.description, after.description)) {
      diff.description = { before: before.description, after: after.description };
    }
    // 材料
    if (JSON.stringify(before.ingredients) !== JSON.stringify(after.ingredients)) {
      const added = (after.ingredients || []).filter(a => !(before.ingredients || []).some((b: any) => b.name === a.name && b.quantity === a.quantity));
      const removed = (before.ingredients || []).filter(b => !(after.ingredients || []).some((a: any) => a.name === b.name && a.quantity === b.quantity));
      if (added.length > 0) diff.ingredientsAdded = added;
      if (removed.length > 0) diff.ingredientsRemoved = removed;
    }
    // 手順
    if (JSON.stringify(before.steps) !== JSON.stringify(after.steps)) {
      const added = (after.steps || []).filter((a: any) => !(before.steps || []).some((b: any) => b.description === a.description && b.imageUrl === a.imageUrl));
      const removed = (before.steps || []).filter((b: any) => !(after.steps || []).some((a: any) => a.description === b.description && a.imageUrl === b.imageUrl));
      if (added.length > 0) diff.stepsAdded = added.map((s: any) => ({ description: s.description, imageUrl: s.imageUrl }));
      if (removed.length > 0) diff.stepsRemoved = removed.map((s: any) => ({ description: s.description, imageUrl: s.imageUrl }));
    }
    // メイン画像
    if (!isSame(before.mainImageUrl, after.mainImageUrl)) {
      diff.mainImageUrl = { before: before.mainImageUrl, after: after.mainImageUrl };
    }
    // 工程画像
    if (before.steps && after.steps) {
      const changedStepImages = (after.steps as any[]).map((a, i) => {
        const b = (before.steps as any[])[i];
        if (b && !isSame(a.imageUrl, b.imageUrl)) {
          return { index: i, before: b.imageUrl, after: a.imageUrl };
        }
        return null;
      }).filter(Boolean);
      if (changedStepImages.length > 0) diff.stepImages = changedStepImages;
    }
    return diff;
  }

  const updateRecipe = async (
    id: string,
    recipeUpdate: Partial<Recipe>,
    editor?: { name: string; store: string; userId: string },
    diff?: string
  ): Promise<void> => {
    const originalRecipe = recipes.find(r => r.id === id);
    if (!originalRecipe) {
      throw new Error("更新対象のレシピが見つかりません。");
    }

    try {
      setLoading(true);

      // 差分生成
      const autoDiff = generateRecipeDiff(originalRecipe, { ...originalRecipe, ...recipeUpdate });
      const isDiffEmpty = !autoDiff || Object.keys(autoDiff).length === 0;
      if (isDiffEmpty) {
        setLoading(false);
        return;
      }

      // 履歴エントリを作成
      const historyEntry = removeUndefinedDeep({
        editedAt: Timestamp.now(),
        editedBy: editor || { name: '', store: '', userId: '' },
        diff: diff || autoDiff,
        snapshot: { ...originalRecipe },
      });

      // undefinedを除去
      const docData = removeUndefinedDeep({
        ...recipeUpdate,
        updatedAt: Timestamp.now(),
      });

      const recipeRef = doc(db, 'recipes', id);
      // 既存のhistoryを取得して最大10件に制限
      const currentHistory = (originalRecipe as any).history || [];
      const newHistory = [historyEntry, ...currentHistory].slice(0, 10);
      await updateDoc(recipeRef, { ...docData, history: newHistory });

      const updatedRecipeData = {
        ...originalRecipe,
        ...recipeUpdate,
        updatedAt: new Date(), // Firestore用とは分離して常にDate型
        history: newHistory,
      }

      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === id ? updatedRecipeData : recipe
        )
      );
    } catch (e) {
      console.error("Error updating document: ", e);
      setError("レシピの更新に失敗しました。");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, "recipes", id));
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error("Error deleting document: ", e);
      setError("レシピの削除に失敗しました。");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const restoreRecipe = async (recipe: Recipe): Promise<void> => {
    try {
      setLoading(true);
      // Firestoreにレシピを再追加
      const docRef = await addDoc(collection(db, "recipes"), {
        ...recipe,
        id: undefined, // Firestoreが自動生成するため除外
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // 新しいIDでレシピを復元
      const restoredRecipe = {
        ...recipe,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setRecipes((prev) => [...prev, restoredRecipe]);
    } catch (e) {
      console.error("Error restoring document: ", e);
      setError("レシピの復元に失敗しました。");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (recipeId: string, user: { userId: string, userName: string, userPhotoURL?: string }) => {
    if (!user?.userId) {
      console.error("User is not authenticated. Cannot like.");
      return;
    }
    const recipeRef = doc(db, 'recipes', recipeId);
    const currentRecipe = recipes.find(r => r.id === recipeId);
    if (!currentRecipe) return;

    const likeData: Like = {
      userId: user.userId ?? '',
      userName: user.userName ?? '',
      userPhotoURL: user.userPhotoURL ?? '',
    };

    const isLiked = currentRecipe.likes.some(like => like.userId === user.userId);

    const updateData = {
      updatedAt: serverTimestamp()
    };

    if (isLiked) {
      const existingLike = currentRecipe.likes.find(like => like.userId === user.userId);
      await updateDoc(recipeRef, {
        ...updateData,
        likes: arrayRemove(existingLike)
      });
    } else {
      await updateDoc(recipeRef, {
        ...updateData,
        likes: arrayUnion(likeData)
      });
    }

    setRecipes(prevRecipes => 
      prevRecipes.map(recipe => {
        if (recipe.id === recipeId) {
          const newLikes = isLiked
            ? recipe.likes.filter(like => like.userId !== user.userId)
            : [...recipe.likes, likeData];
          return { ...recipe, likes: newLikes };
        }
        return recipe;
      })
    );
  };

  // 再帰的にundefinedを除去する関数
  function removeUndefinedDeep(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(removeUndefinedDeep);
    } else if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, removeUndefinedDeep(v)])
      );
    }
    return obj;
  }

  const addComment = async (recipeId: string, comment: Omit<Comment, 'id' | 'createdAt'>, parentId?: string) => {
    if (!user) {
      setError("コメントを追加するにはログインが必要です。");
      return;
    }
    
    const commentData = {
      ...comment,
      createdBy: {
        name: comment.createdBy.name ?? '',
        photoURL: comment.createdBy.photoURL ?? '',
        store: user.store ?? '',
      },
      createdAt: new Date(),
    };

    const recipeRef = doc(db, 'recipes', recipeId);
    
    try {
      const currentRecipe = recipes.find(r => r.id === recipeId);
      if (!currentRecipe) throw new Error("Recipe not found");
      
      let updatedComments: Comment[];
      
      if (parentId) {
        // 返信の追加
        const addReply = (comments: Comment[]): Comment[] => {
          return comments.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [
                  ...(c.replies || []),
                  {
                    ...comment,
                    id: new Date().getTime().toString(),
                    createdAt: new Date(),
                    createdBy: { ...comment.createdBy, store: user.store }
                  }
                ]
              };
            }
            if (c.replies) {
              return { ...c, replies: addReply(c.replies) };
            }
            return c;
          });
        };
        updatedComments = addReply(currentRecipe.comments);
        await updateDoc(recipeRef, { comments: removeUndefinedDeep(updatedComments) });
      } else {
        // 新規コメントの追加
        updatedComments = [...currentRecipe.comments, { ...comment, id: new Date().getTime().toString(), createdAt: new Date(), createdBy: { ...comment.createdBy, store: user.store } }];
        await updateDoc(recipeRef, {
          comments: arrayUnion(commentData)
        });
      }

      setRecipes(prevRecipes =>
        prevRecipes.map(recipe =>
          recipe.id === recipeId ? { ...recipe, comments: updatedComments } : recipe
        )
      );

    } catch (e) {
      console.error("Error adding comment: ", e);
      setError("コメントの追加に失敗しました。");
    }
  };

  const deleteComment = async (recipeId: string, commentId: string, parentId?: string) => {
    if (!user) {
      setError("コメントを削除するにはログインが必要です。");
      return;
    }
    
    try {
      const currentRecipe = recipes.find(r => r.id === recipeId);
      if (!currentRecipe) throw new Error("Recipe not found");
      
      let updatedComments: Comment[];
      
      if (parentId) {
        // 返信の削除
        const removeReply = (comments: Comment[]): Comment[] => {
          return comments.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: (c.replies || []).filter(reply => reply.id !== commentId)
              };
            }
            if (c.replies) {
              return { ...c, replies: removeReply(c.replies) };
            }
            return c;
          });
        };
        updatedComments = removeReply(currentRecipe.comments);
      } else {
        // メインコメントの削除
        updatedComments = currentRecipe.comments.filter(c => c.id !== commentId);
      }
      
      const recipeRef = doc(db, 'recipes', recipeId);
      await updateDoc(recipeRef, { comments: removeUndefinedDeep(updatedComments) });

      setRecipes(prevRecipes =>
        prevRecipes.map(recipe =>
          recipe.id === recipeId ? { ...recipe, comments: updatedComments } : recipe
        )
      );

    } catch (e) {
      console.error("Error deleting comment: ", e);
      setError("コメントの削除に失敗しました。");
    }
  };

  const getRecipeById = (id: string): Recipe | undefined => {
    return recipes.find((recipe) => recipe.id === id);
  };

  const value = {
    recipes,
    loading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    restoreRecipe,
    getRecipeById,
    toggleLike,
    addComment,
    deleteComment,
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
}; 