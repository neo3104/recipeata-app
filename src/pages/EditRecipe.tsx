import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RecipeContext } from "../contexts/RecipeContext";
import { UserContext } from "../contexts/UserContext";
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem
} from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import type { Recipe, RecipeStep } from '../types';

const EditRecipe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const recipeContext = useContext(RecipeContext);
  const userContext = useContext(UserContext);

  // --- Stateの定義 ---
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string }[]>([{ name: "", quantity: "" }]);
  const [steps, setSteps] = useState<Partial<RecipeStep>[]>([]);
  const [tags, setTags] = useState('');

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- データ取得と権限チェック ---
  useEffect(() => {
    if (!recipeContext || !userContext) return;
    const { recipes, loading } = recipeContext;
    const { user } = userContext;

    if (loading) {
      setIsLoading(true);
      return;
    }

    const targetRecipe = recipes.find(r => r.id === id);

    if (targetRecipe) {
      const isAuthor = user && targetRecipe.createdById === user.id;
      const isSameStore = user && targetRecipe.createdBy?.store && user.store && targetRecipe.createdBy.store === user.store;
      
      if (!isAuthor && !isSameStore) {
        setError("このレシピを編集する権限がありません。");
        setIsLoading(false);
        return;
      }

      setRecipe(targetRecipe);
      setTitle(targetRecipe.title);
      setDescription(targetRecipe.description);
      setIngredients(targetRecipe.ingredients);
      setSteps(targetRecipe.steps);
      setTags(targetRecipe.tags.join(', '));
      setMainImageUrl(targetRecipe.mainImageUrl);
    } else {
      setError("指定されたレシピが見つかりません。");
    }
    setIsLoading(false);
  }, [id, recipeContext, userContext]);
  
  // --- 画像アップロード関数 ---
  const uploadImage = async (imageFile: File, path: string): Promise<string> => {
    const imageRef = ref(storage, path);
    await uploadBytes(imageRef, imageFile);
    return await getDownloadURL(imageRef);
  };

  // --- イベントハンドラ ---
  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressedFile = await imageCompression(file, { maxSizeMB: 0.7, maxWidthOrHeight: 1024 });
        setMainImageFile(compressedFile);
        setMainImageUrl(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error("画像圧縮エラー:", error);
        setError("画像の処理中にエラーが発生しました。");
      }
    }
  };

  const handleStepImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressedFile = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 800 });
        const newSteps = [...steps];
        newSteps[index].file = compressedFile; // アップロード用
        newSteps[index].imageUrl = URL.createObjectURL(compressedFile); // プレビュー用
        setSteps(newSteps);
      } catch (error) {
        console.error("工程画像圧縮エラー:", error);
      }
    }
  };

  // 材料と工程のハンドラ（AddRecipeから流用・調整）
  const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };
  const addIngredient = () => setIngredients([...ingredients, { name: "", quantity: "" }]);
  const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index].description = value;
    setSteps(newSteps);
  };
  const addStep = () => setSteps([...steps, { description: '' }]);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));


  // --- 更新処理 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !recipe || !recipeContext || !userContext || !userContext.user) {
      return;
    }
    const { user } = userContext;
    const { updateRecipe } = recipeContext;

    setIsSubmitting(true);
    setError(null);

    try {
      let updatedMainImageUrl = recipe.mainImageUrl;
      if (mainImageFile) {
        updatedMainImageUrl = await uploadImage(mainImageFile, `recipes/${user.id}/${uuidv4()}`);
      }
      
      const uploadedSteps = await Promise.all(
        steps.map(async (step) => {
          if (step.file) {
            const imageUrl = await uploadImage(step.file, `recipes/${user.id}/steps/${uuidv4()}`);
            return { description: step.description || '', imageUrl };
          }
          return { description: step.description || '', imageUrl: step.imageUrl || '' };
        })
      );
      
      const recipeToUpdate: Partial<Recipe> = {
        title,
        description,
        mainImageUrl: updatedMainImageUrl,
        ingredients: ingredients.filter(ing => ing.name),
        steps: uploadedSteps.filter(s => s.description),
        tags: tags.split(/[\s,、]+/).filter(tag => tag.length > 0),
      };

      await updateRecipe(id, recipeToUpdate);
      navigate(`/recipe/${id}`);

    } catch (err: any) {
      console.error(err);
      setError("レシピの更新に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- レンダリング ---
  if (isLoading) return <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}><CircularProgress /></Box>;
  if (error) return (
    <Container maxWidth="md" sx={{my: 4}}>
      <Alert severity="error">{error}</Alert>
      <Button onClick={() => navigate('/')} sx={{mt: 2}}>レシピ一覧へ</Button>
    </Container>
  );
  if (!recipe) return <Alert severity="warning">レシピが見つかりません。</Alert>;


  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          レシピを編集
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          
          <TextField label="タイトル" fullWidth required value={title} onChange={(e) => setTitle(e.target.value)} margin="normal" />
          <TextField label="説明" fullWidth multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} margin="normal" />
          <TextField label="タグ" fullWidth value={tags} onChange={(e) => setTags(e.target.value)} margin="normal" helperText="カンマやスペースで区切ってください"/>
          
          <Typography variant="h6" sx={{ mt: 2 }}>メイン画像</Typography>
          <Box sx={{ my: 2, border: '1px dashed grey', padding: 2, textAlign: 'center' }}>
            <Button variant="contained" component="label">
              ファイルを変更
              <input type="file" hidden onChange={handleMainImageChange} accept="image/*" />
            </Button>
            {mainImageUrl && <Box mt={2}><img src={mainImageUrl} alt="プレビュー" style={{ maxHeight: "300px", maxWidth: "100%" }} /></Box>}
          </Box>
          
          <Typography variant="h6" sx={{ mt: 2 }}>材料</Typography>
          <List>
            {ingredients.map((ing, index) => (
              <ListItem key={index} disableGutters>
                <TextField label="材料名" value={ing.name} onChange={(e) => handleIngredientChange(index, 'name', e.target.value)} sx={{ mr: 1 }} />
                <TextField label="分量" value={ing.quantity} onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)} sx={{ mr: 1 }} />
                <IconButton onClick={() => removeIngredient(index)}><RemoveCircleOutline /></IconButton>
              </ListItem>
            ))}
          </List>
          <Button startIcon={<AddCircleOutline />} onClick={addIngredient}>材料を追加</Button>

          <Typography variant="h6" sx={{ mt: 2 }}>作り方</Typography>
          <List>
            {steps.map((step, index) => (
              <ListItem key={index} sx={{flexDirection: 'column', alignItems: 'flex-start', mb: 2, border: '1px solid #eee', p: 2}}>
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <Typography component="div" sx={{ mr: 1, fontWeight: 'bold' }}>{`${index + 1}.`}</Typography>
                  <TextField fullWidth multiline label="手順" value={step.description} onChange={(e) => handleStepChange(index, e.target.value)} />
                  <IconButton onClick={() => removeStep(index)}><RemoveCircleOutline /></IconButton>
                </Box>
                <Box sx={{ mt: 2, width: '100%' }}>
                  <Button variant="outlined" component="label" size="small">
                    工程画像を変更
                    <input type="file" hidden onChange={(e) => handleStepImageChange(index, e)} accept="image/*" />
                  </Button>
                  {step.imageUrl && <Box mt={1}><img src={step.imageUrl} alt={`工程${index + 1}`} style={{ maxHeight: '150px' }} /></Box>}
                </Box>
              </ListItem>
            ))}
          </List>
          <Button startIcon={<AddCircleOutline />} onClick={addStep}>手順を追加</Button>
          
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth sx={{ mt: 4 }}>
            {isSubmitting ? "更新中..." : "レシピを更新する"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditRecipe;