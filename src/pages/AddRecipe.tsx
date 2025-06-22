import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { RecipeContext } from '../contexts/RecipeContext';
import { storage } from '../firebase'; // storageをインポート
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // storage関連の関数をインポート
import { v4 as uuidv4 } from 'uuid'; // ユニークなIDを生成するためにuuidをインポート
import imageCompression from 'browser-image-compression';
import type { Recipe, RecipeStep } from '../types';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';

const AddRecipe: React.FC = () => {
  const navigate = useNavigate();
  const recipeContext = useContext(RecipeContext);
  const userContext = useContext(UserContext);

  if (!recipeContext || !userContext) {
    // コンテキストが提供されていない場合は、ここで早期リターンするか、
    // ローディング表示やエラー表示をすることもできます。
    // ここでは単純にnullを返して何も描画しないようにします。
    // App.tsxの構造上、通常ここには来ないはずです。
    return null;
  }

  const { addRecipe } = recipeContext;
  const { user } = userContext;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }]);
  const [steps, setSteps] = useState<Partial<RecipeStep>[]>([{ description: '' }]);
  const [tags, setTags] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const options = {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      try {
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile); // 圧縮後のファイルをstateに保存
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
      } catch (error) {
        console.error("画像圧縮エラー:", error);
        setError("画像の処理中にエラーが発生しました。別の画像で試してください。");
      }
    }
  };

  const uploadImage = async (imageFile: File, path: string): Promise<string> => {
    const imageRef = ref(storage, path);
    await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('ログインが必要です。');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      // 1. メイン画像のアップロード
      let mainImageUrl = '';
      if (imageFile) {
        mainImageUrl = await uploadImage(imageFile, `recipes/${user.id}/${uuidv4()}`);
      }
      
      // 2. 工程画像のアップロードとURLの取得
      const uploadedSteps = await Promise.all(
        steps.map(async (step) => {
          if (step.file) {
            const imageUrl = await uploadImage(step.file, `recipes/${user.id}/steps/${uuidv4()}`);
            return { description: step.description || '', imageUrl };
          }
          return { description: step.description || '', imageUrl: step.imageUrl || '' };
        })
      );

      const newRecipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments'> = {
        title,
        description,
        mainImageUrl,
        ingredients: ingredients.filter((ing) => ing.name),
        steps: uploadedSteps.filter(s => s.description),
        createdById: user.id,
        createdBy: {
          name: user.displayName || '名無しさん',
          photoURL: user.photoURL || '',
          store: user.store || '',
        },
        subImages: [],
        tags: tags.split(/[\s,、]+/).filter(tag => tag.length > 0),
        cookingTime: 0,
        servings: 0,
      };

      const addedRecipeId = await addRecipe(newRecipe);
      navigate(`/`);
    } catch (err: any) {
      setError(`レシピの追加に失敗しました: ${err.message}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const handleAddStep = () => {
    setSteps([...steps, { description: '' }]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index].description = value;
    setSteps(newSteps);
  };

  const handleStepImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
       const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      try {
        const compressedFile = await imageCompression(file, options);
        const newSteps = [...steps];
        // FileReaderを使用してプレビューURLを生成
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          newSteps[index].imageUrl = reader.result as string; // プレビュー用のURL
          newSteps[index].file = compressedFile; // アップロード用のファイル
          setSteps(newSteps);
        };
      } catch (error) {
        console.error("工程画像の圧縮エラー:", error);
        setError("工程画像の処理中にエラーが発生しました。");
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          新しいレシピを追加
        </Typography>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}
        <TextField
          label="タイトル"
          fullWidth
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
        />
        <TextField
          label="説明"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
        />
        <TextField
          label="タグ (例: 簡単, ヘルシー, お弁当)"
          fullWidth
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          margin="normal"
          helperText="カンマやスペースで区切ってください"
        />
        
        <Typography variant="h6" sx={{ mt: 2 }}>メイン画像</Typography>
        <Box sx={{ my: 2, border: '1px dashed grey', padding: 2, textAlign: 'center' }}>
          <Button variant="contained" component="label">
            ファイルをアップロード
            <input type="file" hidden onChange={handleMainImageChange} accept="image/*" />
          </Button>
          {previewUrl && (
            <Box mt={2}>
              <img src={previewUrl} alt="プレビュー" style={{ maxHeight: '200px', maxWidth: '100%' }} />
            </Box>
          )}
        </Box>

        <Typography variant="h6" sx={{ mt: 2 }}>材料</Typography>
        <List>
          {ingredients.map((ing, index) => (
            <ListItem key={index} disableGutters>
              <TextField
                label="材料名"
                value={ing.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                sx={{ mr: 1 }}
              />
              <TextField
                label="分量"
                value={ing.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                sx={{ mr: 1 }}
              />
              <IconButton onClick={() => handleRemoveIngredient(index)}>
                <RemoveCircleOutline />
              </IconButton>
            </ListItem>
          ))}
        </List>
        <Button startIcon={<AddCircleOutline />} onClick={handleAddIngredient}>
          材料を追加
        </Button>

        <Typography variant="h6" sx={{ mt: 2 }}>作り方</Typography>
        <List>
          {steps.map((step, index) => (
            <ListItem key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                <Typography component="div" sx={{ mr: 1, fontWeight: 'bold' }}>{`${index + 1}.`}</Typography>
                <TextField
                  fullWidth
                  multiline
                  label="手順"
                  value={step.description}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                />
                <IconButton onClick={() => handleRemoveStep(index)}>
                  <RemoveCircleOutline />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2, width: '100%' }}>
                <Button variant="outlined" component="label" size="small">
                  工程画像を追加
                  <input type="file" hidden onChange={(e) => handleStepImageChange(index, e)} accept="image/*" />
                </Button>
                {step.imageUrl && (
                  <Box mt={1}>
                    <img src={step.imageUrl} alt={`工程${index + 1}のプレビュー`} style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '4px' }} />
                  </Box>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
        <Button startIcon={<AddCircleOutline />} onClick={handleAddStep}>
          手順を追加
        </Button>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 4, mb: 4 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? '追加中...' : 'レシピを追加'}
        </Button>
      </Box>
    </Container>
  );
};

export default AddRecipe; 