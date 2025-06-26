import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { RecipeContext } from '../contexts/RecipeContext';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  Paper,
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { useUndoRedo } from '../contexts/UndoRedoContext';
import { useUndoRedoProgress } from '../contexts/UndoRedoProgressContext';
import type { RecipeStep } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';

const AddRecipe: React.FC = () => {
  const navigate = useNavigate();
  const recipeContext = useContext(RecipeContext);
  const userContext = useContext(UserContext);
  const { pushAction } = useUndoRedo();
  const { setStatus } = useUndoRedoProgress();
  const { showNotification } = useNotification();
  const { settings } = useSettings();

  if (!recipeContext || !userContext) {
    // コンテキストが提供されていない場合は、ここで早期リターンするか、
    // ローディング表示やエラー表示をすることもできます。
    // ここでは単純にnullを返して何も描画しないようにします。
    // App.tsxの構造上、通常ここには来ないはずです。
    return null;
  }

  // localStorageのキー
  const STORAGE_KEY = 'recipe_draft';

  // 保存データの型定義
  interface DraftData {
    title: string;
    description: string;
    ingredients: { name: string; quantity: string }[];
    steps: Partial<RecipeStep>[];
    tags: string;
    total: string;
    mainImageUrl: string;
  }

  // 初期データを取得する関数
  const getInitialData = (): DraftData => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          title: parsed.title || '',
          description: parsed.description || '',
          ingredients: parsed.ingredients && parsed.ingredients.length > 0 ? parsed.ingredients : [{ name: '', quantity: '' }],
          steps: parsed.steps && parsed.steps.length > 0 ? parsed.steps : [{ description: '' }],
          tags: parsed.tags || '',
          total: parsed.total || '',
          mainImageUrl: parsed.mainImageUrl || '',
        };
      }
    } catch (error) {
      console.error('保存データの読み込みエラー:', error);
    }
    return {
      title: '',
      description: '',
      ingredients: [{ name: '', quantity: '' }],
      steps: [{ description: '' }],
      tags: '',
      total: '',
      mainImageUrl: '',
    };
  };

  const initialData = getInitialData();

  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [ingredients, setIngredients] = useState(initialData.ingredients);
  const [steps, setSteps] = useState<Partial<RecipeStep>[]>(initialData.steps);
  const [tags, setTags] = useState(initialData.tags);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(initialData.total);
  const [mainImageUrl, setMainImageUrl] = useState(initialData.mainImageUrl);

  // データを保存する関数
  const saveDraft = (data: Partial<DraftData>) => {
    try {
      const currentData = {
        title,
        description,
        ingredients,
        steps,
        tags,
        total,
        mainImageUrl,
        ...data
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
    } catch (error) {
      console.error('データ保存エラー:', error);
    }
  };

  // 保存データをクリアする関数
  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('データクリアエラー:', error);
    }
  };

  // 各state変更時に自動保存
  useEffect(() => {
    saveDraft({ title });
  }, [title]);

  useEffect(() => {
    saveDraft({ description });
  }, [description]);

  useEffect(() => {
    saveDraft({ ingredients });
  }, [ingredients]);

  useEffect(() => {
    saveDraft({ steps });
  }, [steps]);

  useEffect(() => {
    saveDraft({ tags });
  }, [tags]);

  useEffect(() => {
    saveDraft({ total });
  }, [total]);

  useEffect(() => {
    saveDraft({ mainImageUrl });
  }, [mainImageUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeContext || !userContext || !userContext.user) {
      setError("ログインが必要です。");
      return;
    }
    const { user } = userContext;

    setIsSubmitting(true);
    setError('');

    try {
      let uploadedMainImageUrl = mainImageUrl;
      // CloudinaryのURLをそのまま使用（ファイルアップロードは別途処理）
      const newRecipe = {
        title,
        description,
        mainImageUrl: uploadedMainImageUrl,
        ingredients: ingredients.filter(ing => ing.name),
        steps: steps.filter(s => s.description).map(s => ({
          description: s.description || '',
          imageUrl: s.imageUrl || ''
        })),
        likes: [],
        comments: [],
        createdBy: {
          name: user.name || '名無しさん',
          store: user.store || '',
        },
        subImages: [],
        tags: tags.split(/[\s,、]+/).filter(tag => tag.length > 0),
        cookingTime: 0,
        servings: 0,
        total,
      };
      const addedRecipeId = await recipeContext.addRecipe(newRecipe);
      
      // Undo/Redoアクションを追加
      pushAction({
        type: 'add',
        payload: { 
          recipeId: addedRecipeId,
          recipe: { ...newRecipe, id: addedRecipeId }
        },
        undo: async () => {
          try {
            await recipeContext.deleteRecipe(addedRecipeId);
            setStatus('add', '完了');
          } catch (error) {
            console.error('レシピ追加の取り消しエラー:', error);
            alert('レシピ追加の取り消しに失敗しました。');
          }
        },
        redo: async () => {
          try {
            await recipeContext.addRecipe(newRecipe);
          } catch (error) {
            console.error('レシピ追加の再適用エラー:', error);
            alert('レシピ追加の再適用に失敗しました。');
          }
        },
        description: `レシピ「${title}」を追加`,
      });
      
      // 通知
      if (settings.notifications.recipeAdded) {
        showNotification(`${user.store || '未所属'}の${user.name || '名無しさん'}さんが「${title}」を追加しました`, 'success', {
          action: 'recipe_add',
          recipeTitle: title,
          userName: user.name,
          userStore: user.store
        });
      }
      
      clearDraft();
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

  // Cloudinary Upload Widgetを呼び出す関数
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

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fff', boxShadow: 3, borderRadius: 3 }}>
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
            sx={{ bgcolor: '#fff' }}
          />
          <TextField
            label="説明"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            sx={{ bgcolor: '#fff' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
          />
          <TextField
            label="タグ (例: 簡単, ヘルシー, お弁当)"
            fullWidth
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            margin="normal"
            helperText="カンマやスペースで区切ってください"
            sx={{ bgcolor: '#fff' }}
          />
          
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
                <IconButton onClick={() => handleRemoveIngredient(index)}>
                  <RemoveCircleOutline />
                </IconButton>
              </ListItem>
            ))}
          </List>
          <Button startIcon={<AddCircleOutline />} onClick={handleAddIngredient}>
            材料を追加
          </Button>

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
              <ListItem key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <Typography component="div" sx={{ mr: 1, fontWeight: 'bold' }}>{`${index + 1}.`}</Typography>
                  <TextField
                    fullWidth
                    multiline
                    label="手順"
                    value={step.description}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    sx={{ bgcolor: '#fff' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.stopPropagation();
                        e.preventDefault();
                      }
                    }}
                  />
                  <IconButton onClick={() => handleRemoveStep(index)}>
                    <RemoveCircleOutline />
                  </IconButton>
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
          <Button startIcon={<AddCircleOutline />} onClick={handleAddStep}>
            手順を追加
          </Button>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 4, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? '追加中...' : 'レシピを追加'}
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={clearDraft}
            sx={{ mb: 4 }}
            color="secondary"
          >
            下書きをクリア
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddRecipe; 