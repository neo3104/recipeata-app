import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

// Firebaseサービスを保持するための変数
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  // 設定値の存在チェック
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("Firebaseの環境変数（.env.local）が設定されていません。");
  }

  // 初期化処理
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch(e) {
    console.error("Failed to initialize firestore with persistent cache. Falling back", e);
    db = initializeFirestore(app, {});
  }
  storage = getStorage(app);

  console.log("Firebase has been initialized successfully.");

} catch (error) {
  console.error("CRITICAL: FIREBASE INITIALIZATION FAILED");
  console.error(error);
  // エラーが発生した場合、アプリが動作不能であることを示すために
  // ダミーのオブジェクトやnullをエクスポートすることもできるが、
  // まずはコンソールエラーで原因を特定することを優先する。
  throw new Error("Firebaseの初期化に失敗しました。コンソールのエラーメッセージを確認してください。");
}

export { db, auth, storage, app }; 