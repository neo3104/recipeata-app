import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';

function Profile() {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      const fetchUserData = async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setDisplayName(userData.displayName || '');
          setStoreName(userData.storeName || '');
        }
        setLoading(false);
      };
      fetchUserData();
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to update a profile.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { displayName, storeName }, { merge: true });
      setSuccess('プロフィールを更新しました！');
    } catch (err) {
      setError('プロフィールの更新に失敗しました。');
    }
  };
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      setError("ログアウトに失敗しました。");
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
            id="displayName"
            label="表示名"
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            name="storeName"
            label="所属店舗名"
            id="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
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
          <Button
            fullWidth
            variant="outlined"
            onClick={handleLogout}
          >
            ログアウト
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Profile; 