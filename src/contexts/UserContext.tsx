import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface User {
  id: string; // Firebase Auth UID
  photoURL: string | null;
  // Firestore-managed fields
  displayName: string; 
  store: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  updateUserProfile: (data: { displayName: string; store: string }) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[UserContext] useEffectが開始され、認証状態の監視を開始します。');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('[UserContext] 認証状態が変化しました。');
      try {
        if (firebaseUser) {
          console.log(`[UserContext] ユーザーを検知しました。UID: ${firebaseUser.uid}`);
          setLoading(true);
          
          console.log('[UserContext] Firestoreのユーザードキュメントへの参照を作成します...');
          const userRef = doc(db, 'users', firebaseUser.uid);
          console.log('[UserContext] ユーザー情報をFirestoreから取得しようとしています...');
          const docSnap = await getDoc(userRef);
          console.log(`[UserContext] ユーザー情報の取得完了。ドキュメント存在: ${docSnap.exists()}`);

          if (docSnap.exists()) {
            console.log('[UserContext] 既存のプロフィールを処理します...');
            const profile = docSnap.data();
            setUser({
              id: firebaseUser.uid,
              photoURL: firebaseUser.photoURL,
              displayName: profile.displayName || '名無しさん',
              store: profile.store || '',
            });
            console.log('[UserContext] 既存プロフィールでユーザー情報を更新しました。');
          } else {
            console.log('[UserContext] プロフィールが存在しないため、新規作成します...');
            const newProfile = {
              displayName: 'ゲストさん',
              store: '',
            };
            await setDoc(userRef, newProfile);
            console.log('[UserContext] 新規プロフィールをFirestoreに保存しました。');
            setUser({
              id: firebaseUser.uid,
              photoURL: firebaseUser.photoURL, 
              ...newProfile,
            });
            console.log('[UserContext] 新規プロフィールでユーザー情報を更新しました。');
          }
        } else {
          console.log('[UserContext] ユーザーが検知されませんでした（ログアウト状態）。');
          setUser(null);
        }
      } catch (error) {
        console.error("[UserContext] 認証処理中に致命的なエラーが発生しました:", error);
        setUser(null);
      } finally {
        console.log('[UserContext] すべての認証処理が完了し、ローディングを終了します。');
        setLoading(false);
      }
    });

    return () => {
      console.log('[UserContext] コンポーネントが破棄されるため、監視を終了します。');
      unsubscribe();
    }
  }, []);

  const updateUserProfile = async (data: { displayName: string; store: string }) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, data, { merge: true });
    setUser((prevUser) => (prevUser ? { ...prevUser, ...data } : null));
  };

  const value = { user, loading, updateUserProfile };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 