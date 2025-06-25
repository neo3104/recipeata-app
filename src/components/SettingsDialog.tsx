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
import { Close, ExpandMore, Notifications, NotificationsOff, ViewList, Search, Settings as SettingsIcon } from '@mui/icons-material';
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IconButton
                  onClick={() => {
                    handleSettingChange('notificationsEnabled', !settings.notificationsEnabled);
                    if (settings.notificationsEnabled) {
                      updateNotificationSettings({
                        recipeAdded: false,
                        recipeEdited: false,
                        recipeLiked: false,
                        recipeCommented: false,
                      });
                    } else {
                      updateNotificationSettings({
                        recipeAdded: true,
                        recipeEdited: true,
                        recipeLiked: true,
                        recipeCommented: true,
                      });
                    }
                  }}
                  color={settings.notificationsEnabled ? 'primary' : 'default'}
                  sx={{ mr: 1 }}
                >
                  <NotificationsOff />
                </IconButton>
                <Typography variant="subtitle1" sx={{ userSelect: 'none' }}>
                  通知
                  <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', display: 'inline' }}>
                    横の鈴のアイコンを押せば全ての通知を切れます
                  </Typography>
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.recipeAdded}
                    onChange={handleNotificationChange('recipeAdded')}
                    color="primary"
                    disabled={!settings.notificationsEnabled}
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
                    disabled={!settings.notificationsEnabled}
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
                    disabled={!settings.notificationsEnabled}
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
                    disabled={!settings.notificationsEnabled}
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
                <Typography variant="subtitle1">リスト表示設定</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography gutterBottom>
                レシピ一覧 1ページあたり: {settings.recipesPerPage}件
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
              <Typography gutterBottom>
                マイページ作成レシピ 1ページあたり: {settings.myRecipesPerPage}件
              </Typography>
              <Slider
                value={settings.myRecipesPerPage}
                onChange={(_, value) => handleSettingChange('myRecipesPerPage', value)}
                min={6}
                max={24}
                step={2}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />
              <Typography gutterBottom>
                操作履歴 1ページあたり: {settings.historyPerPage}件
              </Typography>
              <Slider
                value={settings.historyPerPage}
                onChange={(_, value) => handleSettingChange('historyPerPage', value)}
                min={5}
                max={30}
                step={5}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />
              <Typography gutterBottom>
                コメント 1ページあたり: {settings.commentsPerPage}件
              </Typography>
              <Slider
                value={settings.commentsPerPage}
                onChange={(_, value) => handleSettingChange('commentsPerPage', value)}
                min={5}
                max={30}
                step={5}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />
              <Typography gutterBottom>
                タグ一覧 1ページあたり: {settings.tagsPerPage}件
              </Typography>
              <Slider
                value={settings.tagsPerPage}
                onChange={(_, value) => handleSettingChange('tagsPerPage', value)}
                min={10}
                max={50}
                step={5}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />
              <Typography gutterBottom>
                通知履歴 1ページあたり: {settings.notificationsPerPage}件
              </Typography>
              <Slider
                value={settings.notificationsPerPage}
                onChange={(_, value) => handleSettingChange('notificationsPerPage', value)}
                min={5}
                max={30}
                step={5}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
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