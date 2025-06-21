import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Alert,
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline, PhotoCamera, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface Ingredient {
  id: number;
  name: string;
  quantity: string;
}

interface Step {
  id: number;
  description: string;
  image: File | null;
  imageUrl: string | null;
}

function EditRecipe() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const { recipes, updateRecipe, deleteRecipe } = useRecipes();
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
  const [error, setError] = useState('');

  const recipe = recipes.find(r => r.id === id);

  useEffect(() => {
    if (!recipe) {
      setError('レシピが見つかりませんでした');
      return;
    }

    // 編集権限チェック
    if (recipe.author !== user?.name || recipe.store !== user?.store) {
      setError('このレシピを編集する権限がありません');
      return;
    }

    // レシピデータをフォームに設定
    setTitle(recipe.title);
    setDescription(recipe.description);
    setMainImageUrl(recipe.mainImageUrl);
    setTotalTime(recipe.totalTime);
    setServings(recipe.servings);
    setAdvice(recipe.advice);
    setAuthor(recipe.author);
    setStore(recipe.store);
    setTags(recipe.tags);
    setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ id: Date.now(), name: '', quantity: '' }]);
    setSteps(recipe.steps.length > 0 ? recipe.steps : [{ id: Date.now(), description: '', image: null, imageUrl: null }]);
  }, [recipe, user]);

  const handleMainImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMainImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStepImageChange = (stepId: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSteps(steps.map(step => 
          step.id === stepId 
            ? { ...step, image: file, imageUrl: e.target?.result as string }
            : step
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { id: Date.now(), name: '', quantity: '' }]);
  };

  const handleRemoveIngredient = (id: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
    }
  };

  const handleIngredientChange = (id: number, field: 'name' | 'quantity', value: string) => {
    setIngredients(ingredients.map(ingredient =>
      ingredient.id === id ? { ...ingredient, [field]: value } : ingredient
    ));
  };

  const handleAddStep = () => {
    setSteps([...steps, { id: Date.now(), description: '', image: null, imageUrl: null }]);
  };

  const handleRemoveStep = (id: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== id));
    }
  };

  const handleStepChange = (id: number, field: 'description', value: string) => {
    setSteps(steps.map(step =>
      step.id === id ? { ...step, [field]: value } : step
    ));
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

    if (!recipe) {
      alert('レシピが見つかりませんでした');
      return;
    }

    const recipeData = {
      ...recipe,
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

    updateRecipe(recipeData);
    navigate(`/recipe/${recipe.id}`);
  };

  const handleDelete = () => {
    if (!recipe) {
      alert('レシピが見つかりませんでした');
      return;
    }
    
    // 削除権限チェック
    if (recipe.author !== user?.name || recipe.store !== user?.store) {
      alert('このレシピを削除する権限がありません。同じ店舗のレシピのみ削除できます。');
      return;
    }
    
    if (confirm('このレシピを削除してもよろしいですか？')) {
      deleteRecipe(recipe.id);
      navigate('/');
    }
  };

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/')}>
            レシピ一覧に戻る
          </Button>
        </Box>
      </Container>
    );
  }

  if (!recipe) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" gutterBottom>
            レシピを読み込み中...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            レシピを編集
          </Typography>
          <Button color="error" onClick={handleDelete}>
            削除
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            レシピを編集
          </Typography>

          {/* 基本情報 */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            基本情報
          </Typography>
          <TextField
            label="レシピ名"
            variant="outlined"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="レシピの説明"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* メイン画像 */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            完成写真
          </Typography>
          <Box sx={{ mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="main-image-upload"
              type="file"
              onChange={handleMainImageChange}
            />
            <label htmlFor="main-image-upload">
              <Button variant="outlined" component="span" startIcon={<PhotoCamera />}>
                画像を選択
              </Button>
            </label>
          </Box>
          {mainImageUrl && (
            <Box sx={{ mb: 2 }}>
              <img
                src={mainImageUrl}
                alt="完成写真"
                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
              />
            </Box>
          )}

          {/* 調理時間・分量 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="調理時間"
              variant="outlined"
              fullWidth
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
            />
            <TextField
              label="分量"
              variant="outlined"
              fullWidth
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </Box>

          {/* ワンポイントアドバイス */}
          <TextField
            label="ワンポイントアドバイス"
            variant="outlined"
            fullWidth
            multiline
            rows={2}
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* 作者・店舗情報 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="作者名"
              variant="outlined"
              fullWidth
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <TextField
              label="店舗名"
              variant="outlined"
              fullWidth
              value={store}
              onChange={(e) => setStore(e.target.value)}
            />
          </Box>

          {/* タグ */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            タグ
          </Typography>
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

          {/* 材料 */}
          <Typography variant="h6" gutterBottom>
            材料
          </Typography>
          {ingredients.map((ingredient, index) => (
            <Box key={ingredient.id} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <TextField
                label="材料名"
                variant="outlined"
                fullWidth
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(ingredient.id, 'name', e.target.value)}
              />
              <TextField
                label="分量"
                variant="outlined"
                fullWidth
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(ingredient.id, 'quantity', e.target.value)}
              />
              <IconButton
                color="error"
                onClick={() => handleRemoveIngredient(ingredient.id)}
                disabled={ingredients.length === 1}
              >
                <RemoveCircleOutline />
              </IconButton>
            </Box>
          ))}
          <Button
            variant="outlined"
            startIcon={<AddCircleOutline />}
            onClick={handleAddIngredient}
            sx={{ mb: 4 }}
          >
            材料を追加
          </Button>

          <Divider sx={{ my: 4 }} />

          {/* 作り方 */}
          <Typography variant="h6" gutterBottom>
            作り方
          </Typography>
          {steps.map((step, index) => (
            <Box key={step.id} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                ステップ {index + 1}
              </Typography>
              <TextField
                label="手順"
                variant="outlined"
                fullWidth
                multiline
                rows={2}
                value={step.description}
                onChange={(e) => handleStepChange(step.id, 'description', e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id={`step-image-${step.id}`}
                  type="file"
                  onChange={(e) => handleStepImageChange(step.id, e)}
                />
                <label htmlFor={`step-image-${step.id}`}>
                  <Button variant="outlined" component="span" startIcon={<PhotoCamera />}>
                    画像を追加
                  </Button>
                </label>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveStep(step.id)}
                  disabled={steps.length === 1}
                >
                  <RemoveCircleOutline />
                </IconButton>
              </Box>
              {step.imageUrl && (
                <Box sx={{ mb: 2 }}>
                  <img
                    src={step.imageUrl}
                    alt={`ステップ${index + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }}
                  />
                </Box>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            startIcon={<AddCircleOutline />}
            onClick={handleAddStep}
            sx={{ mb: 4 }}
          >
            手順を追加
          </Button>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Button variant="contained" onClick={handleSubmit} size="large">
              レシピを更新
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default EditRecipe; 