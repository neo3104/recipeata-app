import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNotification } from './NotificationContext';
import { useSettings } from './SettingsContext';

export interface Ingredient {
  id: number;
  name: string;
  quantity: string;
}

export interface Step {
  id: number;
  description: string;
  image: File | null;
  imageUrl: string | null;
}

export interface Like {
  userId: string; // ユーザーID（名前+店舗の組み合わせ）
  userName: string;
  userStore: string;
  timestamp: number;
}

export interface Comment {
  id: string;
  userId: string; // ユーザーID（名前+店舗の組み合わせ）
  userName: string;
  userStore: string;
  content: string;
  timestamp: number;
  replies: Reply[];
}

export interface Reply {
  id: string;
  userId: string; // ユーザーID（名前+店舗の組み合わせ）
  userName: string;
  userStore: string;
  content: string;
  timestamp: number;
  parentCommentId: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  mainImage: File | null;
  mainImageUrl: string | null;
  totalTime: string;
  servings: string;
  advice: string;
  author: string;
  store: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
  createdAt: number;
  likes: Like[];
  comments: Comment[];
}

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'likes' | 'comments'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  addLike: (recipeId: string, userName: string, userStore: string) => void;
  removeLike: (recipeId: string, userName: string, userStore: string) => void;
  addComment: (recipeId: string, userName: string, userStore: string, content: string) => void;
  deleteComment: (recipeId: string, commentId: string) => void;
  addReply: (recipeId: string, commentId: string, userName: string, userStore: string, content: string) => void;
  deleteReply: (recipeId: string, commentId: string, replyId: string) => void;
  addToRecentlyViewed: (recipeId: string) => void;
  getRecentlyViewed: () => Recipe[];
  getMyRecipes: (userName: string, userStore: string) => Recipe[];
  getLikedRecipes: (userName: string, userStore: string) => Recipe[];
  loading: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
}

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const { settings } = useSettings();

  useEffect(() => {
    const loadRecipes = () => {
      try {
        const savedRecipes = localStorage.getItem('recipeata-recipes');
        if (savedRecipes) {
          const parsedRecipes = JSON.parse(savedRecipes);
          // 既存のレシピにいいねとコメントの配列を追加
          const updatedRecipes = parsedRecipes.map((recipe: any) => ({
            ...recipe,
            likes: recipe.likes || [],
            comments: (recipe.comments || []).map((comment: any) => ({
              ...comment,
              replies: comment.replies || [],
            })),
          }));
          setRecipes(updatedRecipes);
        }
      } catch (error) {
        console.error('Failed to load recipes from localStorage', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    try {
      const newRecipe: Recipe = {
        ...recipeData,
        id: Date.now().toString(),
        createdAt: Date.now(),
        likes: [],
        comments: [],
      };
      
      const updatedRecipes = [...recipes, newRecipe];
      localStorage.setItem('recipeata-recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
      // 通知
      if (settings.notifications.recipeAdded) {
        showNotification(`「${newRecipe.title}」が追加されました`, 'success');
      }
    } catch (error) {
      console.error('Failed to save recipe to localStorage', error);
    }
  };

  const updateRecipe = (recipe: Recipe) => {
    try {
      const updatedRecipes = recipes.map(r => (r.id === recipe.id ? recipe : r));
      localStorage.setItem('recipeata-recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
      // 通知
      if (settings.notifications.recipeEdited) {
        showNotification(`「${recipe.title}」が編集されました`, 'info');
      }
    } catch (error) {
      console.error('Failed to update recipe in localStorage', error);
    }
  };

  const deleteRecipe = (id: string) => {
    try {
      const updatedRecipes = recipes.filter(recipe => recipe.id !== id);
      localStorage.setItem('recipeata-recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Failed to delete recipe from localStorage', error);
    }
  };

  const addLike = (recipeId: string, userName: string, userStore: string) => {
    try {
      const userId = `${userName}-${userStore}`;
      const updatedRecipes = recipes.map(recipe => {
        if (recipe.id === recipeId) {
          // 既にいいねしているかチェック
          const alreadyLiked = recipe.likes.some(like => like.userId === userId);
          if (alreadyLiked) {
            return recipe; // 既にいいね済みの場合は何もしない
          }
          
          const newLike: Like = {
            userId,
            userName,
            userStore,
            timestamp: Date.now(),
          };
          
          // 通知
          if (settings.notifications.recipeLiked) {
            showNotification(`「${recipe.title}」にいいねしました`, 'success');
          }
          return {
            ...recipe,
            likes: [...recipe.likes, newLike]
          };
        }
        return recipe;
      });
      
      localStorage.setItem('recipeata-recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Failed to add like to localStorage', error);
    }
  };

  const removeLike = (recipeId: string, userName: string, userStore: string) => {
    try {
      const userId = `${userName}-${userStore}`;
      const updatedRecipes = recipes.map(recipe => {
        if (recipe.id === recipeId) {
          return {
            ...recipe,
            likes: recipe.likes.filter(like => like.userId !== userId)
          };
        }
        return recipe;
      });
      
      localStorage.setItem('recipeata-recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Failed to remove like from localStorage', error);
    }
  };

  const addComment = (recipeId: string, userName: string, userStore: string, content: string) => {
    try {
      const userId = `${userName}-${userStore}`;
      const newComment: Comment = {
        id: Date.now().toString(),
        userId,
        userName,
        userStore,
        content: content.trim(),
        timestamp: Date.now(),
        replies: [],
      };
      
      const updatedRecipes = recipes.map(recipe => {
        if (recipe.id === recipeId) {
          // 通知
          if (settings.notifications.recipeCommented) {
            showNotification(`「${recipe.title}」にコメントしました`, 'info');
          }
          return {
            ...recipe,
            comments: [...recipe.comments, newComment]
          };
        }
        return recipe;
      });
      
      localStorage.setItem('recipeata-recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Failed to add comment to localStorage', error);
    }
  };

  const addReply = (recipeId: string, commentId: string, userName: string, userStore: string, content: string) => {
    try {
      const userId = `${userName}-${userStore}`;
      const newReply: Reply = {
        id: Date.now().toString(),
        userId,
        userName,
        userStore,
        content: content.trim(),
        timestamp: Date.now(),
        parentCommentId: commentId,
      };
      
      const updatedRecipes = recipes.map(recipe => {
        if (recipe.id === recipeId) {
          return {
            ...recipe,
            comments: recipe.comments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  replies: [...comment.replies, newReply]
                };
              }
              return comment;
            })
          };
        }
        return recipe;
      });
      
      localStorage.setItem('recipeata-recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Failed to add reply to localStorage', error);
    }
  };

  const deleteReply = (recipeId: string, commentId: string, replyId: string) => {
    try {
      const updatedRecipes = recipes.map(recipe => {
        if (recipe.id === recipeId) {
          return {
            ...recipe,
            comments: recipe.comments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  replies: comment.replies.filter(reply => reply.id !== replyId)
                };
              }
              return comment;
            })
          };
        }
        return recipe;
      });
      
      localStorage.setItem('recipeata-recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Failed to delete reply from localStorage', error);
    }
  };

  const deleteComment = (recipeId: string, commentId: string) => {
    try {
      const updatedRecipes = recipes.map(recipe => {
        if (recipe.id === recipeId) {
          return {
            ...recipe,
            comments: recipe.comments.filter(comment => comment.id !== commentId)
          };
        }
        return recipe;
      });
      
      localStorage.setItem('recipeata-recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Failed to delete comment from localStorage', error);
    }
  };

  const addToRecentlyViewed = (recipeId: string) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;

      const recentlyViewed = JSON.parse(localStorage.getItem('recipeata-recently-viewed') || '[]');
      const updatedRecentlyViewed = [
        recipeId,
        ...recentlyViewed.filter((id: string) => id !== recipeId)
      ].slice(0, 10); // 最新10件まで保持

      localStorage.setItem('recipeata-recently-viewed', JSON.stringify(updatedRecentlyViewed));
    } catch (error) {
      console.error('Failed to add to recently viewed', error);
    }
  };

  const getRecentlyViewed = (): Recipe[] => {
    try {
      const recentlyViewedIds = JSON.parse(localStorage.getItem('recipeata-recently-viewed') || '[]');
      return recipes.filter(recipe => recentlyViewedIds.includes(recipe.id));
    } catch (error) {
      console.error('Failed to get recently viewed recipes', error);
      return [];
    }
  };

  const getMyRecipes = (userName: string, userStore: string): Recipe[] => {
    return recipes.filter(recipe => 
      recipe.author === userName && recipe.store === userStore
    );
  };

  const getLikedRecipes = (userName: string, userStore: string): Recipe[] => {
    const userId = `${userName}-${userStore}`;
    return recipes.filter(recipe => 
      recipe.likes.some(like => like.userId === userId)
    );
  };

  const value = {
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    addLike,
    removeLike,
    addComment,
    deleteComment,
    addReply,
    deleteReply,
    addToRecentlyViewed,
    getRecentlyViewed,
    getMyRecipes,
    getLikedRecipes,
    loading
  };

  if (loading) {
    return null;
  }

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
} 