// src/theme.js
import { createTheme } from '@mantine/core';

// 1. Sua paleta de "Azul TechFlow"
const techFlowBlue = [
  "#e5e6ff", "#b3b4ff", "#8083ff", "#4d51ff", "#1f20ff",
  "#0004f0", "#0003d9", "#0002c2", "#0002ad", "#000196"
];

export const theme = createTheme({
  primaryColor: 'techFlowBlue',
  colors: {
    techFlowBlue,
  },
  
  // 2. Define 'light' como o único tema
  defaultColorScheme: 'light', 

  components: {
    AppShell: {
      // 3. Removemos toda a lógica 'isDark'. Estes estilos são agora fixos.
      styles: (theme) => ({
        navbar: {
          background: theme.colors.techFlowBlue[7],
        },
        header: {
          background: theme.colors.techFlowBlue[7],
          borderBottom: `1px solid ${theme.colors.techFlowBlue[8]}`,
        },
        main: {
          background: theme.colors.gray[0], // Fundo Cinza Claro
        }
      }),
    },
    
    // 4. Removemos as regras de 'Paper' e 'Card' que quebravam o dark mode
    //    Elas não são mais necessárias no modo 'light'.

    NavLink: {
      styles: (theme) => ({
        root: {
          color: theme.colors.gray[3],
          borderRadius: theme.radius.md,
          padding: '12px 15px',
          marginBottom: '5px',
          transition: 'all 0.15s ease',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.1)',
            color: theme.white,
            boxShadow: `inset 3px 0 0 0 ${theme.colors.techFlowBlue[3]}`,
          },
        },
        '[data-active]': { 
          background: theme.colors.techFlowBlue[6],
          color: theme.white,
          fontWeight: 500,
          boxShadow: `inset 3px 0 0 0 ${theme.colors.techFlowBlue[2]}`,
        }
      }),
    },
    Button: {
      styles: (theme) => ({
        filled: {
          background: theme.colors.techFlowBlue[6],
        },
        light: {
          background: theme.colors.gray[1],
          color: theme.colors.dark[9],
          transition: 'background-color 0.2s ease',
          '&:hover': {
            background: theme.colors.gray[2],
          }
        }
      }),
    }
  }
});