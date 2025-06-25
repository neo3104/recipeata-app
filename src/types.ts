// import type { Timestamp } from 'firebase/firestore';

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface RecipeStep {
  description: string;
  imageUrl?: string;
  file?: File; // 画像アップロード時に一時的に使用
}

export interface Step {
  content: string;
  imageUrl?: string;
}

export interface Comment {
  id: string;
  userId: string;
  createdBy: {
    name: string;
    photoURL?: string;
    store?: string;
  };
  text: string;
  createdAt: Date;
  replies?: Comment[];
}

export interface Like {
  userId: string;
  userName: string;
  userPhotoURL?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  mainImageUrl: string;
  subImages: { url: string; caption: string }[];
  ingredients: { name: string; quantity: string }[];
  steps: RecipeStep[];
  createdById: string;
  createdBy: {
    name: string;
    photoURL?: string;
    store?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  likes: Like[];
  comments: Comment[];
  advice?: string;
  tags: string[];
  cookingTime: number;
  servings: number;
  viewedAt?: { [key: string]: Date };
  total?: string;
  history?: any[]; // HistoryEntry[]型にしたいが、循環参照防止のためany[]で仮対応
}

export interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'viewedAt'>) => Promise<string>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleLike: (id: string, user: { userId: string, userName: string, userPhotoURL?: string }) => Promise<void>;
  addComment: (recipeId: string, comment: Omit<Comment, 'id' | 'createdAt'>, parentId?: string) => Promise<void>;
  recordView: (id: string, userId: string) => Promise<void>;
}

export interface User {
  store: string;
}

export interface Notification {
  // ... existing code ...
} 