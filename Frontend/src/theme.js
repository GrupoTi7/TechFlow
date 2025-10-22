// src/theme.js
import { createTheme } from '@mantine/core';

// 1. NÃO precisamos mais da paleta 'indigoBlue'.
//    Vamos usar a paleta 'blue' padrão do Mantine, que é um "azul royal" mais puro.

export const theme = createTheme({
  // 2. Mude a cor primária para 'blue'
  primaryColor: 'blue',
  
  defaultColorScheme: 'light', // Padrão é "Branco e Azul"

  components: {
    AppShell: {
      styles: (theme, props, options) => {
        const colorScheme = options?.colorScheme || 'light';
        const isDark = colorScheme === 'dark';
        return {
          // 3. Substitua 'indigoBlue' por 'blue'
          navbar: {
            background: isDark ? theme.colors.dark[7] : theme.colors.blue[8],
          },
          header: {
            background: isDark ? theme.colors.dark[7] : theme.colors.blue[8],
            borderBottom: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.blue[9]}`,
          },
          main: {
            background: isDark
              ? 'linear-gradient(180deg, #1A1B1E 0%, #101113 100%)'
              : theme.colors.gray[0],
          }
        };
      },
    },
    NavLink: {
      styles: (theme, props, options) => {
        const colorScheme = options?.colorScheme || 'light';
        return {
          root: {
            color: colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[3],
            borderRadius: theme.radius.md,
            padding: '12px 15px',
            marginBottom: '5px',
            transition: 'all 0.15s ease',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
              color: theme.white,
              // 3. Substitua 'indigoBlue' por 'blue'
              boxShadow: `inset 3px 0 0 0 ${theme.colors.blue[3]}`,
            },
          },
          '[data-active]': { 
            background: colorScheme === 'dark' ? theme.colors.blue[9] : theme.colors.blue[6],
            color: theme.white,
            fontWeight: 500,
            boxShadow: `inset 3px 0 0 0 ${theme.colors.blue[2]}`,
          }
        };
      },
    },
    Button: {
      styles: (theme, props, options) => {
        const colorScheme = options?.colorScheme || 'light';
        return {
          // 3. Substitua 'indigoBlue' por 'blue'
          filled: {
            background: theme.colors.blue[6],
          },
          light: {
            background: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1],
            color: colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.dark[9],
            transition: 'background-color 0.2s ease',
            '&:hover': {
              background: colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2],
            }
          }
        };
      },
    }
  }
});