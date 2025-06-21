import { useState, useMemo } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { useUser } from '../contexts/UserContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Fab,
  Paper,
  InputBase,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search, Add, Favorite, Style, Storefront, Person, Sort } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import React from 'react';

// 文字列を正規化する関数
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    // 全角英数字を半角に変換
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    // カタカナをひらがなに変換
    .replace(/[ァ-ヶ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0x60))
    // 濁点・半濁点を正規化
    .replace(/[゛゜]/g, '')
    // 長音符を正規化
    .replace(/ー/g, '')
    // 空白文字を統一
    .replace(/\s+/g, ' ')
    .trim();
};

// 検索文字列が対象文字列に含まれているかチェック（正規化版）
const isTextMatch = (searchText: string, targetText: string): boolean => {
  const normalizedSearch = normalizeText(searchText);
  const normalizedTarget = normalizeText(targetText);
  
  // 空の検索文字列の場合は常にマッチ
  if (!normalizedSearch) return true;
  
  // 部分一致チェック
  return normalizedTarget.includes(normalizedSearch);
};

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'likes';

function RecipeList() {
  const { recipes, deleteRecipe } = useRecipes();
  const { user } = useUser();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // 検索機能（ひらがな・カタカナ、全角・半角、大文字小文字の違いを吸収）
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // メイン検索（タイトル・説明）
      const matchesTitle = isTextMatch(searchTerm, recipe.title) || 
                          isTextMatch(searchTerm, recipe.description);
      
      // タグ検索
      const matchesTag = !tagSearch || recipe.tags.some(tag => 
        isTextMatch(tagSearch, tag)
      );
      
      // 店舗検索
      const matchesStore = !storeSearch || isTextMatch(storeSearch, recipe.store);
      
      // 作者検索
      const matchesAuthor = !authorSearch || isTextMatch(authorSearch, recipe.author);

      return matchesTitle && matchesTag && matchesStore && matchesAuthor;
    });
  }, [recipes, searchTerm, tagSearch, storeSearch, authorSearch]);

  // ソート機能
  const sortedRecipes = useMemo(() => {
    const sorted = [...filteredRecipes];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      case 'oldest':
        return sorted.sort((a, b) => a.createdAt - b.createdAt);
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
      case 'likes':
        return sorted.sort((a, b) => b.likes.length - a.likes.length);
      default:
        return sorted;
    }
  }, [filteredRecipes, sortBy]);

  // ページネーション
  const totalPages = Math.ceil(sortedRecipes.length / settings.recipesPerPage);
  const startIndex = (currentPage - 1) * settings.recipesPerPage;
  const endIndex = startIndex + settings.recipesPerPage;
  const currentRecipes = sortedRecipes.slice(startIndex, endIndex);

  const handleDelete = (id: string) => {
    if (confirm('このレシピを削除しますか？')) {
      deleteRecipe(id);
    }
  };

  const handleSortChange = (event: SelectChangeEvent<SortOption>) => {
    setSortBy(event.target.value as SortOption);
    setCurrentPage(1); // ソート変更時は1ページ目に戻る
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  // 検索条件が変更されたら1ページ目に戻る
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tagSearch, storeSearch, authorSearch]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヒーローユニット */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
          borderRadius: 3,
          p: 6,
          mb: 4,
          textAlign: 'center',
          color: 'white',
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          レシピ管理アプリ
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          おいしいレシピを管理して、料理をもっと楽しく
        </Typography>
      </Box>

      {/* 検索バー */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="レシピ名や説明を検索（ひらがな・カタカナ・全角・半角対応）"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'background.paper',
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          例：「カレー」「ｃｕｒｒｙ」「カレー」で同じ結果が表示されます
        </Typography>
      </Box>

      {/* 詳細検索 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          詳細検索
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Paper component="form" sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: '100%' }}>
              <IconButton sx={{ p: '10px' }} aria-label="tag-search">
                <Style />
              </IconButton>
              <InputBase 
                sx={{ ml: 1, flex: 1 }} 
                placeholder="タグ検索（例：和食、洋食）" 
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
            </Paper>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Paper component="form" sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: '100%' }}>
              <IconButton sx={{ p: '10px' }} aria-label="store-search">
                <Storefront />
              </IconButton>
              <InputBase 
                sx={{ ml: 1, flex: 1 }} 
                placeholder="店舗検索（例：○○店、○○レストラン）" 
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
              />
            </Paper>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Paper component="form" sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: '100%' }}>
              <IconButton sx={{ p: '10px' }} aria-label="author-search">
                <Person />
              </IconButton>
              <InputBase 
                sx={{ ml: 1, flex: 1 }} 
                placeholder="作者検索（例：田中、たなか）" 
                value={authorSearch}
                onChange={(e) => setAuthorSearch(e.target.value)}
              />
            </Paper>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Paper component="form" sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: '100%' }}>
              <IconButton sx={{ p: '10px' }} aria-label="clear-search">
                <Search />
              </IconButton>
              <InputBase 
                sx={{ ml: 1, flex: 1 }} 
                placeholder="検索クリア" 
                value=""
                onClick={() => {
                  setSearchTerm('');
                  setTagSearch('');
                  setStoreSearch('');
                  setAuthorSearch('');
                }}
                readOnly
              />
            </Paper>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          検索のヒント：ひらがな・カタカナ、全角・半角、大文字・小文字の違いは自動で対応されます
        </Typography>
      </Box>

      {/* ソートとページネーション情報 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>並び順</InputLabel>
          <Select
            value={sortBy}
            label="並び順"
            onChange={handleSortChange}
            startAdornment={<Sort sx={{ mr: 1 }} />}
          >
            <MenuItem value="newest">新しい順</MenuItem>
            <MenuItem value="oldest">古い順</MenuItem>
            <MenuItem value="alphabetical">あいうえお順</MenuItem>
            <MenuItem value="likes">いいね順</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          全{filteredRecipes.length}件中 {startIndex + 1}-{Math.min(endIndex, filteredRecipes.length)}件を表示
        </Typography>
      </Box>

      {/* レシピ一覧 */}
      {currentRecipes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm || tagSearch || storeSearch || authorSearch ? '検索結果が見つかりませんでした' : 'まだレシピがありません'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || tagSearch || storeSearch || authorSearch ? '別のキーワードで検索してみてください' : '最初のレシピを追加してみましょう！'}
          </Typography>
          {(searchTerm || tagSearch || storeSearch || authorSearch) && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                検索条件：
                {searchTerm && ` 「${searchTerm}」`}
                {tagSearch && ` タグ：「${tagSearch}」`}
                {storeSearch && ` 店舗：「${storeSearch}」`}
                {authorSearch && ` 作者：「${authorSearch}」`}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <>
          {/* 検索結果サマリー */}
          {(searchTerm || tagSearch || storeSearch || authorSearch) && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
              <Typography variant="body2">
                検索結果：{filteredRecipes.length}件
                {searchTerm && ` 「${searchTerm}」`}
                {tagSearch && ` タグ：「${tagSearch}」`}
                {storeSearch && ` 店舗：「${storeSearch}」`}
                {authorSearch && ` 作者：「${authorSearch}」`}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {currentRecipes.map((recipe) => (
              <Box key={recipe.id} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={recipe.mainImageUrl || '/placeholder-recipe.jpg'}
                    alt={recipe.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="h2">
                      {recipe.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {recipe.description}
                    </Typography>
                    
                    {/* いいね数表示 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Favorite sx={{ color: 'error.main', fontSize: 20, mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {recipe.likes.length}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {recipe.tags.slice(0, 3).map((tag, index) => (
                        <Chip key={index} label={tag} size="small" />
                      ))}
                      {recipe.tags.length > 3 && (
                        <Chip label={`+${recipe.tags.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      調理時間: {recipe.totalTime} | 人数: {recipe.servings}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      投稿者: {recipe.author} ({recipe.store})
                    </Typography>
                  </CardContent>
                  {user && recipe.author === user.name && recipe.store === user.store && (
                    <CardActions sx={{ justifyContent: 'center' }}>
                      <Button 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit-recipe/${recipe.id}`);
                        }}
                      >
                        編集
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(recipe.id);
                        }}
                      >
                        削除
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Box>
            ))}
          </Box>

          {/* ページネーション */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default RecipeList; 