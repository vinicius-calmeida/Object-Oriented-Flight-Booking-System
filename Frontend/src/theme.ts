/**
 * theme.ts
 * --------
 * Tema customizado do Material UI (MUI) para toda a aplicação.
 *
 * Centralizar o tema aqui garante consistência visual: cores,
 * tipografia e o arredondamento de cantos (border radius) usados em
 * todos os componentes MUI (botões, cards, campos de texto, etc.)
 * vêm deste único arquivo, em vez de serem definidos individualmente
 * em cada componente.
 *
 * Paleta escolhida: tons de azul (associados a céu/aviação) como cor
 * primária, e um dourado/âmbar como cor secundária para destacar
 * elementos relacionados a VIP (badges, botões de upgrade, etc.),
 * reforçando visualmente a diferença entre usuário padrão e VIP.
 */

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0B5FA5", // azul aviação
      dark: "#073D6B",
      light: "#4B8FCB",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#D4A017", // dourado, usado para destacar elementos VIP
      dark: "#A87D0E",
      light: "#E3C158",
      contrastText: "#1A1A1A",
    },
    error: {
      main: "#C62828",
    },
    warning: {
      main: "#ED6C02",
    },
    success: {
      main: "#2E7D32",
    },
    background: {
      default: "#F4F6F8",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: ['"Roboto"', '"Helvetica"', '"Arial"', "sans-serif"].join(","),
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    // Customizações finas de componentes específicos do MUI, para que
    // o app não pareça "o Material UI padrão de tutorial".
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 8px rgba(0,0,0,0.12)",
        },
      },
    },
  },
});
