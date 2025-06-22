import React, { forwardRef } from 'react';
import { Box, Typography, Grid, Avatar, Chip } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import type { Recipe } from '../types';

interface RecipePDFProps {
  recipe: Recipe;
}

const RecipePDF = forwardRef<HTMLDivElement, RecipePDFProps>(({ recipe }, ref) => {
  const formatDate = (date: Date) => date.toLocaleString('ja-JP');

  return (
    <Box
      ref={ref}
      sx={{
        width: '210mm',
        height: '297mm',
        padding: '20mm',
        backgroundColor: 'white',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        lineHeight: 1.4,
        overflow: 'hidden'
      }}
    >
      {/* ヘッダー部分 */}
      <Box sx={{ mb: 3, borderBottom: '2px solid #333', pb: 2 }}>
        <Typography 
          data-pdf-title
          sx={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#333',
            mb: 1
          }}
        >
          {recipe.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={recipe.createdBy.photoURL || undefined} 
            sx={{ width: 32, height: 32 }}
          />
          <Box>
            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              {recipe.createdBy.name}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#666' }}>
              {formatDate(recipe.createdAt)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* メイン画像 */}
      {recipe.mainImageUrl && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <img 
            data-pdf-main-image
            src={recipe.mainImageUrl} 
            alt={recipe.title}
            style={{
              maxWidth: '100%',
              maxHeight: '120px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
        </Box>
      )}

      {/* 説明 */}
      {recipe.description && (
        <Box sx={{ mb: 3 }}>
          <Typography 
            data-pdf-description
            sx={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}
          >
            {recipe.description}
          </Typography>
        </Box>
      )}

      {/* タグ */}
      {recipe.tags && recipe.tags.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {recipe.tags.map((tag) => (
            <Chip 
              key={tag} 
              label={tag} 
              size="small" 
              sx={{ fontSize: '10px' }}
            />
          ))}
        </Box>
      )}

      {/* 材料と工程のグリッド */}
      <Grid container spacing={3}>
        {/* 材料 */}
        <Grid item xs={12} md={5}>
          <Typography 
            data-pdf-section
            sx={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              mb: 2,
              color: '#333'
            }}
          >
            材料
          </Typography>
          <Box>
            {recipe.ingredients.map((ing, index) => (
              ing.name && (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1,
                    fontSize: '12px'
                  }}
                >
                  <CheckCircle 
                    sx={{ 
                      fontSize: '14px', 
                      color: '#4CAF50', 
                      mr: 1 
                    }} 
                  />
                  <Typography sx={{ flexGrow: 1, fontSize: '12px' }}>
                    {ing.name}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#666' }}>
                    {ing.quantity}
                  </Typography>
                </Box>
              )
            ))}
          </Box>
        </Grid>

        {/* 工程 */}
        <Grid item xs={12} md={7}>
          <Typography 
            data-pdf-section
            sx={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              mb: 2,
              color: '#333'
            }}
          >
            作り方
          </Typography>
          <Box>
            {recipe.steps.map((step, index) => (
              step && (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: 2,
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    p: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        fontSize: '12px', 
                        mr: 2, 
                        bgcolor: '#1976d2',
                        flexShrink: 0
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Typography sx={{ fontSize: '12px', flexGrow: 1 }}>
                      {step.description}
                    </Typography>
                  </Box>
                  {step.imageUrl && (
                    <Box sx={{ mt: 1, pl: '32px' }}>
                      <img 
                        data-pdf-step-image
                        src={step.imageUrl} 
                        alt={`工程${index + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '80px',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
});

RecipePDF.displayName = 'RecipePDF';

export default RecipePDF; 