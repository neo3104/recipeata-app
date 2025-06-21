import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useSettings } from '../contexts/SettingsContext';
import { useRecipes } from '../contexts/RecipeContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { Favorite } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`recipe-tabpanel-${index}`}
      aria-labelledby={`recipe-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function MyPage() {
  const { user, setUser } = useUser();
  const { settings, updateNotificationSettings } = useSettings();
  const { getMyRecipes, getLikedRecipes, getRecentlyViewed } = useRecipes();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setStore(user.store);
    }
  }, [user]);

  const handleSave = () => {
    if (user) {
      setUser({ ...user, name, store });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!user) {
    return <Typography>ユーザー情報がありません。</Typography>;
  }

  const { notifications } = settings;
  const myRecipes = getMyRecipes(user.name, user.store);
  const likedRecipes = getLikedRecipes(user.name, user.store);
  const recentlyViewedRecipes = getRecentlyViewed();

  const handleSwitchChange = (key: keyof typeof notifications) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateNotificationSettings({ [key]: event.target.checked });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <Container maxWidth="lg">
      {/* プロフィール設定 */}
      <Paper
        elevation={3}
        sx={{ mt: 8, p: 4, mb: 4 }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          マイページ
        </Typography>
        <Typography paragraph color="text.secondary">
          ここで設定した名前と店舗名は、レシピの「作者名」「店舗名」の初期値として自動で入力されます。
        </Typography>
        <Box component="form">
          <TextField
            label="名前"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="所属店舗"
            variant="outlined"
            fullWidth
            value={store}
            onChange={(e) => setStore(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            fullWidth
            size="large"
          >
            保存
          </Button>
          {isSaved && (
            <Typography color="success.main" sx={{ mt: 2 }}>
              保存しました！
            </Typography>
          )}
        </Box>
      </Paper>

      {/* レシピ管理セクション */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="recipe tabs">
            <Tab label={`MYレシピ (${myRecipes.length})`} />
            <Tab label={`いいねしたレシピ (${likedRecipes.length})`} />
            <Tab label={`最近見たレシピ (${recentlyViewedRecipes.length})`} />
          </Tabs>
        </Box>

        {/* MYレシピ */}
        <TabPanel value={tabValue} index={0}>
          {myRecipes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                まだレシピを作成していません
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/add-recipe')}
                sx={{ mt: 2 }}
              >
                最初のレシピを作成
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {myRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' }
                    }}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={recipe.mainImageUrl || '/placeholder-recipe.jpg'}
                      alt={recipe.title}
                    />
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {recipe.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {recipe.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Favorite sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                        <Typography variant="caption">{recipe.likes.length}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        作成日: {formatDate(recipe.createdAt)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* いいねしたレシピ */}
        <TabPanel value={tabValue} index={1}>
          {likedRecipes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                まだいいねしたレシピがありません
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {likedRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' }
                    }}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={recipe.mainImageUrl || '/placeholder-recipe.jpg'}
                      alt={recipe.title}
                    />
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {recipe.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {recipe.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Favorite sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                        <Typography variant="caption">{recipe.likes.length}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        投稿者: {recipe.author} ({recipe.store})
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* 最近見たレシピ */}
        <TabPanel value={tabValue} index={2}>
          {recentlyViewedRecipes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                まだレシピを見ていません
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {recentlyViewedRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' }
                    }}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={recipe.mainImageUrl || '/placeholder-recipe.jpg'}
                      alt={recipe.title}
                    />
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {recipe.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {recipe.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Favorite sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                        <Typography variant="caption">{recipe.likes.length}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        投稿者: {recipe.author} ({recipe.store})
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* 通知設定セクション */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          通知設定
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <FormControlLabel
          control={
            <Switch
              checked={notifications.recipeAdded}
              onChange={handleSwitchChange('recipeAdded')}
              color="primary"
            />
          }
          label="レシピが追加されたとき通知"
        />
        <FormControlLabel
          control={
            <Switch
              checked={notifications.recipeEdited}
              onChange={handleSwitchChange('recipeEdited')}
              color="primary"
            />
          }
          label="レシピが編集されたとき通知"
        />
        <FormControlLabel
          control={
            <Switch
              checked={notifications.recipeLiked}
              onChange={handleSwitchChange('recipeLiked')}
              color="primary"
            />
          }
          label="レシピにいいねがついたとき通知"
        />
        <FormControlLabel
          control={
            <Switch
              checked={notifications.recipeCommented}
              onChange={handleSwitchChange('recipeCommented')}
              color="primary"
            />
          }
          label="レシピにコメントがついたとき通知"
        />
      </Paper>
    </Container>
  );
}

export default MyPage; 