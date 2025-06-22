import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Layout from './components/Layout.tsx';
import RecipeList from './pages/RecipeList.tsx';
import Login from './pages/Login.tsx';
import AddRecipe from './pages/AddRecipe.tsx';
import RecipeDetail from './pages/RecipeDetail.tsx';
import EditRecipe from './pages/EditRecipe.tsx';
import MyPage from './pages/MyPage.tsx';

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: (
              <Layout>
                <Outlet />
              </Layout>
            ),
            children: [
              {
                path: '/',
                index: true,
                element: <RecipeList />,
              },
              {
                path: 'add',
                element: <AddRecipe />,
              },
              {
                path: 'recipe/:id',
                element: <RecipeDetail />,
              },
              {
                path: 'edit/:id',
                element: <EditRecipe />,
              },
              {
                path: 'mypage',
                element: <MyPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
