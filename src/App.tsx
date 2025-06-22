import { Outlet } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RecipeProvider } from './contexts/RecipeContext';

function App() {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <UserProvider>
          <RecipeProvider>
            <Outlet />
          </RecipeProvider>
        </UserProvider>
      </NotificationProvider>
    </SettingsProvider>
  );
}

export default App;
