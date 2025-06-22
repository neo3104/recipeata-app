import { useParams, useNavigate } from 'react-router-dom';
import { useContext, useState, useRef } from 'react';
import { RecipeContext } from '../contexts/RecipeContext';
import { UserContext } from '../contexts/UserContext';
import { generateRecipePDF, waitForImages } from '../utils/pdfUtils';
import RecipePDF from '../components/RecipePDF';
import type { Comment } from '../types';
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
} from '@mui/material';
import { Delete, ArrowBack, Edit, Favorite, FavoriteBorder, Send, CheckCircle, PictureAsPdf } from '@mui/icons-material';

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const recipeContext = useContext(RecipeContext);
  const userContext = useContext(UserContext);
  
  const [commentText, setCommentText] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  if (!recipeContext || !userContext) {
    return <p>読み込み中...</p>;
  }

  const { recipes, loading, error, deleteRecipe, toggleLike, addComment } = recipeContext;
  const { user } = userContext;

  const recipe = recipes.find(r => r.id === id);

  const isAuthor = recipe && user && recipe.createdById === user.id;
  const isSameStore = recipe && user && recipe.createdBy?.store && user.store && recipe.createdBy.store === user.store;
  const canEdit = isAuthor || isSameStore;

  const hasLiked = user?.id ? recipe?.likes.includes(user.id) : false;

  const handleLike = () => {
    if (!id || !user?.id) return;
    toggleLike(id, user.id);
  };

  const handleAddComment = () => {
    if (!id || !user || !commentText.trim()) return;
    
    const newComment: Omit<Comment, 'id' | 'createdAt'> = {
      text: commentText.trim(),
      userId: user.id,
      createdBy: {
        name: user.displayName,
        photoURL: user.photoURL,
      },
    };

    addComment(id, newComment);
    setCommentText('');
  };
  
  const handleDelete = async () => {
    if(!id) return;
    if (window.confirm("このレシピを本当に削除しますか？")) {
        try {
            await deleteRecipe(id);
            navigate('/');
        } catch (e) {
            console.error(e);
            alert("削除に失敗しました。");
        }
    }
  }

  const handleGeneratePDF = async () => {
    if (!recipe || !pdfRef.current) {
      console.error('PDF生成に必要な要素が見つかりません');
      setPdfError('PDF生成に必要な要素が見つかりません');
      return;
    }
    
    setIsGeneratingPDF(true);
    setPdfError(null);
    
    try {
      console.log('PDF生成開始:', recipe.title);
      
      // 画像の読み込みを待つ
      console.log('画像の読み込みを待機中...');
      await waitForImages(pdfRef.current);
      console.log('画像の読み込み完了');
      
      // PDFを生成
      console.log('PDF生成中...');
      await generateRecipePDF(recipe, pdfRef.current);
      console.log('PDF生成完了');
      
    } catch (error) {
      console.error('PDF生成エラー:', error);
      setPdfError(`PDFの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const formatDate = (date: Date) => date.toLocaleString('ja-JP');

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
  
  if (!recipe) return <Typography sx={{textAlign: 'center', mt: 4}}>レシピが見つかりません。</Typography>;

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
          <Typography variant="h3" component="h1" gutterBottom>
            {recipe.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2}}>
            <Avatar src={recipe.createdBy.photoURL || undefined} />
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
              {recipe.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Box>
          )}

          <Grid container spacing={4} sx={{ my: 2 }}>
            <Grid item xs={12} md={5}>
              <Typography variant="h5" gutterBottom>材料</Typography>
              <List>
                {recipe.ingredients.map((ing, index) => (
                  ing.name && <ListItem key={index} disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                    <ListItemText primary={ing.name} secondary={ing.quantity} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="h5" gutterBottom>作り方</Typography>
              <List sx={{p: 0}}>
                {recipe.steps.map((step, index) => (
                  step && <ListItem key={index} alignItems="flex-start" sx={{flexDirection: 'column', mb: 2}}>
                    <Box sx={{display: 'flex', width: '100%', mb: step.imageUrl ? 1 : 0}}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '1rem', mr: 2, bgcolor: 'primary.main', flexShrink: 0 }}>{index + 1}</Avatar>
                      <ListItemText primary={<Typography>{step.description}</Typography>} />
                    </Box>
                    {step.imageUrl && (
                      <Box 
                        component="img" 
                        src={step.imageUrl} 
                        alt={`工程${index + 1}`}
                        sx={{ width: '100%', borderRadius: 1, mt: 1, pl: '56px' /* Avatar + margin */}} 
                      />
                    )}
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </Paper>

        <Paper id="recipe-actions-section" sx={{ p: { xs: 2, md: 4 }, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="primary" onClick={handleLike} disabled={!user}>
                {hasLiked ? <Favorite sx={{color: 'red'}} /> : <FavoriteBorder />}
            </IconButton>
            <Typography variant="body2">{recipe.likes.length} いいね</Typography>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>コメント ({recipe.comments.length})</Typography>
          {user && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2}}>
                  <Avatar src={user.photoURL || undefined} />
                  <TextField 
                      fullWidth 
                      variant='outlined' 
                      label="コメントを追加"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <IconButton color="primary" onClick={handleAddComment} disabled={!commentText.trim()}>
                      <Send />
                  </IconButton>
              </Box>
          )}
          <List>
              {recipe.comments.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()).map((comment) => (
              <ListItem key={comment.id} alignItems="flex-start">
                  <Avatar src={comment.createdBy.photoURL || undefined} sx={{ mr: 2 }} />
                  <ListItemText
                    primary={comment.createdBy.name}
                    secondary={
                        <>
                        <Typography component="span" variant="body2" color="text.primary">
                            {comment.text}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                            {formatDate(comment.createdAt)}
                        </Typography>
                        </>
                    }
                  />
              </ListItem>
              ))}
          </List>
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
          <Box sx={{ 
            transform: 'scale(0.5)', 
            transformOrigin: 'top left',
            width: '200%',
            height: '200%'
          }}>
            <RecipePDF ref={pdfRef} recipe={recipe} />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RecipeDetail; 