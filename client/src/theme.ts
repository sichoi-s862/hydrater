/**
 * Hydrater Theme System
 * Centralized design tokens for colors, spacing, typography, etc.
 * Supports light and dark modes
 */

export const lightTheme = {
  colors: {
    // Primary colors
    primary: '#667eea',
    primaryHover: '#5568d3',
    primaryLight: 'rgba(102, 126, 234, 0.1)',
    secondary: '#764ba2',

    // Background colors
    background: '#ffffff',
    backgroundAlt: '#f8f9fa',
    backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

    // Text colors
    text: '#333333',
    textSecondary: '#555555',
    textMuted: '#666666',
    textLight: '#999999',
    textOnPrimary: '#ffffff',

    // Border colors
    border: '#e0e0e0',
    borderHover: '#667eea',

    // Status colors
    success: '#28a745',
    successBg: '#d4edda',
    successText: '#155724',

    error: '#dc3545',
    errorBg: '#f8d7da',
    errorText: '#721c24',

    info: '#17a2b8',
    infoBg: '#d1ecf1',
    infoText: '#0c5460',

    warning: '#ffc107',
    warningBg: '#fff3cd',
    warningText: '#856404',

    // Draft status badge colors
    statusGenerated: {
      bg: '#fff3cd',
      text: '#856404',
    },
    statusEdited: {
      bg: '#cce5ff',
      text: '#004085',
    },
    statusPublished: {
      bg: '#d4edda',
      text: '#155724',
    },
  },

  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
  },

  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    '4xl': '2.5rem', // 40px
    '5xl': '4rem',   // 64px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '20px',
    full: '9999px',
  },

  boxShadow: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.15)',
    primary: '0 4px 8px rgba(102, 126, 234, 0.3)',
  },

  transition: {
    fast: '0.15s',
    base: '0.3s',
    slow: '0.5s',
  },

  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
  },

  zIndex: {
    base: 1,
    dropdown: 10,
    modal: 100,
    toast: 1000,
  },
} as const;

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    // Dark mode overrides
    background: '#1a1a1a',
    backgroundAlt: '#2d2d2d',
    backgroundGradient: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',

    text: '#e0e0e0',
    textSecondary: '#c0c0c0',
    textMuted: '#a0a0a0',
    textLight: '#808080',

    border: '#3a3a3a',
    borderHover: '#667eea',

    // Adjust status colors for dark mode
    successBg: '#1e3a2a',
    successText: '#a3e6b8',

    errorBg: '#3a1e1e',
    errorText: '#f8a5a8',

    infoBg: '#1e2a3a',
    infoText: '#a3cce6',

    warningBg: '#3a2f1e',
    warningText: '#f8e3a8',

    statusGenerated: {
      bg: '#3a2f1e',
      text: '#f8e3a8',
    },
    statusEdited: {
      bg: '#1e2a3a',
      text: '#a3cce6',
    },
    statusPublished: {
      bg: '#1e3a2a',
      text: '#a3e6b8',
    },
  },
} as const;

export type Theme = typeof lightTheme;

// Type augmentation for Emotion
declare module '@emotion/react' {
  export interface Theme {
    colors: typeof lightTheme.colors;
    spacing: typeof lightTheme.spacing;
    fontSize: typeof lightTheme.fontSize;
    fontWeight: typeof lightTheme.fontWeight;
    borderRadius: typeof lightTheme.borderRadius;
    boxShadow: typeof lightTheme.boxShadow;
    transition: typeof lightTheme.transition;
    breakpoints: typeof lightTheme.breakpoints;
    zIndex: typeof lightTheme.zIndex;
  }
}
