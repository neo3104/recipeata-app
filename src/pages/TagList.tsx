import { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecipeContext } from '../contexts/RecipeContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  Container,
  Typography,
  Box,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import { Search, Tag } from '@mui/icons-material';
import { usePagination } from '../hooks/usePagination';

export default function TagList() {
  const navigate = useNavigate();
  const recipeContext = useContext(RecipeContext);
  const { settings } = useSettings();
  
  if (!recipeContext) {
    throw new Error("RecipeContext is not provided");
  }
  
  const { recipes, loading, error } = recipeContext;
  const [searchTerm, setSearchTerm] = useState('');

  // 全てのタグを抽出し、使用回数をカウント
  const tagStats = useMemo(() => {
    const tagCount: { [key: string]: number } = {};
    
    recipes.forEach(recipe => {
      if (recipe.tags) {
        recipe.tags.forEach(tag => {
          if (tag.trim()) {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count); // 使用回数順にソート
  }, [recipes]);

  // 検索フィルター
  const filteredTags = useMemo(() => {
    if (!searchTerm) return tagStats;
    
    return tagStats.filter(({ tag }) => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tagStats, searchTerm]);

  // usePaginationでページネーション
  const {
    currentPage: tagPage,
    totalPages: tagTotalPages,
    paginatedData: paginatedTags,
    setCurrentPage: setTagPage
  } = usePagination(filteredTags, settings.tagsPerPage);

  const handleTagClick = (tag: string) => {
    // レシピ一覧ページに戻り、そのタグで検索
    navigate(`/?tag=${encodeURIComponent(tag)}`);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ my: 4 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          fontWeight: 'bold',
          color: '#f57c00'
        }}>
          <Tag sx={{ fontSize: '2rem' }} />
          全てのタグ
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          レシピで使用されている全てのタグを表示しています。タグをクリックすると、そのタグでレシピを検索できます。
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <TextField
            fullWidth
            label="タグを検索"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Typography variant="h6" gutterBottom>
            タグ一覧 ({filteredTags.length}件)
          </Typography>

          {filteredTags.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {searchTerm ? '該当するタグが見つかりませんでした。' : 'タグがありません。'}
            </Typography>
          ) : (
            <>
              <Grid container spacing={2}>
                {paginatedTags.map(({ tag, count }) => (
                  <Grid item key={tag}>
                    <Chip
                      label={`${tag} (${count})`}
                      onClick={() => handleTagClick(tag)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#f57c00',
                          color: 'white',
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
              {tagTotalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={tagTotalPages}
                    page={tagPage}
                    onChange={(_, page) => setTagPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Paper>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            タグをクリックすると、そのタグが付いたレシピ一覧に移動します。
          </Typography>
        </Box>
      </Box>
    </Container>
  );
} 