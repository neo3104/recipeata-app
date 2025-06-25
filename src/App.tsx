import { Outlet } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RecipeProvider } from './contexts/RecipeContext';
import { FavoriteProvider } from './contexts/FavoriteContext';
import { PinProvider } from './contexts/PinContext';
import { UndoRedoProvider } from './contexts/UndoRedoContext';
import { UndoRedoProgressProvider } from './contexts/UndoRedoProgressContext';

function AppContent() {
  const { user } = useUser();
  
  return (
    <PinProvider userId={user?.id || null}>
      <FavoriteProvider userId={user?.id || null}>
        <Outlet />
      </FavoriteProvider>
    </PinProvider>
  );
}

function App() {
  return (
    <UndoRedoProvider>
      <UndoRedoProgressProvider>
        <SettingsProvider>
          <NotificationProvider>
            <UserProvider>
              <RecipeProvider>
                <AppContent />
              </RecipeProvider>
            </UserProvider>
          </NotificationProvider>
        </SettingsProvider>
      </UndoRedoProgressProvider>
    </UndoRedoProvider>
  );
}

export default App;
