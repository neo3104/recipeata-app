import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from '@mui/material';

function Profile() {
  const { user, updateUserProfile } = useUser();
  const [name, setName] = useState(user?.name || '');
  const [store, setStore] = useState(user?.store || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setStore(user?.store || '');
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim() || !store.trim()) {
      setError('ユーザー名と所属店舗を入力してください');
      return;
    }
    updateUserProfile({ name, store });
    setSuccess('プロフィールを更新しました！');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={6} sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          プロフィール設定
        </Typography>
        <Box component="form" onSubmit={handleUpdateProfile}>
          <TextField
            margin="normal"
            fullWidth
            id="name"
            label="ユーザー名"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            name="store"
            label="所属店舗名"
            id="store"
            value={store}
            onChange={(e) => setStore(e.target.value)}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            プロフィールを更新
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Profile; 