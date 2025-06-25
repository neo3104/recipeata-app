import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RecipeContext } from "../contexts/RecipeContext";
import { UserContext } from "../contexts/UserContext";
import { useUndoRedo } from '../contexts/UndoRedoContext';
import { useUndoRedoProgress } from '../contexts/UndoRedoProgressContext';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
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
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';

const EditRecipe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const recipeContext = useContext(RecipeContext);
  const userContext = useContext(UserContext);
  const { pushAction } = useUndoRedo();
  const { setStatus } = useUndoRedoProgress();
  const { showNotification } = useNotification();
  const { settings } = useSettings();

  // --- Stateの定義 ---
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string }[]>([{ name: "", quantity: "" }]);
  const [steps, setSteps] = useState<Partial<RecipeStep>[]>([]);
  const [tags, setTags] = useState('');
  const [total, setTotal] = useState('');

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
      const isMaster = user && user.role === 'master';
      
      if (!isAuthor && !isSameStore && !isMaster) {
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
      setTotal(targetRecipe.total || '');
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

  // Cloudinary Upload Widgetを呼び出す関数（メイン画像用）
  const openCloudinaryWidget = () => {
    // @ts-ignore
    window.cloudinary.openUploadWidget(
      {
        cloudName: 'dyxdpmzia',
        uploadPreset: 'unsigned_preset',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: false,
        defaultSource: 'local',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setMainImageUrl(result.info.secure_url);
        }
      }
    );
  };
  // 工程画像アップロード用Cloudinaryウィジェット
  const openStepCloudinaryWidget = (index: number) => {
    // @ts-ignore
    window.cloudinary.openUploadWidget(
      {
        cloudName: 'dyxdpmzia',
        uploadPreset: 'unsigned_preset',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: false,
        defaultSource: 'local',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const newSteps = [...steps];
          newSteps[index].imageUrl = result.info.secure_url;
          setSteps(newSteps);
        }
      }
    );
  };

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
      let updatedMainImageUrl = mainImageUrl || recipe.mainImageUrl;
      const uploadedSteps = await Promise.all(
        steps.map(async (step, idx) => {
          if (step.file) {
            const imageUrl = await uploadImage(step.file, `recipes/${user.id}/steps/${uuidv4()}`);
            return { description: step.description || '', imageUrl };
          }
          return { description: step.description || '', imageUrl: step.imageUrl || (recipe.steps[idx]?.imageUrl || '') };
        })
      );
      const recipeToUpdate: Partial<Recipe> = {
        title,
        description,
        mainImageUrl: updatedMainImageUrl,
        ingredients: ingredients.filter(ing => ing.name),
        steps: uploadedSteps.filter(s => s.description),
        tags: tags.split(/[,、\s]+/).filter(tag => tag.length > 0),
        total,
      };

      // 更新前のレシピ状態を保存
      const originalRecipe = { ...recipe };

      await updateRecipe(
        id,
        recipeToUpdate,
        {
          name: user.displayName || '',
          store: user.store || '',
          userId: user.id || '',
        },
        `タイトル: ${recipe.title} → ${title}\n説明: ${recipe.description} → ${description}`
      );

      // 通知
      if (settings.notifications.recipeEdited) {
        showNotification(`${user.store || '未所属'}の${user.displayName || '名無しさん'}さんが「${title}」を編集しました`, 'success', {
          action: 'recipe_edit',
          recipeId: id,
          recipeTitle: title,
          userId: user.id,
          userName: user.displayName,
          userStore: user.store
        });
      }

      // Undo/Redoアクションを追加
      // 変更があった項目だけをchangesに格納
      const changes: any = {};
      if (recipe.title !== title && !(recipe.title === '' && title === '')) {
        changes.title = `${recipe.title || '(空)'} → ${title || '(空)'}`;
      }
      if (recipe.description !== description && !(recipe.description === '' && description === '')) {
        changes.description = `${recipe.description || '(空)'} → ${description || '(空)'}`;
      }
      if (!recipe.mainImageUrl && updatedMainImageUrl) {
        changes.mainImageUrl = '画像が追加されました';
      } else if (recipe.mainImageUrl && recipe.mainImageUrl !== updatedMainImageUrl) {
        changes.mainImageUrl = '画像が変更されました';
      }
      if (JSON.stringify(recipe.ingredients) !== JSON.stringify(ingredients)) changes.ingredients = '材料が変更されました';
      if (JSON.stringify(recipe.steps) !== JSON.stringify(uploadedSteps)) changes.steps = '手順が変更されました';
      if (JSON.stringify(recipe.tags) !== JSON.stringify(tags.split(/[,、\s]+/).filter(tag => tag.length > 0))) changes.tags = 'タグが変更されました';
      if (recipe.total !== total) changes.total = `${recipe.total || ''} → ${total}`;

      pushAction({
        type: 'edit',
        payload: { 
          originalRecipe,
          updatedRecipe: { ...recipe, ...recipeToUpdate },
          changes,
        },
        undo: async () => {
          try {
            await updateRecipe(
              id,
              originalRecipe,
              {
                name: user.displayName || '',
                store: user.store || '',
                userId: user.id || '',
              },
              '編集を元に戻す'
            );
            setStatus('edit', '完了');
          } catch (error) {
            console.error('レシピ編集の取り消しエラー:', error);
            alert('編集の取り消しに失敗しました。');
          }
        },
        redo: async () => {
          try {
            await updateRecipe(
              id,
              recipeToUpdate,
              {
                name: user.displayName || '',
                store: user.store || '',
                userId: user.id || '',
              },
              '編集を再適用'
            );
          } catch (error) {
            console.error('レシピ編集の再適用エラー:', error);
            alert('編集の再適用に失敗しました。');
          }
        },
        description: `レシピ「${recipe.title}」を編集`,
      });

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
            <Button variant="outlined" onClick={openCloudinaryWidget} sx={{ mb: 2 }}>
              画像をアップロード
            </Button>
            {mainImageUrl && (
              <Box sx={{ my: 2 }}>
                <img src={mainImageUrl} alt="アップロード画像" style={{ maxWidth: 200 }} />
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
                  sx={{ mr: 1, bgcolor: '#fff' }}
                />
                <TextField
                  label="分量"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  sx={{ mr: 1, bgcolor: '#fff' }}
                />
                <IconButton onClick={() => removeIngredient(index)}>
                  <RemoveCircleOutline />
                </IconButton>
              </ListItem>
            ))}
          </List>
          <Button startIcon={<AddCircleOutline />} onClick={addIngredient}>
            材料を追加
          </Button>

          {/* 合計欄を追加 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>合計</Typography>
            <TextField
              value={total}
              onChange={e => setTotal(e.target.value)}
              placeholder="例: 500g, 3品, など自由記入"
              size="small"
              sx={{ bgcolor: '#fff', flex: 1 }}
            />
          </Box>

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
                  <Button variant="outlined" onClick={() => openStepCloudinaryWidget(index)} size="small">
                    工程画像を追加
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