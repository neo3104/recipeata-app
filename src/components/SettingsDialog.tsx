import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import { Close, ExpandMore, Notifications, ViewList, Search, Settings as SettingsIcon } from '@mui/icons-material';
import { useSettings, type AppSettings } from '../contexts/SettingsContext';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
  const { settings, updateSettings, updateNotificationSettings, resetToDefaults } = useSettings();

  const handleNotificationChange = (key: keyof typeof settings.notifications) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateNotificationSettings({ [key]: event.target.checked });
  };

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    updateSettings({ [key]: value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          <Typography variant="h6">設定</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications />
                <Typography variant="subtitle1">通知設定</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.recipeAdded}
                    onChange={handleNotificationChange('recipeAdded')}
                    color="primary"
                  />
                }
                label="レシピが追加されたとき通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.recipeEdited}
                    onChange={handleNotificationChange('recipeEdited')}
                    color="primary"
                  />
                }
                label="レシピが編集されたとき通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.recipeLiked}
                    onChange={handleNotificationChange('recipeLiked')}
                    color="primary"
                  />
                }
                label="レシピにいいねがついたとき通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.recipeCommented}
                    onChange={handleNotificationChange('recipeCommented')}
                    color="primary"
                  />
                }
                label="レシピにコメントがついたとき通知"
              />
            </AccordionDetails>
          </Accordion>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ViewList />
                <Typography variant="subtitle1">レシピ一覧設定</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography gutterBottom>
                1ページあたりの表示件数: {settings.recipesPerPage}件
              </Typography>
              <Slider
                value={settings.recipesPerPage}
                onChange={(_, value) => handleSettingChange('recipesPerPage', value)}
                min={6}
                max={24}
                step={6}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showRecipeImages}
                    onChange={(e) => handleSettingChange('showRecipeImages', e.target.checked)}
                    color="primary"
                  />
                }
                label="レシピ画像を表示"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showRecipeTags}
                    onChange={(e) => handleSettingChange('showRecipeTags', e.target.checked)}
                    color="primary"
                  />
                }
                label="レシピタグを表示"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showRecipeAuthor}
                    onChange={(e) => handleSettingChange('showRecipeAuthor', e.target.checked)}
                    color="primary"
                  />
                }
                label="投稿者情報を表示"
              />
            </AccordionDetails>
          </Accordion>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Search />
                <Typography variant="subtitle1">検索設定</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableFuzzySearch}
                    onChange={(e) => handleSettingChange('enableFuzzySearch', e.target.checked)}
                    color="primary"
                  />
                }
                label="あいまい検索を有効にする（ひらがな・カタカナ対応）"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.searchHistoryEnabled}
                    onChange={(e) => handleSettingChange('searchHistoryEnabled', e.target.checked)}
                    color="primary"
                  />
                }
                label="検索履歴を保存する"
              />
            </AccordionDetails>
          </Accordion>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                <Typography variant="subtitle1">その他の設定</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoSaveEnabled}
                    onChange={(e) => handleSettingChange('autoSaveEnabled', e.target.checked)}
                    color="primary"
                  />
                }
                label="自動保存を有効にする"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.confirmDelete}
                    onChange={(e) => handleSettingChange('confirmDelete', e.target.checked)}
                    color="primary"
                  />
                }
                label="削除時に確認ダイアログを表示"
              />
            </AccordionDetails>
          </Accordion>
        </Box>

        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            設定をデフォルトに戻す
          </Typography>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={resetToDefaults}
            size="small"
          >
            デフォルトに戻す
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog; 