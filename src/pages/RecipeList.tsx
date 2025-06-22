import React, { useState, useMemo, useContext } from 'react';
import { RecipeContext } from '../contexts/RecipeContext';
import { UserContext } from '../contexts/UserContext';

import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Fab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search, Add, Person, Sort, Storefront, Tag } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RecipeCard from '../components/RecipeCard';
import { normalizeText } from '../utils/textUtils';

type SortOption = 'newest' | 'oldest' | 'likes';

export default function RecipeList() {
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

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 9; // 1ページあたりのレシピ数

  const filteredRecipes = useMemo(() => {
    const normalizedSearchTerm = normalizeText(searchTerm);
    const normalizedAuthorSearch = normalizeText(authorSearch);
    const normalizedStoreSearch = normalizeText(storeSearch);
    const normalizedTagSearch = normalizeText(tagSearch);

    return recipes.filter(recipe => {
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
  }, [recipes, searchTerm, authorSearch, storeSearch, tagSearch]);

  const sortedRecipes = useMemo(() => {
    const sorted = [...filteredRecipes];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case 'oldest':
        return sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      case 'likes':
        return sorted.sort((a, b) => b.likes.length - a.likes.length);
      default:
        return sorted;
    }
  }, [filteredRecipes, sortBy]);

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
  }, [searchTerm, authorSearch, storeSearch, tagSearch]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          レシピ一覧
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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