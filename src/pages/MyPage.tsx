import { useState, useEffect, useMemo, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { RecipeContext } from '../contexts/RecipeContext';
import { useUndoRedo } from '../contexts/UndoRedoContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Card,
  Divider,
  Pagination,
} from "@mui/material";
import RecipeCard from '../components/RecipeCard';
import { useNavigate } from 'react-router-dom';
import { ArrowBack, Favorite, FavoriteBorder, PushPin, PushPinOutlined, Edit, Delete, Add, Comment } from '@mui/icons-material';
import { usePagination } from '../hooks/usePagination';
import React from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mypage-tabpanel-${index}`}
      aria-labelledby={`mypage-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            {children}
          </Grid>
        </Box>
      )}
    </div>
  );
}

const MyPage = () => {
  const userContext = useContext(UserContext);
  const recipeContext = useContext(RecipeContext);
  const navigate = useNavigate();
  const { undoStack, pushAction } = useUndoRedo();
  const { settings } = useSettings();
  const { showNotification } = useNotification();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!userContext || !recipeContext) {
    return <p>読み込み中...</p>;
  }

  const { user, updateUserProfile } = userContext;
  const { recipes, loading: recipesLoading } = recipeContext;

  const [tabValue, setTabValue] = useState(0);
  const [name, setName] = useState(user?.name || "");
  const [store, setStore] = useState(user?.store || "");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setStore(user.store || "");
    }
  }, [user]);

  const myRecipes = useMemo(() => {
    if (!user) return [];
    return recipes.filter((recipe) => recipe.createdBy?.name === user.name && recipe.createdBy?.store === user.store);
  }, [recipes, user]);

  // usePaginationを利用（作成レシピ）
  const {
    currentPage: recipePage,
    totalPages: recipeTotalPages,
    paginatedData: paginatedMyRecipes,
    setCurrentPage: setRecipePage
  } = usePagination(myRecipes, settings.myRecipesPerPage);

  // usePaginationを利用（操作履歴）
  const {
    currentPage: historyPage,
    totalPages: historyTotalPages,
    paginatedData: paginatedUndoStack,
    setCurrentPage: setHistoryPage
  } = usePagination([...undoStack].reverse(), settings.historyPerPage);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    try {
      await updateUserProfile({ name, store });
      pushAction({
        type: 'profile-edit',
        payload: {
          newName: name,
          newStore: store
        },
        undo: async () => {},
        redo: async () => {},
        description: `プロフィールを編集: ${name}（${store}）`,
      });
      if (settings.notifications.recipeEdited && user) {
        showNotification(`${store || '未所属'}の${name || '名無しさん'}さんがプロフィールを編集しました`, 'success', {
          action: 'profile_edit',
          userName: name,
          userStore: store
        });
      }
      alert("プロフィールを更新しました");
    } catch (error) {
      console.error("プロフィールの更新に失敗しました:", error);
      alert("プロフィールの更新に失敗しました。");
    }
  };

  // 画像選択時の処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 画像アップロード＆プロフィール更新
  const handleImageUpload = async () => {
    if (!selectedImage || !user) return;
    try {
      // Cloudinaryへアップロード
      const formData = new FormData();
      formData.append('file', selectedImage);
      formData.append('upload_preset', 'unsigned_preset'); // ←Cloudinaryの設定に合わせて
      const res = await fetch('https://api.cloudinary.com/v1_1/dyxdpmzia/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        await updateUserProfile({ name, store });
        setPreviewUrl(data.secure_url);
        setSelectedImage(null);
        alert('プロフィール画像を更新しました');
      } else {
        alert('画像アップロードに失敗しました');
      }
    } catch (error) {
      alert('画像のアップロードに失敗しました');
    }
  };

  if (recipesLoading) {
    return <p>レシピを読み込んでいます...</p>;
  }

  if (!user) {
    return (
      <Container>
        <Typography>ログインしてください。</Typography>
      </Container>
    );
  }

  // 操作履歴の詳細情報を取得する関数
  const getActionDetails = (action: any) => {
    const details: any = {
      icon: null,
      title: action.description || action.type,
      timestamp: action.timestamp ? action.timestamp.toLocaleString('ja-JP') : new Date().toLocaleString('ja-JP'),
      recipe: null,
      changes: null,
    };

    switch (action.type) {
      case 'favorite':
        details.icon = action.payload?.isFavorited ? <Favorite color="error" /> : <FavoriteBorder />;
        details.recipe = recipes.find(r => r.id === action.payload?.id);
        details.changes = {
          type: 'お気に入り',
          action: action.payload?.isFavorited ? '追加' : '削除',
        };
        break;
      
      case 'pin':
        details.icon = action.payload?.isPinned ? <PushPin color="primary" /> : <PushPinOutlined />;
        details.recipe = recipes.find(r => r.id === action.payload?.id);
        details.changes = {
          type: 'ピン',
          action: action.payload?.isPinned ? '刺し' : '外し',
        };
        break;
      
      case 'delete':
        details.icon = <Delete color="error" />;
        details.recipe = action.payload?.recipe;
        details.changes = {
          type: 'レシピ削除',
          action: '削除',
        };
        break;
      
      case 'edit':
        details.icon = <Edit color="primary" />;
        details.recipe = recipes.find(r => r.id === action.payload?.updatedRecipe?.id) || action.payload?.updatedRecipe;
        details.changes = {
          type: 'レシピ編集',
          action: '編集',
          details: action.payload?.changes,
        };
        break;
      
      case 'add':
        details.icon = <Add color="success" />;
        details.recipe = recipes.find(r => r.id === action.payload?.recipeId) || action.payload?.recipe;
        details.changes = {
          type: 'レシピ追加',
          action: '追加',
        };
        break;
      
      case 'comment':
        details.icon = <Comment color="info" />;
        details.recipe = recipes.find(r => r.id === action.payload?.recipeId);
        details.changes = {
          type: 'コメント',
          action: '追加',
          content: action.payload?.comment?.text,
        };
        break;
    }

    return details;
  };

  // 操作履歴のシンプルなリスト表示用コンポーネント
  const SimpleActionHistoryItem = ({ action }: { action: any }) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', py: 1, px: 0.5 }}>
        <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 700 }}>
          {action.type === 'like' ? 'いいね' :
           action.type === 'comment' ? 'コメント' :
           action.type === 'edit' ? '編集' :
           action.type === 'add' ? '追加' :
           action.type === 'delete' ? '削除' :
           action.type === 'profile-edit' ? 'プロフィール編集' :
           action.type === 'favorite' ? 'お気に入り' :
           action.type === 'pin' ? 'ピン' :
           action.type}
        </Typography>
        <Typography variant="body2" sx={{ flexGrow: 1, ml: 1 }}>
          {action.payload?.recipeTitle || action.payload?.newName || action.payload?.type || '-'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120, textAlign: 'right', mr: 2 }}>
          {action.timestamp ? new Date(action.timestamp).toLocaleString('ja-JP') : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, textAlign: 'right', mr: 2 }}>
          {action.description}
        </Typography>
        <Button size="small" variant="outlined" onClick={() => { setSelectedAction(action); setDetailOpen(true); }}>
          詳細
        </Button>
      </Box>
    );
  };

  return (
    <div>
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0, color: 'text.primary' }}>
            マイページ
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
          >
            レシピ一覧へ
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          {/* プロフィール画像 */}
          <Avatar
            src={previewUrl || undefined}
            sx={{ width: 80, height: 80, fontSize: 32 }}
          />
          <Box>
            <Button variant="outlined" component="label" sx={{ mb: 1 }}>
              画像を選択
              <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            </Button>
            {selectedImage && (
              <Button variant="contained" color="primary" onClick={handleImageUpload} sx={{ ml: 2 }}>
                保存
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="mypage tabs"
          >
            <Tab label="作成したレシピ" />
            <Tab label="プロフィール編集" />
            <Tab label="操作履歴" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {paginatedMyRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                  <RecipeCard recipe={recipe} />
                </Grid>
              ))}
            </Grid>
            {recipeTotalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={recipeTotalPages}
                  page={recipePage}
                  onChange={(_, page) => setRecipePage(page)}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Box component="form" sx={{ mt: 3 }} noValidate autoComplete="off">
            <Typography variant="h6" gutterBottom>
              プロフィール情報
            </Typography>
            <TextField
              label="名前"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="所属店舗"
              fullWidth
              value={store}
              onChange={(e) => setStore(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleProfileUpdate}
            >
              保存
            </Button>
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>操作履歴</Typography>
            {paginatedUndoStack.length === 0 ? (
              <Typography color="text.secondary">操作履歴はありません。</Typography>
            ) : (
              <Box>
                {paginatedUndoStack.map((action, idx) => (
                  <SimpleActionHistoryItem key={idx} action={action} />
                ))}
                {historyTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={historyTotalPages}
                      page={historyPage}
                      onChange={(_, page) => setHistoryPage(page)}
                      color="primary"
                    />
                  </Box>
                )}
              </Box>
            )}
            
            {/* 詳細ダイアログ */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {selectedAction && getActionDetails(selectedAction).icon}
                  <Typography>操作の詳細</Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                {selectedAction && (() => {
                  const details = getActionDetails(selectedAction);
                  return (
                    <Box>
                      <Typography variant="h5" gutterBottom>
                        {details.title}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        実行時刻: {details.timestamp}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      {details.recipe && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom>対象レシピ</Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: 1, minWidth: 300 }}>
                              <RecipeCard recipe={details.recipe} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 300 }}>
                              <Card sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>レシピ情報</Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>タイトル:</strong> {details.recipe.title}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>説明:</strong> {details.recipe.description}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>作成者:</strong> {details.recipe.createdBy?.name}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>作成日:</strong> {details.recipe.createdAt?.toLocaleString('ja-JP')}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>材料数:</strong> {details.recipe.ingredients?.length || 0}個
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>手順数:</strong> {details.recipe.steps?.length || 0}個
                                </Typography>
                                {details.recipe.tags && details.recipe.tags.length > 0 && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" gutterBottom>
                                      <strong>タグ:</strong>
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                      {details.recipe.tags.map((tag: string, idx: number) => (
                                        <Chip key={idx} label={tag} size="small" />
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                              </Card>
                            </Box>
                          </Box>
                        </Box>
                      )}
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>操作詳細</Typography>
                      <Card sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>操作種別:</strong> {selectedAction.type}
                        </Typography>
                        {details.changes && (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              <strong>操作内容:</strong> {details.changes.type} {details.changes.action}
                            </Typography>
                            {details.changes.details && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" gutterBottom>
                                  <strong>変更内容:</strong>
                                </Typography>
                                {Object.entries(details.changes.details).map(([key, value]: [string, any]) => {
                                  if (value === null || value === undefined || value === '' || value === false) return null;
                                  let label = key;
                                  if (key === 'title') label = 'タイトル';
                                  if (key === 'description') label = '説明';
                                  if (key === 'mainImageUrl') label = 'メイン画像';
                                  if (key === 'ingredients') label = '材料';
                                  if (key === 'steps') label = '手順';
                                  if (key === 'tags') label = 'タグ';
                                  if (key === 'total') label = '合計';
                                  return (
                                    <Typography key={key} variant="body2" gutterBottom sx={{ ml: 2 }}>
                                      • {label}: {value}
                                    </Typography>
                                  );
                                })}
                              </Box>
                            )}
                            {details.changes.content && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" gutterBottom>
                                  <strong>コメント内容:</strong>
                                </Typography>
                                <Typography variant="body2" sx={{ ml: 2, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                                  {details.changes.content}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Card>
                    </Box>
                  );
                })()}
              </DialogContent>
              <DialogActions>
                {selectedAction && getActionDetails(selectedAction).recipe && (
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      const details = getActionDetails(selectedAction);
                      navigate(`/recipe/${details.recipe.id}`);
                      setDetailOpen(false);
                    }}
                  >
                    レシピページへ
                  </Button>
                )}
                <Button onClick={() => setDetailOpen(false)}>閉じる</Button>
              </DialogActions>
            </Dialog>
          </Box>
        </TabPanel>
      </Container>
    </div>
  );
}

export default MyPage; 