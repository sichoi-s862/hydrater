/**
 * Environment variable validation utility
 * Ensures required environment variables are set before app starts
 */

interface EnvConfig {
  API_BASE_URL: string;
  APP_ENV: string;
  ENABLE_ANALYTICS: boolean;
}

/**
 * Validate and parse environment variables
 * @throws Error if required variables are missing in production
 */
export function validateEnv(): EnvConfig {
  const env = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
    APP_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development',
    ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  };

  // In production, validate required variables
  if (import.meta.env.PROD) {
    const requiredVars: Array<keyof typeof env> = ['APP_ENV'];

    const missing = requiredVars.filter((key) => !env[key]);

    if (missing.length > 0) {
      const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  } else {
    // Log env config in development
    console.log('Environment configuration:', {
      ...env,
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
      dev: import.meta.env.DEV,
    });
  }

  return env;
}

/**
 * Get environment configuration
 * Safe to call after validateEnv()
 */
export function getEnv(): EnvConfig {
  return {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
    APP_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development',
    ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  };
}

/**
 * Check if running in production
 */
export const isProduction = () => import.meta.env.PROD;

/**
 * Check if running in development
 */
export const isDevelopment = () => import.meta.env.DEV;
