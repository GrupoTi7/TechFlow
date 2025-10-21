// src/theme.js
import { createTheme } from '@mantine/core';

// Paleta de "Azul Escuro" (indigo)
const indigoBlue = [
  "#eef2ff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8",
  "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81"
];

export const theme = createTheme({
  primaryColor: 'indigoBlue',
  colors: {
    indigoBlue,
  },

  defaultColorScheme: 'light', // Padrão é "Branco e Azul"

  components: {
    AppShell: {
      styles: (theme) => ({
        navbar: {
          background: theme.colors.indigoBlue[8], // Nosso Azul Escuro
        },
        header: {
          background: theme.colors.indigoBlue[8], // Nosso Azul Escuro
          borderBottom: `1px solid ${theme.colors.indigoBlue[9]}`,
        },
        main: {
          background: theme.colors.gray[0], // Fundo Cinza Claro
        }
      }),
    },

    // Estilo dos LINKS DO MENU (Efeito "luz" n8n)
    NavLink: {
      styles: (theme) => ({
        // 'root' é o estilo base do link
        root: {
          color: theme.colors.gray[3], // Texto do menu (cinza claro sobre azul)
          borderRadius: theme.radius.md,
          padding: '12px 15px', // Opções de menu maiores
          marginBottom: '5px',
          transition: 'all 0.15s ease',

          // Efeito HOVER "n8n-like"
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.1)', // Brilho branco subtil
            color: theme.white, // Texto fica branco no hover
            boxShadow: `inset 3px 0 0 0 ${theme.colors.indigoBlue[3]}`, // Efeito "luz" lateral
          },
        },
        // --- A CORREÇÃO ESTÁ AQUI ---
        // Estilo do link ATIVO (quando a rota corresponde)
        // Usamos a sintaxe de seletor de dados correta
        '[data-active]': { 
          background: theme.colors.indigoBlue[6],
          color: theme.white,
          fontWeight: 500,
          boxShadow: `inset 3px 0 0 0 ${theme.colors.indigoBlue[2]}`,
        }
      })
    },

    Button: {
      // ... (O estilo dos botões estava correto)
    }
  }
});