// src/theme.js
import { createTheme } from '@mantine/core';

// 1. Paleta de "Azul Escuro" (indigo)
const indigoBlue = [
  "#eef2ff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8",
  "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81"
];

export const theme = createTheme({
  primaryColor: 'indigoBlue',
  colors: {
    indigoBlue,
  },

  // 2. Definir "light" (Branco) como o único tema
  defaultColorScheme: 'light', 

  components: {
    AppShell: {
      // 3. Removemos a lógica de 'colorScheme'
      // A barra lateral e o cabeçalho serão SEMPRE azuis
      styles: (theme) => ({
        navbar: {
          background: theme.colors.indigoBlue[8], // Nosso Azul Escuro
        },
        header: {
          background: theme.colors.indigoBlue[8], // Nosso Azul Escuro
          borderBottom: `1px solid ${theme.colors.indigoBlue[9]}`,
        },
        main: {
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)', // Gradiente claro
        }
      }),
    },

    // Estilo dos LINKS DO MENU (Efeito "luz" n8n)
    NavLink: {
      styles: (theme) => ({
        root: {
          color: theme.colors.gray[3], // Texto do menu (cinza claro sobre azul)
          borderRadius: theme.radius.md,
          padding: '12px 15px', // Opções de menu maiores
          marginBottom: '5px',
          transition: 'all 0.15s ease',

          '&:hover': {
            background: 'rgba(255, 255, 255, 0.1)', // Brilho branco subtil
            color: theme.white, // Texto fica branco no hover
            boxShadow: `inset 3px 0 0 0 ${theme.colors.indigoBlue[3]}`, // Efeito "luz" lateral
          },
          '&[data-active]': {
            background: theme.colors.indigoBlue[6],
            color: theme.white,
            fontWeight: 500,
            boxShadow: `inset 3px 0 0 0 ${theme.colors.indigoBlue[2]}`,
          }
        }
      })
    },

    // Estilo dos BOTÕES DE FILTRO
    Button: {
      styles: (theme) => ({
        filled: {
          background: theme.colors.indigoBlue[6],
        },
        light: {
          background: theme.colors.gray[1],
          color: theme.colors.dark[9],
          transition: 'background-color 0.2s ease',
          '&:hover': {
            background: theme.colors.gray[2],
          }
        }
      })
    }
  }
});