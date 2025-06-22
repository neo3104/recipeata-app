import { useState, useEffect, useMemo, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { RecipeContext } from '../contexts/RecipeContext';
import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import RecipeCard from '../components/RecipeCard';
import type { Recipe } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';

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
      id={`mypage-tabpanel-${index}`}
      aria-labelledby={`mypage-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            {children}
          </Grid>
        </Box>
      )}
    </div>
  );
}

const MyPage = () => {
  const userContext = useContext(UserContext);
  const recipeContext = useContext(RecipeContext);
  const navigate = useNavigate();

  if (!userContext || !recipeContext) {
    return <p>読み込み中...</p>;
  }

  const { user, updateUserProfile } = userContext;
  const { recipes, loading: recipesLoading } = recipeContext;

  const [tabValue, setTabValue] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [store, setStore] = useState(user?.store || "");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setStore(user.store || "");
    }
  }, [user]);

  const myRecipes = useMemo(() => {
    if (!user) return [];
    return recipes.filter((recipe) => recipe.createdById === user.id);
  }, [recipes, user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    try {
      await updateUserProfile({ displayName, store });
      alert("プロフィールを更新しました");
    } catch (error) {
      console.error("プロフィールの更新に失敗しました:", error);
      alert("プロフィールの更新に失敗しました。");
    }
  };

  if (recipesLoading) {
    return <p>レシピを読み込んでいます...</p>;
  }

  if (!user) {
    return (
      <Container>
        <Typography>ログインしてください。</Typography>
      </Container>
    );
  }

  return (
    <div>
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            マイページ
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
          >
            レシピ一覧へ
          </Button>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Avatar
            src={user.photoURL || undefined}
            alt={user.displayName}
            sx={{ width: 80, height: 80, mr: 2 }}
          />
          <Typography variant="h5">{user.displayName}</Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="mypage tabs"
          >
            <Tab label="作成したレシピ" />
            <Tab label="プロフィール編集" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {myRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                  <RecipeCard recipe={recipe} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Box component="form" sx={{ mt: 3 }} noValidate autoComplete="off">
            <Typography variant="h6" gutterBottom>
              プロフィール情報
            </Typography>
            <TextField
              label="名前"
              fullWidth
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="所属店舗"
              fullWidth
              value={store}
              onChange={(e) => setStore(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleProfileUpdate}
            >
              保存
            </Button>
          </Box>
        </TabPanel>
      </Container>
    </div>
  );
}

export default MyPage; 