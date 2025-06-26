import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Container, Paper, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LOCAL_STORAGE_KEY = 'recipeata-user-info';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [error, setError] = useState('');

  // 2回目以降はlocalStorageから自動取得し、スキップ
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !store.trim()) {
      setError('ユーザー名と所属店舗を入力してください');
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ name, store }));
    navigate('/', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景画像 */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=1500&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          zIndex: 0,
        }}
      />
      {/* オーバーレイ */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.25) 0%, rgba(255,183,77,0.12) 100%)',
          zIndex: 1,
        }}
      />
      {/* 中央のログインパネル */}
      <Container
        maxWidth="sm"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Paper elevation={16} sx={{
          p: 5,
          borderRadius: 5,
          width: '100%',
          maxWidth: 480,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(255,183,77,0.18)',
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(2px)',
        }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 900, letterSpacing: 2, color: '#ff9800', textShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            レシピアプリへようこそ
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', fontWeight: 500 }}>
            ユーザー情報を入力してください
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
          )}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="ユーザー名"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              margin="normal"
              autoFocus
              sx={{ background: '#fff', borderRadius: 2 }}
            />
            <TextField
              label="所属店舗"
              value={store}
              onChange={e => setStore(e.target.value)}
              fullWidth
              margin="normal"
              sx={{ background: '#fff', borderRadius: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3, fontWeight: 700, fontSize: '1.1rem' }}
            >
              保存してはじめる
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 