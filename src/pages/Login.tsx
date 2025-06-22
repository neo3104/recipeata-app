import React, { useState } from 'react';
import { Box, Button, Typography, Container, Paper, CircularProgress, Alert } from '@mui/material';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { useLocation, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Anonymous login error:', err);
      setError(`ログインに失敗しました。Firebaseの接続設定を確認してください。(エラー: ${err.code})`);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <Paper sx={{ p: 4, textAlign: 'center', width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            レシピアプリへようこそ
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            アプリを使用するにはログインしてください
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}

          <Box sx={{ position: 'relative' }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleAnonymousLogin}
              disabled={loading}
              fullWidth
            >
              ゲストとしてログイン
            </Button>
            {loading && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 