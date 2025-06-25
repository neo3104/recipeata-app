import React, { useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RecipeContext } from '../contexts/RecipeContext';
import { UserContext } from '../contexts/UserContext';
import { useFavorites } from '../contexts/FavoriteContext';
import { useUndoRedo } from '../contexts/UndoRedoContext';
import { useUndoRedoProgress } from '../contexts/UndoRedoProgressContext';
import { generateRecipePDF, waitForImages } from '../utils/pdfUtils';
import RecipePDF from '../components/RecipePDF';
import type { Comment, Like } from '../types';
import {
  Container,
  Typography,
  Box,
  Paper,
  IconButton,
  Button,
  TextField,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  CircularProgress,
  Chip,
  Dialog,
  DialogContent,
  Alert,
  Menu,
  MenuItem,
  Collapse,
  DialogTitle,
  Pagination
} from '@mui/material';
import { Delete, ArrowBack, Edit, Favorite, FavoriteBorder, Send, CheckCircle, PictureAsPdf, Reply, HistoryOutlined } from '@mui/icons-material';
import { usePagination } from '../hooks/usePagination';
import { useSettings } from '../contexts/SettingsContext';
import { useNotification } from '../contexts/NotificationContext';

const formatDate = (date: any): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleString('ja-JP');
};

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, text: string) => void;
  isReply?: boolean;
  parentUserName?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, isReply = false, parentUserName }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    }
  };

  return (
    <Box sx={{ mt: 2, pl: isReply ? 4 : 0, borderLeft: isReply ? '2px solid #eee' : undefined }}>
      {isReply && parentUserName && (
        <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          ◀◀ {parentUserName} さんへの返信
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar src={comment.createdBy.photoURL} sx={{ bgcolor: '#f5f5f5', color: '#888' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="subtitle2">{comment.createdBy.name}</Typography>
            {comment.createdBy.store && (
              <Typography variant="caption" color="text.secondary">
                ({comment.createdBy.store})
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{comment.text}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">{formatDate(comment.createdAt)}</Typography>
            {!isReply && (
              <Button size="small" startIcon={<Reply />} onClick={() => setShowReplyForm(!showReplyForm)}>
                返信する
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Collapse in={showReplyForm}>
        <Box sx={{ mt: 1, ml: '56px', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="返信を追加..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <IconButton color="primary" onClick={handleReplySubmit} disabled={!replyText.trim()}>
            <Send />
          </IconButton>
        </Box>
      </Collapse>

      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {comment.replies.filter(Boolean).map((reply: Comment, index: number) => (
            <CommentItem
              key={reply.id ? reply.id : 'reply-' + index}
              comment={reply}
              onReply={onReply}
              isReply
              parentUserName={comment.createdBy.name}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

// undefinedフィールドを除去する関数
function removeUndefined(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

function RecipeDetail() {
  // use*フックはここで全部呼ぶ
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipeContext = useContext(RecipeContext);
  const userContext = useContext(UserContext);
  const favoritesContext = useFavorites();
  const { pushAction } = useUndoRedo();
  const { setStatus } = useUndoRedoProgress();
  const { settings } = useSettings();
  const { showNotification } = useNotification();
  const [commentText, setCommentText] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [likesAnchorEl, setLikesAnchorEl] = useState<null | HTMLElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotRecipe, setSnapshotRecipe] = useState<any>(null);
  const [pdfReady, setPdfReady] = useState(false);

  // ここでrecipe, user, loading, errorを先に取得
  const recipeContextSafe = recipeContext as Exclude<typeof recipeContext, undefined>;
  const recipes: any[] = Array.isArray(recipeContextSafe?.recipes) ? recipeContextSafe.recipes : [];
  const deleteRecipe = recipeContextSafe?.deleteRecipe;
  const toggleLike = recipeContextSafe?.toggleLike;
  const addComment = recipeContextSafe?.addComment;
  const deleteComment = recipeContextSafe?.deleteComment;
  const user = userContext?.user;
  const recipe = recipes?.find(r => r.id === id);
  const loading = recipeContextSafe?.loading;
  const error = recipeContextSafe?.error;

  // コメントのページネーションも先に定義（recipeがなければ空配列）
  const sortedComments = recipe ? recipe.comments.sort((a: Comment, b: Comment) => b.createdAt.getTime() - a.createdAt.getTime()) : [];
  const {
    currentPage: commentPage,
    totalPages: commentTotalPages,
    paginatedData: paginatedComments,
    setCurrentPage: setCommentPage
  } = usePagination(sortedComments, settings.commentsPerPage);

  // ここから分岐レンダリング
  if (!recipeContext || !userContext) {
    return <p>読み込み中...</p>;
  }
  if (!recipe) {
    return <p>レシピが見つかりません。</p>;
  }
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Typography sx={{textAlign: 'center', mt: 4, color: 'error.main'}}>{error}</Typography>;
  }

  const isAuthor = user && recipe.createdById === user.id;
  const isSameStore = user && recipe.createdBy?.store && user.store && recipe.createdBy.store === user.store;
  const isMaster = user?.role === 'master';
  const canEdit = isAuthor || isSameStore || isMaster;

  const hasLiked = user?.id ? recipe.likes.some(like => like.userId === user.id) : false;

  const handleLike = () => {
    if (!id || !user) return;
    const recipeObj = recipes.find(r => r.id === id);
    if (!recipeObj) return;
    const alreadyLiked = recipeObj.likes.some(like => like.userId === user.id);
    if (toggleLike) toggleLike(id, {
      userId: user.id,
      userName: user.displayName,
      userPhotoURL: user.photoURL
    });
    // 通知
    if (settings.notifications.recipeLiked && user) {
      showNotification(`${user.store || '未所属'}の${user.displayName || '名無しさん'}さんが「${recipeObj.title}」に${alreadyLiked ? 'いいねを解除しました' : 'いいねしました'}`, 'info', {
        action: 'like',
        recipeId: id,
        recipeTitle: recipeObj.title,
        userId: user.id,
        userName: user.displayName,
        userStore: user.store,
        additionalInfo: { isLike: !alreadyLiked }
      });
    }
    // pushActionで履歴に記録
    pushAction({
      type: 'like',
      payload: {
        recipeId: id,
        recipeTitle: recipeObj.title,
        userId: user.id,
        userName: user.displayName,
        action: alreadyLiked ? 'unlike' : 'like'
      },
      undo: async () => {
        if (toggleLike) toggleLike(id, {
          userId: user.id,
          userName: user.displayName,
          userPhotoURL: user.photoURL
        });
        setStatus('like', '完了');
      },
      redo: async () => {
        if (toggleLike) toggleLike(id, {
          userId: user.id,
          userName: user.displayName,
          userPhotoURL: user.photoURL
        });
      },
      description: `いいねを${alreadyLiked ? '解除' : '追加'}`,
    });
  };

  const handleAddComment = (text: string, parentId?: string) => {
    if (!id || !user || !text.trim()) return;
    
    const newComment: Omit<Comment, 'id' | 'createdAt'> = {
      text: text.trim(),
      userId: user.id,
      createdBy: {
        name: user.displayName,
        photoURL: user.photoURL,
      },
    };

    // コメント追加前に現在のコメント状態を保存
    const currentComments = [...recipe.comments];
    
    if (addComment) addComment(id, removeUndefined(newComment), parentId);
    
    // 通知
    if (settings.notifications.recipeCommented && user) {
      showNotification(`${user.store || '未所属'}の${user.displayName || '名無しさん'}さんが「${recipe.title}」にコメントしました`, 'info', {
        action: 'comment',
        recipeId: id,
        recipeTitle: recipe.title,
        commentText: text,
        userId: user.id,
        userName: user.displayName,
        userStore: user.store
      });
    }
    // Undo/Redoアクションを追加
    pushAction({
      type: 'comment',
      payload: { 
        recipeId: id,
        comment: newComment,
        parentId,
        currentComments
      },
      undo: async () => {
        try {
          // 最新のコメントを削除（IDは自動生成されるため、最後のコメントを削除）
          const updatedRecipe = recipes.find(r => r.id === id);
          if (updatedRecipe && updatedRecipe.comments.length > 0) {
            const lastComment = updatedRecipe.comments[updatedRecipe.comments.length - 1];
            if (deleteComment) deleteComment(id, lastComment.id);
          }
          setStatus('comment', '完了');
        } catch (error) {
          console.error('コメント追加の取り消しエラー:', error);
          alert('コメント追加の取り消しに失敗しました。');
        }
      },
      redo: async () => {
        try {
          if (addComment) addComment(id, removeUndefined(newComment), parentId);
        } catch (error) {
          console.error('コメント追加の再適用エラー:', error);
          alert('コメント追加の再適用に失敗しました。');
        }
      },
      description: `コメントを追加: ${text.trim().substring(0, 20)}${text.trim().length > 20 ? '...' : ''}`,
    });
    
    setCommentText('');
  };
  
  const handleDelete = async () => {
    if(!id || !recipe) return;
    if (window.confirm("このレシピを本当に削除しますか？")) {
        try {
            // 削除前にレシピのコピーを保存
            const recipeToDelete = { ...recipe };
            
            if (deleteRecipe) await deleteRecipe(id);
            
            // 通知
            if (settings.notifications.recipeEdited && user) {
              showNotification(`${user.store || '未所属'}の${user.displayName || '名無しさん'}さんが「${recipe.title}」を削除しました`, 'success', {
                action: 'recipe_delete',
                recipeId: id,
                recipeTitle: recipe.title,
                userId: user.id,
                userName: user.displayName,
                userStore: user.store
              });
            }
            
            // Undo/Redoアクションを追加
            pushAction({
              type: 'delete',
              payload: { recipe: recipeToDelete },
              undo: async () => {
                try {
                  if (recipeContext) await recipeContext.restoreRecipe(recipeToDelete);
                  setStatus('delete', '完了');
                } catch (error) {
                  console.error('レシピ復元エラー:', error);
                  alert('レシピの復元に失敗しました。');
                }
              },
              redo: async () => {
                try {
                  if (deleteRecipe) await deleteRecipe(recipeToDelete.id);
                } catch (error) {
                  console.error('レシピ再削除エラー:', error);
                  alert('レシピの再削除に失敗しました。');
                }
              },
              description: `レシピ「${recipe.title}」を削除`,
            });
            
            navigate('/');
        } catch (e) {
            console.error(e);
            alert("削除に失敗しました。");
        }
    }
  };

  const handleGeneratePDF = async () => {
    setPdfReady(true); // 非表示でPDF用DOMを生成
    await new Promise(resolve => setTimeout(resolve, 100)); // DOM生成を待つ
    console.log('PDF生成デバッグ: recipe=', recipe, 'pdfRef.current=', pdfRef.current);
    if (!recipe) {
      setPdfError('レシピデータが取得できていません。ページを再読み込みするか、しばらく待ってから再度お試しください。');
      setPdfReady(false);
      return;
    }
    if (!pdfRef.current) {
      setPdfError('PDF化対象の要素が見つかりません。画面を再読み込みするか、もう一度お試しください。');
      setPdfReady(false);
      return;
    }
    setIsGeneratingPDF(true);
    setPdfError(null);
    try {
      await waitForImages(pdfRef.current);
      await generateRecipePDF(recipe, pdfRef.current);
    } catch (error) {
      setPdfError(`PDFの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsGeneratingPDF(false);
      setPdfReady(false);
    }
  };

  const likes = recipe.likes as any[];

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
            戻る
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<HistoryOutlined />}
              onClick={() => setHistoryOpen(true)}
            >
              履歴
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PictureAsPdf />} 
              onClick={() => setShowPDFPreview(true)}
              disabled={isGeneratingPDF}
            >
              PDFプレビュー
            </Button>
            <Button 
              variant="contained" 
              startIcon={<PictureAsPdf />} 
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? '生成中...' : 'PDFダウンロード'}
            </Button>
            {canEdit && (
              <>
                <Button variant="contained" startIcon={<Edit />} onClick={() => navigate(`/edit/${recipe.id}`)}>
                  編集
                </Button>
                <Button color="error" variant="outlined" startIcon={<Delete />} onClick={handleDelete}>
                  削除
                </Button>
              </>
            )}
          </Box>
        </Box>

        {pdfError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {pdfError}
          </Alert>
        )}
        
        <Paper sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h3" component="h1" sx={{ flexGrow: 1 }}>
              {recipe.title}
            </Typography>
            <IconButton
              onClick={async () => {
                try {
                  if (favoritesContext.isFavorite(recipe.id)) {
                    await favoritesContext.removeFavorite(recipe.id);
                  } else {
                    await favoritesContext.addFavorite(recipe.id);
                  }
                } catch (error) {
                  console.error('お気に入り操作エラー:', error);
                }
              }}
              sx={{
                ml: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                },
              }}
            >
              {favoritesContext.isFavorite(recipe.id) ? (
                <Favorite sx={{ color: '#f57c00' }} />
              ) : (
                <FavoriteBorder sx={{ color: '#666' }} />
              )}
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2}}>
            <Avatar src={recipe.createdBy.photoURL} sx={{ bgcolor: '#f5f5f5', color: '#888' }} />
            <Box>
              <Typography variant="subtitle1">
                {recipe.createdBy.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(recipe.createdAt)}
              </Typography>
            </Box>
          </Box>

          {recipe.mainImageUrl && (
            <Box component="img" src={recipe.mainImageUrl} alt={recipe.title} sx={{ width: '100%', borderRadius: 1, my: 2, maxHeight: 500, objectFit: 'cover' }} />
          )}

          <Typography variant="body1" sx={{ my: 2, whiteSpace: 'pre-wrap' }}>{recipe.description}</Typography>

          {recipe.tags && recipe.tags.length > 0 && (
            <Box sx={{ my: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {recipe.tags.map((tag: string, index: number) => (
                <Chip key={tag + index} label={tag} size="small" />
              ))}
            </Box>
          )}

          <Grid container spacing={4} sx={{ my: 2 }}>
            <Grid item xs={12} md={5}>
              <Typography variant="h5" gutterBottom>材料</Typography>
              <List>
                {recipe.ingredients.map((ing: any, index: number) => (
                  ing.name && <ListItem key={ing.name + index} disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                    <ListItemText primary={ing.name} secondary={ing.quantity} />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {recipe.total && (
              <Grid item xs={12} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mt: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ mr: 2 }}>合計</Typography>
                  <Typography variant="body1">{recipe.total}</Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} md={7}>
              <Typography variant="h5" gutterBottom>作り方</Typography>
              <List sx={{p: 0}}>
                {recipe.steps.map((step: any, index: number) => (
                  step && <ListItem key={step.description + index} alignItems="flex-start" sx={{flexDirection: 'column', mb: 2}}>
                    <Box sx={{display: 'flex', width: '100%', mb: step.imageUrl ? 1 : 0}}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '1rem', mr: 2, bgcolor: 'primary.main', flexShrink: 0 }}>{index + 1}</Avatar>
                      <ListItemText primary={<Typography>{step.description}</Typography>} />
                    </Box>
                    {step.imageUrl && (
                      <Box 
                        component="img" 
                        src={step.imageUrl} 
                        alt={`工程${index + 1}`}
                        sx={{ width: '100%', borderRadius: 1, mt: 1, pl: '56px' }} 
                      />
                    )}
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </Paper>

        <Paper id="recipe-actions-section" sx={{ p: { xs: 2, md: 4 }, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 2 }}>
            <Button
              aria-controls="likes-menu"
              aria-haspopup="true"
              onClick={(e) => setLikesAnchorEl(e.currentTarget)}
              sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 'normal' }}
            >
              <Typography variant="body2">{recipe.likes.length} いいね</Typography>
            </Button>
            <Menu
              id="likes-menu"
              anchorEl={likesAnchorEl}
              keepMounted
              open={Boolean(likesAnchorEl)}
              onClose={() => setLikesAnchorEl(null)}
            >
              {likes.length > 0 ? (
                likes.map((like: any, idx: number) => (
                  <MenuItem key={like.userId} onClick={() => setLikesAnchorEl(null)}>
                    <ListItemIcon>
                      <Avatar src={like.userPhotoURL} sx={{ width: 24, height: 24 }} />
                    </ListItemIcon>
                    <ListItemText primary={like.userName} />
                  </MenuItem>
                ))
              ) : (
                <MenuItem onClick={() => setLikesAnchorEl(null)}>まだいいねされていません</MenuItem>
              )}
            </Menu>

            <IconButton onClick={handleLike} color="error">
              {hasLiked ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>コメント ({recipe.comments.length})</Typography>
          {user && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2}}>
                  <Avatar src={user.photoURL} sx={{ bgcolor: '#f5f5f5', color: '#888' }} />
                  <TextField 
                      fullWidth 
                      variant='outlined' 
                      label="コメントを追加"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(commentText)}
                  />
                  <IconButton color="primary" onClick={() => handleAddComment(commentText)} disabled={!commentText.trim() || !user}>
                      <Send />
                  </IconButton>
              </Box>
          )}
          <List>
              {(paginatedComments as Comment[]).map((comment, index) => (
                <CommentItem key={comment.id ? comment.id : 'comment-' + index} comment={comment} onReply={(parentId, text) => handleAddComment(text, parentId)} />
              ))}
          </List>
          {commentTotalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={commentTotalPages}
                page={commentPage}
                onChange={(_, page) => setCommentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      </Container>

      {/* PDFプレビューダイアログ */}
      <Dialog 
        open={showPDFPreview} 
        onClose={() => setShowPDFPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ width: '210mm', height: '297mm', overflow: 'auto', bgcolor: 'white' }}>
            <RecipePDF ref={pdfRef} recipe={recipe} />
          </Box>
        </DialogContent>
      </Dialog>

      {/* 履歴ダイアログ */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>編集履歴</DialogTitle>
        <DialogContent>
          {(recipe.history || [])
            .filter((h: any) => h.diff && (typeof h.diff !== 'object' || Object.keys(h.diff).length > 0))
            .map((h: any, idx: number) => {
              const d = h.diff;
              const isObj = typeof d === 'object' && d !== null;
              return (
                <Box key={h.id || h.editedAt?.toMillis?.() || idx} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {h.editedBy?.store} / {h.editedBy?.name}（{h.editedAt && typeof h.editedAt.toDate === 'function' ? h.editedAt.toDate().toLocaleString() : ''}）
                  </Typography>
                  {isObj ? (
                    <>
                      {d.title && <Typography>タイトル: {d.title.before} → {d.title.after}</Typography>}
                      {d.description && <Typography>説明: {d.description.before} → {d.description.after}</Typography>}
                      {d.ingredientsAdded && d.ingredientsAdded.length > 0 && (
                        <Box sx={{mb:1}}>
                          <Typography color="primary">追加された材料:</Typography>
                          {d.ingredientsAdded.map((ing: any, i: number) => (
                            <Typography key={i} sx={{ml:2}}>- {ing.name} {ing.quantity}</Typography>
                          ))}
                        </Box>
                      )}
                      {d.ingredientsRemoved && d.ingredientsRemoved.length > 0 && (
                        <Box sx={{mb:1}}>
                          <Typography color="error">削除された材料:</Typography>
                          {d.ingredientsRemoved.map((ing: any, i: number) => (
                            <Typography key={i} sx={{ml:2}}>- {ing.name} {ing.quantity}</Typography>
                          ))}
                        </Box>
                      )}
                      {d.mainImageUrl && (
                        <Box sx={{mb:1}}>
                          <Typography>メイン画像の変更:</Typography>
                          <Box sx={{display:'flex',gap:2,alignItems:'center'}}>
                            <Box>
                              <Typography variant="caption">変更前</Typography>
                              <img src={d.mainImageUrl.before} alt="before" style={{maxWidth:80,borderRadius:4}} />
                            </Box>
                            <Typography>→</Typography>
                            <Box>
                              <Typography variant="caption">変更後</Typography>
                              <img src={d.mainImageUrl.after} alt="after" style={{maxWidth:80,borderRadius:4}} />
                            </Box>
                          </Box>
                        </Box>
                      )}
                      {d.stepsAdded && d.stepsAdded.length > 0 && (
                        <Box sx={{mb:1}}>
                          <Typography color="primary">追加された作業:</Typography>
                          {d.stepsAdded.map((s: any, i: number) => (
                            <Box key={i} sx={{ml:2, display:'flex', alignItems:'center', gap:2, mb:1}}>
                              <Typography>- {s.description}</Typography>
                              {s.imageUrl && <img src={s.imageUrl} alt="step" style={{maxWidth:60, borderRadius:4}} />}
                            </Box>
                          ))}
                        </Box>
                      )}
                      {d.stepsRemoved && d.stepsRemoved.length > 0 && (
                        <Box sx={{mb:1}}>
                          <Typography color="error">削除された作業:</Typography>
                          {d.stepsRemoved.map((s: any, i: number) => (
                            <Box key={i} sx={{ml:2, display:'flex', alignItems:'center', gap:2, mb:1}}>
                              <Typography>- {s.description}</Typography>
                              {s.imageUrl && <img src={s.imageUrl} alt="step" style={{maxWidth:60, borderRadius:4}} />}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </>
                  ) : (
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontWeight: 'bold', color: 'primary.main' }}>{d}</Typography>
                  )}
                  <Box sx={{display:'flex',gap:1,mt:1}}>
                    <Button variant="outlined" size="small" onClick={()=>{setSnapshotRecipe(h.snapshot);setSnapshotOpen(true);}}>この状態のレシピを見る</Button>
                    <Button variant="outlined" size="small" color="secondary" onClick={async () => {
                      if (!recipeContext || !id) return;
                      await recipeContext.updateRecipe(id, h.snapshot, user ? { name: user.displayName, store: user.store, userId: user.id } : undefined, 'ロールバック');
                      setHistoryOpen(false);
                    }}>この状態に戻す</Button>
                  </Box>
                </Box>
              );
            })}
        </DialogContent>
      </Dialog>

      {/* snapshotプレビューダイアログ */}
      <Dialog open={snapshotOpen} onClose={()=>setSnapshotOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>過去のレシピプレビュー</DialogTitle>
        <DialogContent>
          {snapshotRecipe && (
            <Box>
              <Typography variant="h5">{snapshotRecipe.title}</Typography>
              <Typography>{snapshotRecipe.description}</Typography>
              {snapshotRecipe.mainImageUrl && <img src={snapshotRecipe.mainImageUrl} alt="main" style={{maxWidth:200,marginTop:8}} />}
              <Typography sx={{mt:2}}>材料</Typography>
              <ul>
                {(snapshotRecipe.ingredients||[]).map((ing:any,i:number)=>(<li key={i}>{ing.name} {ing.quantity}</li>))}
              </ul>
              <Typography sx={{mt:2}}>手順</Typography>
              <ol>
                {(snapshotRecipe.steps||[]).map((s:any,i:number)=>(<li key={i}>{s.description}{s.imageUrl && <img src={s.imageUrl} alt="step" style={{maxWidth:100,marginLeft:8}} />}</li>))}
              </ol>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* PDFダウンロード用の非表示DOM */}
      {pdfReady && (
        <div style={{ position: 'absolute', left: -9999, top: -9999 }}>
          <RecipePDF ref={pdfRef} recipe={recipe} />
        </div>
      )}
    </>
  );
}

export default RecipeDetail; 