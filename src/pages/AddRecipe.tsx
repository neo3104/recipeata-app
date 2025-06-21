import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useRecipes } from '../contexts/RecipeContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline, PhotoCamera, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

// 材料の型定義
interface Ingredient {
  id: number;
  name: string;
  quantity: string;
}

// 作り方のステップの型定義
interface Step {
  id: number;
  description: string;
  image: File | null;
  imageUrl: string | null;
}

function AddRecipe() {
  const { user } = useUser();
  const { addRecipe } = useRecipes();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [totalTime, setTotalTime] = useState('');
  const [servings, setServings] = useState('');
  const [advice, setAdvice] = useState('');
  const [author, setAuthor] = useState('');
  const [store, setStore] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: Date.now(), name: '', quantity: '' }]);
  const [steps, setSteps] = useState<Step[]>([{ id: Date.now(), description: '', image: null, imageUrl: null }]);

  useEffect(() => {
    // マイページで設定した値を初期値として設定
    if (user) {
      setAuthor(user.name);
      setStore(user.store);
    }
  }, [user]);

  // メイン画像のハンドラー
  const handleMainImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImage(file);
      setMainImageUrl(URL.createObjectURL(file));
    }
  };
  const handleRemoveMainImage = () => {
    if(mainImageUrl) URL.revokeObjectURL(mainImageUrl);
    setMainImage(null);
    setMainImageUrl(null);
  }

  // 材料のハンドラー
  const handleIngredientChange = (id: number, field: keyof Omit<Ingredient, 'id'>, value: string) => {
    setIngredients(ingredients.map(ing => (ing.id === id ? { ...ing, [field]: value } : ing)));
  };
  const handleAddIngredient = () => {
    setIngredients([...ingredients, { id: Date.now(), name: '', quantity: '' }]);
  };
  const handleRemoveIngredient = (id: number) => {
    setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
  };

  // 作り方のハンドラー
  const handleStepChange = (id: number, value: string) => {
    setSteps(steps.map(step => (step.id === id ? { ...step, description: value } : step)));
  };
  const handleAddStep = () => {
    setSteps([...steps, { id: Date.now(), description: '', image: null, imageUrl: null }]);
  };
  const handleStepImageChange = (id: number, e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSteps(steps.map(step => (step.id === id ? { ...step, image: file, imageUrl: URL.createObjectURL(file) } : step)));
    }
  }
  const handleRemoveStepImage = (id: number) => {
    setSteps(steps.map(step => {
      if(step.id === id && step.imageUrl) {
        URL.revokeObjectURL(step.imageUrl);
        return { ...step, image: null, imageUrl: null };
      }
      return step;
    }));
  }

  const handleRemoveStep = (id: number) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && newTag.trim() !== '') {
      event.preventDefault();
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };


  const handleSubmit = () => {
    if (!title.trim()) {
      alert('レシピ名を入力してください');
      return;
    }

    const recipeData = {
      title: title.trim(),
      description: description.trim(),
      mainImage,
      mainImageUrl,
      totalTime,
      servings,
      advice,
      author,
      store,
      tags,
      ingredients: ingredients.filter(ing => ing.name.trim() && ing.quantity.trim()),
      steps: steps.filter(step => step.description.trim()),
    };

    addRecipe(recipeData);
    navigate('/');
  };

  return (
    <Box sx={{ pb: 8 }}>
      <AppBar position="sticky" color="inherit" sx={{ boxShadow: 'none', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            component={RouterLink}
            to="/"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            新しいレシピを追加
          </Typography>
          <Button color="primary" variant="contained">保存</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>

          {/* タイトル */}
          <Typography variant="h5" gutterBottom>レシピのタイトル</Typography>
          <TextField
            label="例：究極のカルボナーラ"
            fullWidth
            margin="normal"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Divider sx={{ my: 4 }} />

          {/* 完成写真 */}
          <Typography variant="h5" gutterBottom>完成写真</Typography>
          {!mainImageUrl ? (
            <Button
              variant="outlined"
              component="label"
              sx={{
                width: '100%',
                height: 200,
                borderStyle: 'dashed',
                borderWidth: '2px',
                flexDirection: 'column',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              <PhotoCamera sx={{ fontSize: 40, color: 'grey.600' }}/>
              <Typography sx={{ color: 'grey.600' }}>クリックして写真をアップロード</Typography>
              <input type="file" accept="image/*" hidden onChange={handleMainImageChange} />
            </Button>
          ) : (
            <Box sx={{ position: 'relative', width: '100%', pt: '56.25%' /* 16:9 Aspect Ratio */ }}>
              <IconButton
                aria-label="delete"
                onClick={handleRemoveMainImage}
                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.5)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)'} }}
              >
                <DeleteIcon sx={{ color: 'white' }} />
              </IconButton>
              <img
                src={mainImageUrl}
                alt="Recipe preview"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 4
                }}
              />
            </Box>
          )}

          <Divider sx={{ my: 4 }} />

          {/* 材料 */}
          <Typography variant="h5" gutterBottom>材料</Typography>
          {ingredients.map((ingredient, index) => (
             <Box key={ingredient.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  label={`材料 ${index + 1}`}
                  placeholder="例：豚バラ肉"
                  variant="outlined"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(ingredient.id, 'name', e.target.value)}
                  sx={{ mr: 2, flex: 3 }}
                />
                <TextField
                  label="分量"
                  placeholder="例：200g"
                  variant="outlined"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(ingredient.id, 'quantity', e.target.value)}
                  sx={{ mr: 2, flex: 2 }}
                />
                {ingredients.length > 1 && (
                  <IconButton onClick={() => handleRemoveIngredient(ingredient.id)} aria-label="delete ingredient">
                    <DeleteIcon />
                  </IconButton>
                )}
             </Box>
          ))}
          <Button variant="outlined" onClick={handleAddIngredient}>
            材料を追加
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 4 }}>
            <Typography variant="h6" sx={{ mr: 2, whiteSpace: 'nowrap' }}>合計:</Typography>
            <TextField
              variant="outlined"
              fullWidth
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
            />
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* 作り方 */}
          <Typography variant="h5" gutterBottom>作り方</Typography>
          {steps.map((step, index) => (
            <Box key={step.id} sx={{ mb: 3, display: 'flex', alignItems: 'flex-start' }}>
              <Typography variant="h6" sx={{ mr: 2, mt: 3 }}>{index + 1}.</Typography>
              <Box sx={{ flexGrow: 1 }}>
                <TextField
                  label={`ステップ ${index + 1}`}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="調理手順をここに入力します"
                  value={step.description}
                  onChange={(e) => handleStepChange(step.id, e.target.value)}
                />
                {!step.imageUrl ? (
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoCamera />}
                    sx={{mt: 1}}
                  >
                    画像をアップロード
                    <input type="file" accept="image/*" hidden onChange={(e) => handleStepImageChange(step.id, e)} />
                  </Button>
                ) : (
                  <Box sx={{ position: 'relative', width: 150, height: 100, mt: 1 }}>
                     <IconButton
                        aria-label="delete"
                        onClick={() => handleRemoveStepImage(step.id)}
                        size="small"
                        sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.5)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)'} }}
                      >
                        <DeleteIcon fontSize="small" sx={{ color: 'white' }} />
                      </IconButton>
                    <img
                      src={step.imageUrl}
                      alt={`Step ${index + 1} preview`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                    />
                  </Box>
                )}
              </Box>
              {steps.length > 1 && (
                 <IconButton onClick={() => handleRemoveStep(step.id)} sx={{ml: 1, mt: 3}} aria-label="delete step">
                    <DeleteIcon />
                 </IconButton>
              )}
            </Box>
          ))}

          <Button variant="outlined" onClick={handleAddStep}>
            ステップを追加
          </Button>

          <Divider sx={{ my: 4 }} />

          {/* ワンポイントアドバイス */}
          <Typography variant="h5" gutterBottom>ワンポイントアドバイス</Typography>
          <TextField
            label="調理のコツやポイント"
            placeholder="例：弱火でじっくり火を通すのが美味しくなる秘訣です！"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            variant="outlined"
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
          />

          <Divider sx={{ my: 4 }} />

          {/* その他の情報 */}
          <Typography variant="h5" gutterBottom>その他の情報</Typography>
          <TextField
            label="作者名"
            placeholder="例：レシピの太郎さん"
            fullWidth
            margin="normal"
            variant="outlined"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <TextField
            label="店舗名"
            placeholder="例：レストランRecipeata"
            fullWidth
            margin="normal"
            variant="outlined"
            value={store}
            onChange={(e) => setStore(e.target.value)}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                color="primary"
              />
            ))}
          </Box>
          <TextField
            label="新しいタグを追加してEnter"
            variant="outlined"
            fullWidth
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 4 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Button variant="contained" onClick={handleSubmit}>
              レシピを保存
            </Button>
          </Box>

        </Paper>
      </Container>
    </Box>
  );
}

export default AddRecipe; 