import { useParams, useNavigate } from 'react-router-dom';
import { useRecipes } from '../contexts/RecipeContext';
import { useUser } from '../contexts/UserContext';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  ListItemAvatar,
  Collapse,
} from '@mui/material';
import { Delete, ArrowBack, Edit, PictureAsPdf, Favorite, FavoriteBorder, Send, Reply, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recipes, deleteRecipe, addLike, removeLike, addComment, deleteComment, addReply, deleteReply, addToRecentlyViewed } = useRecipes();
  const { user } = useUser();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState<{ [commentId: string]: string }>({});
  const [expandedReplies, setExpandedReplies] = useState<{ [commentId: string]: boolean }>({});
  const pdfRef = useRef<HTMLDivElement>(null);

  const recipe = recipes.find(r => r.id === id);

  // レシピ詳細ページを開いたときに最近見たレシピに追加
  useEffect(() => {
    if (id) {
      addToRecentlyViewed(id);
    }
  }, [id, addToRecentlyViewed]);

  // 編集権限チェック
  const canEdit = recipe && user && recipe.author === user.name && recipe.store === user.store;

  // 削除権限チェック
  const canDelete = recipe && user && recipe.author === user.name && recipe.store === user.store;

  // いいね済みかチェック
  const hasLiked = recipe && user && recipe.likes.some(like => 
    like.userId === `${user.name}-${user.store}`
  );

  // いいね処理
  const handleLike = () => {
    if (!recipe || !user) {
      alert('いいねするにはログインしてください');
      return;
    }
    
    if (hasLiked) {
      removeLike(recipe.id, user.name, user.store);
    } else {
      addLike(recipe.id, user.name, user.store);
    }
  };

  // コメント投稿処理
  const handleAddComment = () => {
    if (!recipe || !user) {
      alert('コメントするにはログインしてください');
      return;
    }
    
    if (!commentText.trim()) {
      alert('コメントを入力してください');
      return;
    }
    
    addComment(recipe.id, user.name, user.store, commentText);
    setCommentText('');
  };

  // 返信投稿処理
  const handleAddReply = (commentId: string) => {
    if (!recipe || !user) {
      alert('返信するにはログインしてください');
      return;
    }
    
    const replyText = replyTexts[commentId];
    if (!replyText || !replyText.trim()) {
      alert('返信を入力してください');
      return;
    }
    
    addReply(recipe.id, commentId, user.name, user.store, replyText);
    setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
  };

  // コメント削除処理
  const handleDeleteComment = (commentId: string) => {
    if (!recipe) return;
    if (confirm('このコメントを削除しますか？')) {
      deleteComment(recipe.id, commentId);
    }
  };

  // 返信削除処理
  const handleDeleteReply = (commentId: string, replyId: string) => {
    if (!recipe) return;
    if (confirm('この返信を削除しますか？')) {
      deleteReply(recipe.id, commentId, replyId);
    }
  };

  // 返信の展開/折りたたみ
  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // 日時フォーマット
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // デバッグ用の情報を表示
  console.log('Current user:', user);
  console.log('Recipe author:', recipe?.author);
  console.log('Recipe store:', recipe?.store);
  console.log('Can edit:', canEdit);

  if (!recipe) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" gutterBottom>
            レシピが見つかりませんでした
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            レシピ一覧に戻る
          </Button>
        </Box>
      </Container>
    );
  }

  const handleDeleteClick = () => {
    if (!canDelete) {
      alert('このレシピを削除する権限がありません。同じ店舗のレシピのみ削除できます。');
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteRecipe(recipe.id);
    setDeleteDialogOpen(false);
    navigate('/');
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // PDF出力処理
  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    // A4サイズ: 210mm x 297mm = 595 x 842pt (1pt=1/72inch)
    const a4Width = 595.28;
    const a4Height = 841.89;

    // まずcanvas化
    const canvas = await html2canvas(pdfRef.current, {
      scale: 2, // 高解像度化
      backgroundColor: '#fff',
      useCORS: true,
      windowWidth: pdfRef.current.scrollWidth,
      windowHeight: pdfRef.current.scrollHeight,
    });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    // canvasのサイズをA4にフィットさせる
    const contentWidth = canvas.width;
    const contentHeight = canvas.height;
    // A4一枚に収めるための縮小率
    const ratio = Math.min(a4Width / contentWidth, a4Height / contentHeight);
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const imgWidth = contentWidth * ratio;
    const imgHeight = contentHeight * ratio;
    const x = (a4Width - imgWidth) / 2;
    const y = (a4Height - imgHeight) / 2;
    pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
    pdf.save(`${recipe.title || 'レシピ'}.pdf`);
  };

  return (
    <Container maxWidth="md">
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {recipe.title}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdf />}
          onClick={handleExportPDF}
          sx={{ mr: 1 }}
        >
          PDFで保存
        </Button>
        {canEdit && (
          <IconButton 
            color="primary" 
            onClick={() => navigate(`/recipe/${recipe.id}/edit`)}
            sx={{ mr: 1 }}
          >
            <Edit />
          </IconButton>
        )}
        {canDelete && (
          <IconButton color="error" onClick={handleDeleteClick}>
            <Delete />
          </IconButton>
        )}
      </Box>

      {/* PDF化する範囲 */}
      <div ref={pdfRef} style={{ background: '#fff', padding: 24 }}>
        {/* レシピタイトル */}
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            textAlign: 'center', 
            mb: 4, 
            fontWeight: 'bold',
            color: '#333'
          }}
        >
          {recipe.title}
        </Typography>

        {/* メイン画像 */}
        {recipe.mainImageUrl && (
          <Card sx={{ mb: 4 }}>
            <CardMedia
              component="img"
              height="400"
              image={recipe.mainImageUrl}
              alt={recipe.title}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        )}

        {/* レシピ情報 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: '1 1 400px' }}>
            <Typography variant="h6" gutterBottom>
              レシピの説明
            </Typography>
            <Typography variant="body1" paragraph>
              {recipe.description}
            </Typography>
          </Box>
          <Box sx={{ flex: '0 1 300px' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  調理時間: {recipe.totalTime}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  分量: {recipe.servings}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                作者: {recipe.author}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                店舗: {recipe.store}
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* タグ */}
        {recipe.tags.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              タグ
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {recipe.tags.map((tag, index) => (
                <Chip key={index} label={tag} color="primary" />
              ))}
            </Box>
          </Box>
        )}

        {/* 材料 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            材料
          </Typography>
          <Paper>
            <List>
              {recipe.ingredients.map((ingredient, index) => (
                <ListItem key={ingredient.id}>
                  <ListItemText
                    primary={`${ingredient.name} ${ingredient.quantity}`}
                    primaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        {/* 作り方 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            作り方
          </Typography>
          {recipe.steps.map((step, index) => (
            <Card key={step.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.5,
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {index + 1}
                    </Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" paragraph>
                      {step.description}
                    </Typography>
                    {step.imageUrl && (
                      <Box sx={{ mt: 2 }}>
                        <img
                          src={step.imageUrl}
                          alt={`ステップ${index + 1}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* ワンポイントアドバイス */}
        {recipe.advice && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              ワンポイントアドバイス
            </Typography>
            <Paper sx={{ p: 3, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="body1">
                {recipe.advice}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* いいね・コメントセクション */}
        <Divider sx={{ my: 4 }} />
        
        {/* いいね */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton 
              onClick={handleLike}
              color={hasLiked ? 'error' : 'default'}
              size="large"
            >
              {hasLiked ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1 }}>
              いいね ({recipe.likes.length})
            </Typography>
          </Box>
          
          {/* いいねした人一覧 */}
          {recipe.likes.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                いいねした人:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {recipe.likes.map((like, index) => (
                  <Chip
                    key={like.userId}
                    label={`${like.userName} (${like.userStore})`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* コメント */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            コメント ({recipe.comments.length})
          </Typography>
          
          {/* コメント投稿フォーム */}
          {user && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="コメントを入力してください..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={handleAddComment}
                disabled={!commentText.trim()}
              >
                コメントを投稿
              </Button>
            </Box>
          )}
          
          {/* コメント一覧 */}
          {recipe.comments.length > 0 ? (
            <List>
              {recipe.comments.map((comment) => (
                <ListItem key={comment.id} alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <ListItemAvatar>
                      <Avatar>{comment.userName.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">
                            {comment.userName} ({comment.userStore})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(comment.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {comment.content}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {/* 自分のコメントは削除可能 */}
                            {user && comment.userId === `${user.name}-${user.store}` && (
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                削除
                              </Button>
                            )}
                            {/* 返信ボタン */}
                            {user && (
                              <Button
                                size="small"
                                startIcon={<Reply />}
                                onClick={() => toggleReplies(comment.id)}
                              >
                                返信
                              </Button>
                            )}
                            {/* 返信数表示 */}
                            {comment.replies.length > 0 && (
                              <Button
                                size="small"
                                onClick={() => toggleReplies(comment.id)}
                                endIcon={expandedReplies[comment.id] ? <ExpandLess /> : <ExpandMore />}
                              >
                                返信 ({comment.replies.length})
                              </Button>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </Box>

                  {/* 返信フォーム */}
                  {user && expandedReplies[comment.id] && (
                    <Box sx={{ ml: 4, mt: 2, width: '100%' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="返信を入力してください..."
                        value={replyTexts[comment.id] || ''}
                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Send />}
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyTexts[comment.id]?.trim()}
                      >
                        返信を投稿
                      </Button>
                    </Box>
                  )}

                  {/* 返信一覧 */}
                  {comment.replies.length > 0 && (
                    <Collapse in={expandedReplies[comment.id]} timeout="auto" unmountOnExit>
                      <List sx={{ ml: 4, mt: 1 }}>
                        {comment.replies.map((reply) => (
                          <ListItem key={reply.id} sx={{ pl: 0 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                {reply.userName.charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {reply.userName} ({reply.userStore})
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(reply.timestamp)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {reply.content}
                                  </Typography>
                                  {/* 自分の返信は削除可能 */}
                                  {user && reply.userId === `${user.name}-${user.store}` && (
                                    <Button
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteReply(comment.id, reply.id)}
                                      sx={{ mt: 0.5 }}
                                    >
                                      削除
                                    </Button>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              まだコメントがありません。最初のコメントを投稿してみましょう！
            </Typography>
          )}
        </Box>
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>レシピを削除</DialogTitle>
        <DialogContent>
          <Typography>
            このレシピを削除してもよろしいですか？この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>キャンセル</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default RecipeDetail; 