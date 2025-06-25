import React, { useState } from 'react';
import { Box, Button, Typography, Container, Paper, CircularProgress, Alert, TextField } from '@mui/material';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useLocation, useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Input from '@mui/material/Input';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../contexts/UserContext';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const Login: React.FC = () => {
  const MASTER_SECRET = '3104'; // シークレット番号を変更
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [masterDialogOpen, setMasterDialogOpen] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [masterError, setMasterError] = useState('');

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(`Googleログインに失敗しました。(エラー: ${err.code})`);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(`メールアドレスログインに失敗しました。(エラー: ${err.code})`);
      setLoading(false);
    }
  };

  const handleOpenMasterDialog = () => {
    setMasterDialogOpen(true);
    setSecretCode('');
    setMasterError('');
  };

  const handleCloseMasterDialog = () => {
    setMasterDialogOpen(false);
    setSecretCode('');
    setMasterError('');
  };

  const handleMasterLogin = async () => {
    if (secretCode === MASTER_SECRET) {
      try {
        // 匿名認証でログイン
        const cred = await signInAnonymously(auth);
        const masterUser = cred.user;
        await setDoc(doc(db, 'users', masterUser.uid), { role: 'master', displayName: 'マスター', store: '全店舗', photoURL: masterUser.photoURL || '' }, { merge: true });
        setMasterDialogOpen(false);
        alert('マスター権限でログインしました！');
        navigate(from, { replace: true });
      } catch (err) {
        setMasterError('マスター認証に失敗しました');
      }
    } else {
      setMasterError('シークレット番号が違います');
    }
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
            アプリを使用するにはログインしてください
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}

          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={loading}
            fullWidth
            sx={{
              mb: 2,
              background: '#fff',
              color: '#4285F4',
              border: '1px solid #4285F4',
              fontWeight: 700,
              fontSize: '1.1rem',
              boxShadow: '0 2px 8px rgba(66,133,244,0.08)',
              '&:hover': { background: '#f1faff', borderColor: '#4285F4' },
            }}
          >
            Googleでログイン
          </Button>

          <Box component="form" onSubmit={handleEmailLogin} sx={{ mb: 2 }}>
            <TextField
              label="メールアドレス"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              autoComplete="email"
              disabled={loading}
              sx={{ background: '#fff', borderRadius: 2 }}
            />
            <TextField
              label="パスワード"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              autoComplete="current-password"
              disabled={loading}
              sx={{ background: '#fff', borderRadius: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 2,
                mb: 2,
                background: 'linear-gradient(90deg, #42a5f5 0%, #1976d2 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.05rem',
                boxShadow: '0 2px 8px rgba(25,118,210,0.08)',
                '&:hover': { background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)' },
              }}
            >
              メールアドレスでログイン
            </Button>
          </Box>

          <Button
            variant="outlined"
            size="large"
            onClick={handleAnonymousLogin}
            disabled={loading}
            fullWidth
            sx={{
              borderColor: '#ff9800',
              color: '#ff9800',
              fontWeight: 700,
              fontSize: '1.05rem',
              borderRadius: 2,
              '&:hover': { background: '#fff3e0', borderColor: '#ff9800' },
            }}
          >
            ゲストとしてログイン
          </Button>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<EmojiEventsIcon sx={{ color: '#FFD600' }} />}
            sx={{
              mt: 3,
              mb: 1,
              fontWeight: 700,
              borderRadius: 2,
              borderColor: '#FFD600',
              color: '#FFD600',
              '&:hover': {
                background: '#FFFDE7',
                borderColor: '#FFD600',
                color: '#FFD600',
              },
            }}
            onClick={handleOpenMasterDialog}
          >
            マスターとしてログイン
          </Button>

          {loading && (
            <CircularProgress
              size={32}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-16px',
                marginLeft: '-16px',
              }}
            />
          )}
        </Paper>
      </Container>
      <Dialog open={masterDialogOpen} onClose={handleCloseMasterDialog}>
        <DialogTitle>マスター認証</DialogTitle>
        <DialogContent>
          <Input
            type="password"
            placeholder="シークレット番号を入力"
            value={secretCode}
            onChange={e => setSecretCode(e.target.value)}
            fullWidth
            autoFocus
            sx={{ my: 2 }}
          />
          {masterError && <Alert severity="error" sx={{ mt: 1 }}>{masterError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMasterDialog}>キャンセル</Button>
          <Button onClick={handleMasterLogin} variant="contained">認証</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login; 