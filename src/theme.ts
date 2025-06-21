import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// アプリのカスタムテーマ（近未来風オレンジ・ライトモード）
let theme = createTheme({
  palette: {
    mode: 'light', // ダークモードからライトモードへ変更
    primary: {
      main: '#f57c00', // Accent color to vibrant orange
    },
    background: {
      default: '#fff3e0', // Background to light orange
      paper: 'rgba(255, 255, 255, 0.7)', // Paper for cards
    },
  },
  typography: {
    fontFamily: [
      '"Noto Sans JP"',
      'Roboto',
      '"Helvetica"',
      'Arial',
      'sans-serif',
    ].join(','),
    h2: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 243, 224, 0.8)', // Semi-transparent AppBar for light theme
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.7)', // Lighter glassmorphism for light theme
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 25px rgba(245, 124, 0, 0.5)', // Orange glow effect
           },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          // For search bar
          backgroundColor: 'rgba(255, 255, 255, 0.9) !important'
        }
      }
    }
  },
});

theme = responsiveFontSizes(theme);

export default theme; 