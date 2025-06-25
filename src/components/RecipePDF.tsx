import { forwardRef } from 'react';
import { Box, Typography, Grid, Avatar, Chip } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import type { Recipe } from '../types';
import { getAutoLayoutConfig } from '../utils/pdfUtils';

interface RecipePDFProps {
  recipe: Recipe;
}

const RecipePDF = forwardRef<HTMLDivElement, RecipePDFProps>(({ recipe }, ref) => {
  const layout = getAutoLayoutConfig(recipe);
  const formatDate = (date: Date) => date.toLocaleString('ja-JP');

  // steps配列の中身をデバッグ出力
  console.log('PDF steps:', recipe.steps);

  return (
    <Box
      ref={ref}
      sx={{
        width: '794px', // A4横幅
        maxWidth: '100%',
        margin: '0 auto',
        padding: '40px 32px',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        lineHeight: 1.7,
        // height, overflowは指定しない
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}
    >
      {/* ヘッダー＋メイン画像 2カラムレイアウト */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 4, mb: 4 }}>
        {/* 左カラム */}
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Typography 
            data-pdf-title
            sx={{ 
              fontSize: '2.2rem', 
              fontWeight: 'bold', 
              color: '#333',
              mb: 2,
              wordBreak: 'break-word'
            }}
          >
            {recipe.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar 
              src={recipe.createdBy.photoURL || undefined} 
              sx={{ width: 36, height: 36 }}
            />
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold', mr: 2, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {recipe.createdBy.name}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#666', flexShrink: 0 }}>
              {formatDate(recipe.createdAt)}
            </Typography>
          </Box>
          {recipe.tags && recipe.tags.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {recipe.tags.map((tag) => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  size="small" 
                  sx={{ fontSize: '0.95rem', bgcolor: '#f5f5f5', color: '#333', wordBreak: 'break-word' }}
                />
              ))}
            </Box>
          )}
          {recipe.description && (
            <Typography 
              data-pdf-description
              sx={{ fontSize: '1.1rem', whiteSpace: 'pre-wrap', color: '#444', mb: 1, wordBreak: 'break-word' }}
            >
              {recipe.description}
            </Typography>
          )}
        </Box>
        {/* 右カラム：メイン画像 */}
        {recipe.mainImageUrl && (
          <Box sx={{
            width: '420px',
            minWidth: '220px',
            maxWidth: '60%',
            minHeight: '220px',
            maxHeight: '480px',
            aspectRatio: '4/3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafbfc',
            borderRadius: '10px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
            p: 1
          }}>
            <img 
              data-pdf-main-image
              src={recipe.mainImageUrl} 
              alt={recipe.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </Box>
        )}
      </Box>

      {/* 材料と工程のグリッド */}
      <Grid container spacing={4}>
        {/* 材料 */}
        <Grid item xs={12} md={5}>
          <Typography 
            data-pdf-section
            sx={{ 
              fontSize: '1.3rem', 
              fontWeight: 'bold', 
              mb: 2,
              color: '#333',
              borderBottom: '1.5px solid #bbb',
              pb: 1
            }}
          >
            材料
          </Typography>
          <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px' }}>
            {recipe.ingredients.map((ing, index) => (
              ing.name && (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '1.05rem',
                    position: 'relative',
                    minHeight: '1.8em'
                  }}
                >
                  <CheckCircle 
                    sx={{ 
                      fontSize: '1.2rem', 
                      color: '#4CAF50', 
                      mr: 1 
                    }} 
                  />
                  <Typography sx={{ flex: 1 }}>{ing.name}</Typography>
                  <Typography sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#666',
                    whiteSpace: 'nowrap',
                    fontSize: '1.05rem',
                    pointerEvents: 'none'
                  }}>{ing.quantity}</Typography>
                </Box>
              )
            ))}
          </Box>
        </Grid>

        {/* 合計欄を追加 */}
        {recipe.total && (
          <Grid item xs={12} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mt: 1, mb: 1 }}>
              <Typography variant="subtitle1" sx={{ mr: 2, fontSize: '1.05rem' }}>合計</Typography>
              <Typography variant="body1" sx={{ fontSize: '1.05rem' }}>{recipe.total}</Typography>
            </Box>
          </Grid>
        )}

        {/* 工程 */}
        <Grid item xs={12} md={7}>
          <Typography 
            data-pdf-section
            sx={{ 
              fontSize: '1.3rem', 
              fontWeight: 'bold', 
              mb: 2,
              color: '#333',
              borderBottom: '1.5px solid #bbb',
              pb: 1
            }}
          >
            作り方
          </Typography>
          <Box>
            {recipe.steps
              .filter((step: any) => step && step.description)
              .map((step: any, index: number) => (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: 3,
                    border: '1.5px solid #e0e0e0',
                    borderRadius: '10px',
                    p: 2.5,
                    background: '#fafbfc',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '200px'
                  }}
                >
                  {/* 左：画像 */}
                  {step.imageUrl ? (
                    <Box sx={{
                      flexShrink: 0,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      mr: 3
                    }}>
                      <img
                        data-pdf-step-image
                        src={step.imageUrl}
                        alt={`工程${index + 1}`}
                        style={{
                          height: '100%',
                          width: 'auto',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          boxShadow: '0 1px 6px rgba(0,0,0,0.06)'
                        }}
                      />
                    </Box>
                  ) : null}
                  {/* 右：番号＋説明 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        fontSize: '1.1rem', 
                        mr: 2, 
                        bgcolor: '#1976d2',
                        flexShrink: 0
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Typography sx={{ fontSize: '1.05rem', color: '#333', flex: 1 }}>
                      {step.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
});

RecipePDF.displayName = 'RecipePDF';

export default RecipePDF; 