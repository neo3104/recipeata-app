import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    // 認証状態を確認中はローディング表示
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute; 