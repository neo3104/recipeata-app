import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RecipeContext } from '../contexts/RecipeContext';
import { UserContext } from '../contexts/UserContext';
import { useFavorites } from '../contexts/FavoriteContext';
import { usePins } from '../contexts/PinContext';

import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
  Button,
  Chip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search, Sort, Storefront, Tag, Person, List, Favorite, Clear, PushPinOutlined } from '@mui/icons-material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import RecipeCard from '../components/RecipeCard';
import { normalizeText } from '../utils/textUtils';

type SortOption = 'newest' | 'oldest' | 'likes';

export default function RecipeList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipeContext = useContext(RecipeContext);
  if (!recipeContext) {
    throw new Error("RecipeContext is not provided");
  }
  const { recipes, loading, error } = recipeContext;

  const userContext = useContext(UserContext);
    if (!userContext) {
    throw new Error("UserContext is not provided");
  }
  const { user } = userContext;

  const { favorites } = useFavorites();
  const { pins, removeAllPins } = usePins();

  const [searchTerm, setSearchTerm] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 9; // 1ページあたりのレシピ数

  // URLパラメータからタグ検索を自動設定
  useEffect(() => {
    const tagParam = searchParams.get('tag');
    if (tagParam) {
      setTagSearch(decodeURIComponent(tagParam));
    }
  }, [searchParams]);

  const filteredRecipes = useMemo(() => {
    const normalizedSearchTerm = normalizeText(searchTerm);
    const normalizedAuthorSearch = normalizeText(authorSearch);
    const normalizedStoreSearch = normalizeText(storeSearch);
    const normalizedTagSearch = normalizeText(tagSearch);

    return recipes.filter(recipe => {
      // お気に入りのみ表示フィルター
      if (showFavoritesOnly && !favorites.includes(recipe.id)) {
        return false;
      }

      const content = normalizeText(`${recipe.title} ${recipe.description}`);
      const matchesKeyword = content.includes(normalizedSearchTerm);

      const author = normalizeText(recipe.createdBy?.name);
      const matchesAuthor = !normalizedAuthorSearch || author.includes(normalizedAuthorSearch);
      
      const store = normalizeText(recipe.createdBy?.store);
      const matchesStore = !normalizedStoreSearch || store.includes(normalizedStoreSearch);

      const tags = recipe.tags?.map(normalizeText).join(' ');
      const matchesTag = !normalizedTagSearch || (tags && tags.includes(normalizedTagSearch));

      return matchesKeyword && matchesAuthor && matchesStore && matchesTag;
    });
  }, [recipes, searchTerm, authorSearch, storeSearch, tagSearch, showFavoritesOnly, favorites]);

  const sortedRecipes = useMemo(() => {
    // まず従来のソート順で並べる
    let sorted = [...filteredRecipes];
    switch (sortBy) {
      case 'newest':
        sorted = sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'oldest':
        sorted = sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'likes':
        sorted = sorted.sort((a, b) => b.likes.length - a.likes.length);
        break;
      default:
        break;
    }
    // ピン刺しレシピを最上部に（pins配列の順番を維持）
    const pinSet = new Set(pins);
    const pinned = pins
      .map(pinId => sorted.find(r => r.id === pinId))
      .filter(Boolean) as typeof sorted;
    const unpinned = sorted.filter(r => !pinSet.has(r.id));
    return [...pinned, ...unpinned];
  }, [filteredRecipes, sortBy, pins]);

  const totalPages = Math.ceil(sortedRecipes.length / recipesPerPage);
  const paginatedRecipes = sortedRecipes.slice(
    (currentPage - 1) * recipesPerPage,
    currentPage * recipesPerPage
  );

  const handleSortChange = (event: SelectChangeEvent<SortOption>) => {
    setSortBy(event.target.value as SortOption);
    setCurrentPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, authorSearch, storeSearch, tagSearch, showFavoritesOnly]);

  return (
    <Container maxWidth="lg" sx={{ py: 4, pt: undefined, pb: undefined }}>
      {/* タイトル・ユーザー情報部分だけ背景画像 */}
      <Box sx={{
        position: 'relative',
        width: '100%',
        minHeight: 180,
        mb: 4,
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {/* 背景画像 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url(https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg?auto=compress&w=1500&q=80)',
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
            background: 'linear-gradient(135deg, rgba(0,0,0,0.18) 0%, rgba(255,183,77,0.10) 100%)',
            zIndex: 1,
          }}
        />
        {/* タイトル・ユーザー情報 */}
        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', height: 180, px: 4 }}>
          <Paper
            elevation={2}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.7)',
              m: 0,
              minWidth: 180,
              flexShrink: 0,
              mr: 2,
            }}
          >
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{
                fontWeight: 'bold',
                background: (theme) => 
                  `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                m: 0,
              }}
            >
              レシピ一覧
            </Typography>
            <RestaurantMenuIcon sx={{ fontSize: 36, color: 'primary.main', mx: 2 }} />
          </Paper>
          {user && (
            <Paper 
              elevation={2} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                p: 1.5, 
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.7)',
                m: 0,
                minWidth: 120,
                flexShrink: 0,
              }}
            >
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40,
                  bgcolor: 'grey.400',
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  },
                }} 
                src={user.photoURL || undefined} 
              />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold', m: 0 }}>
                  {user.displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ m: 0 }}>
                  {user.store}
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
      <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1, ml: 1 }}>
        みんなのレシピを探そう！
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 4, mt: 0 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
          <TextField
            label="キーワード検索"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ flexGrow: 1, minWidth: '200px' }}
          />
          <TextField
            label="作者で検索"
            variant="outlined"
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }}
            sx={{ flexGrow: 1, minWidth: '200px' }}
          />
          <TextField
            label="店舗で検索"
            variant="outlined"
            value={storeSearch}
            onChange={(e) => setStoreSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Storefront /></InputAdornment> }}
            sx={{ flexGrow: 1, minWidth: '200px' }}
          />
          <TextField
            label="タグで検索"
            variant="outlined"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Tag /></InputAdornment> }}
            sx={{ flexGrow: 1, minWidth: '200px' }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl variant="outlined" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-by-label">ソート</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
              onChange={handleSortChange}
              label="ソート"
              startAdornment={<InputAdornment position="start"><Sort /></InputAdornment>}
            >
              <MenuItem value="newest">新着順</MenuItem>
              <MenuItem value="oldest">古い順</MenuItem>
              <MenuItem value="likes">いいね順</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant={showFavoritesOnly ? "contained" : "outlined"}
            startIcon={<Favorite />}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            sx={{ 
              minWidth: 'auto',
              px: 2,
              borderColor: 'primary.main',
              color: showFavoritesOnly ? 'white' : 'primary.main',
              backgroundColor: showFavoritesOnly ? 'primary.main' : 'transparent',
              '&:hover': {
                backgroundColor: showFavoritesOnly ? 'primary.dark' : 'primary.main',
                color: 'white',
              }
            }}
          >
            お気に入りのみ
          </Button>
          {showFavoritesOnly && (
            <Chip
              label={`${favorites.length}件のお気に入り`}
              color="primary"
              variant="outlined"
              onDelete={() => setShowFavoritesOnly(false)}
              sx={{ ml: 1 }}
            />
          )}
          <Button
            variant="outlined"
            startIcon={<List />}
            onClick={() => navigate('/tags')}
            sx={{ 
              minWidth: 'auto',
              px: 2,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
              }
            }}
          >
            全てのタグ
          </Button>
          <Button
            variant="outlined"
            startIcon={<PushPinOutlined />}
            onClick={removeAllPins}
            disabled={pins.length === 0}
            sx={{ 
              minWidth: 'auto',
              px: 2,
              borderColor: 'grey.400',
              color: pins.length === 0 ? 'grey.400' : 'grey.700',
              '&:hover': {
                backgroundColor: 'grey.100',
                color: 'primary.main',
              }
            }}
          >
            ピンを全て外す
          </Button>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={() => setTagSearch('')}
            sx={{ 
              minWidth: 'auto',
              px: 2,
              borderColor: 'grey.400',
              color: 'grey.700',
              '&:hover': {
                backgroundColor: 'grey.100',
                color: 'primary.main',
              }
            }}
          >
            タグ検索リセット
          </Button>
        </Box>
      </Paper>
      
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && (
        <>
          <Grid container spacing={4}>
            {paginatedRecipes.map((recipe) => (
              <Grid item key={recipe.id} xs={12} sm={6} md={4}>
                <RecipeCard recipe={recipe} />
              </Grid>
            ))}
          </Grid>
          {paginatedRecipes.length === 0 && (
            <Typography sx={{ textAlign: 'center', my: 4 }}>
              該当するレシピは見つかりませんでした。
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            )}
          </Box>
        </>
      )}
    </Container>
  );
} 