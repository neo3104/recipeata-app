import { Card, CardContent, CardMedia, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Recipe } from '../types';
// import { Timestamp } from 'firebase/firestore';

interface RecipeCardProps {
  recipe: Recipe;
}

const formatDate = (date: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('ja-JP');
}

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  return (
    <Card 
      component={RouterLink} 
      to={`/recipe/${recipe.id}`}
      sx={{ 
        height: '100%', 
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.03)'
        }
      }}
    >
      <CardMedia
        component="img"
        height="160"
        image={recipe.mainImageUrl || '/placeholder.png'} // プレースホルダー画像
        alt={recipe.title}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h2" noWrap>
          {recipe.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          作成者: {recipe.createdBy.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDate(recipe.updatedAt)} 更新
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RecipeCard; 