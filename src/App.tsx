import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RecipeList from './pages/RecipeList';
import AddRecipe from './pages/AddRecipe';
import MyPage from './pages/MyPage';
import RecipeDetail from './pages/RecipeDetail';
import EditRecipe from './pages/EditRecipe';
import { NotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';

function App() {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<RecipeList />} />
            <Route path="/add" element={<AddRecipe />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/recipe/:id/edit" element={<EditRecipe />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </SettingsProvider>
  );
}

export default App;
