import React, { createContext, useContext, useState, useEffect } from 'react';
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
  where,
  writeBatch,
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
  updateRecipe: (id: string, recipeData: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  getRecipeById: (id: string) => Recipe | undefined;
  toggleLike: (recipeId: string, user: { userId: string, userName: string, userPhotoURL: string | null }) => Promise<void>;
  addComment: (recipeId: string, comment: Omit<Comment, 'id' | 'createdAt'>, parentId?: string) => Promise<void>;
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
        const recipesData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          // 型を強制する前にcreatedByIdが存在するかチェック
          if (!data.createdById) {
            console.warn(`Recipe with id ${doc.id} is missing createdById`);
            // ここでデフォルト値を設定するか、読み飛ばすかを選択
            // 今回は読み飛ばす
            return null;
          }
          return {
            id: doc.id,
            ...data,
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
            comments: (data.comments || []).map((c: any) => ({
              ...c,
              createdAt: safeToDate(c.createdAt),
            })),
          } as Recipe;
        }).filter((r): r is Recipe => r !== null); // nullを除外
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

  const updateRecipe = async (
    id: string,
    recipeUpdate: Partial<Recipe>
  ): Promise<void> => {
    const originalRecipe = recipes.find(r => r.id === id);
    if (!originalRecipe) {
      throw new Error("更新対象のレシピが見つかりません。");
    }

    try {
      setLoading(true);
      
      const docData = {
        ...recipeUpdate,
        updatedAt: Timestamp.now(),
      };
      
      const recipeRef = doc(db, 'recipes', id);
      await updateDoc(recipeRef, docData);

      const updatedRecipeData = {
        ...originalRecipe,
        ...recipeUpdate,
        updatedAt: docData.updatedAt.toDate(),
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

  const toggleLike = async (recipeId: string, user: { userId: string, userName: string, userPhotoURL: string | null }) => {
    if (!user?.userId) {
      console.error("User is not authenticated. Cannot like.");
      return;
    }
    const recipeRef = doc(db, 'recipes', recipeId);
    const currentRecipe = recipes.find(r => r.id === recipeId);
    if (!currentRecipe) return;

    const likeData: Like = {
      userId: user.userId,
      userName: user.userName,
      userPhotoURL: user.userPhotoURL,
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

  const addComment = async (recipeId: string, comment: Omit<Comment, 'id' | 'createdAt'>, parentId?: string) => {
    const recipeRef = doc(db, 'recipes', recipeId);
    const newComment = {
      ...comment,
      id: doc(collection(db, 'dummy')).id, // 一時的なID
      createdAt: new Date(),
      replies: [],
    };

    try {
      const currentRecipe = recipes.find(r => r.id === recipeId);
      if (!currentRecipe) {
        throw new Error('Recipe not found');
      }

      let updatedComments;
      if (parentId) {
        // 返信の場合
        updatedComments = currentRecipe.comments.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            };
          }
          return c;
        });
      } else {
        // 新規コメントの場合
        updatedComments = [...currentRecipe.comments, newComment];
      }

      await updateDoc(recipeRef, {
        comments: updatedComments,
        updatedAt: serverTimestamp(),
      });

      setRecipes(prevRecipes =>
        prevRecipes.map(recipe =>
          recipe.id === recipeId
            ? { ...recipe, comments: updatedComments, updatedAt: new Date() }
            : recipe
        )
      );
    } catch (e) {
      console.error("Error adding comment: ", e);
      setError("コメントの追加に失敗しました。");
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
    getRecipeById,
    toggleLike,
    addComment,
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
}; 