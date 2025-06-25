import { Card, CardContent, CardMedia, Typography, Box, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Recipe } from '../types';
import { Person, Update, Storefront, PushPin, PushPinOutlined, Star, StarBorder } from '@mui/icons-material';
import { useFavorites } from '../contexts/FavoriteContext';
import { usePins } from '../contexts/PinContext';
import { useUndoRedo } from '../contexts/UndoRedoContext';
// import { Timestamp } from 'firebase/firestore';

interface RecipeCardProps {
  recipe: Recipe;
}

const formatDate = (date: Date): string => {
    if (!date) return '';
    // toLocaleDateString だと環境によって '2025/1/1' のように表示されることがあるため、
    // yyyy/MM/dd 形式に整形する
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const isFavorited = isFavorite(recipe.id);
  const { isPinned, addPin, removePin } = usePins();
  const pinned = isPinned(recipe.id);
  const { pushAction } = useUndoRedo();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isFavorited) {
        await removeFavorite(recipe.id);
        pushAction({
          type: 'favorite',
          payload: { id: recipe.id },
          undo: async () => await addFavorite(recipe.id),
          redo: async () => await removeFavorite(recipe.id),
          description: 'お気に入り解除',
        });
      } else {
        await addFavorite(recipe.id);
        pushAction({
          type: 'favorite',
          payload: { id: recipe.id },
          undo: async () => await removeFavorite(recipe.id),
          redo: async () => await addFavorite(recipe.id),
          description: 'お気に入り追加',
        });
      }
    } catch (error) {
      console.error('お気に入り操作エラー:', error);
    }
  };

  const handlePinClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('ピン押下:', recipe.id);
    try {
      if (pinned) {
        await removePin(recipe.id);
        pushAction({
          type: 'pin',
          payload: { id: recipe.id },
          undo: async () => await addPin(recipe.id),
          redo: async () => await removePin(recipe.id),
          description: 'ピンを外す',
        });
      } else {
        await addPin(recipe.id);
        pushAction({
          type: 'pin',
          payload: { id: recipe.id },
          undo: async () => await removePin(recipe.id),
          redo: async () => await addPin(recipe.id),
          description: 'ピンを刺す',
        });
      }
    } catch (error) {
      console.error('ピン操作エラー:', error);
    }
  };

  return (
    <Card 
      component={RouterLink} 
      to={`/recipe/${recipe.id}`}
      sx={{ 
        height: '100%', 
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2, // 角を少し丸くする
        position: 'relative', // お気に入りボタンの位置決めのため
      }}
    >
      {/* ピンボタン */}
      <IconButton
        onClick={handlePinClick}
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          zIndex: 2,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
          },
        }}
      >
        {pinned ? (
          <PushPin sx={{ color: '#f57c00', transform: 'rotate(-30deg)' }} />
        ) : (
          <PushPinOutlined sx={{ color: '#aaa', transform: 'rotate(-30deg)' }} />
        )}
      </IconButton>
      {/* お気に入りボタン */}
      <IconButton
        onClick={handleFavoriteClick}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          zIndex: 1,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
          },
        }}
      >
        {isFavorited ? (
          <Star sx={{ color: '#FFD600' }} />
        ) : (
          <StarBorder sx={{ color: '#666' }} />
        )}
      </IconButton>

      <CardMedia
        component="img"
        height="180" // 少し高さを増やす
        image={recipe.mainImageUrl && recipe.mainImageUrl.startsWith('http') ? recipe.mainImageUrl : '/placeholder.png'}
        alt={recipe.title}
        sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }} // 画像下に細い線
      />
      <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="h2" noWrap sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
          {recipe.title}
        </Typography>
        <Box sx={{ flexGrow: 1 }} /> 
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {recipe.createdBy.name}
            </Typography>
          </Box>
          {recipe.createdBy.store && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Storefront sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {recipe.createdBy.store}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Update sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {formatDate(recipe.updatedAt)} 更新
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecipeCard; 