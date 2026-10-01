/**
 * Application Configuration
 * Maps environment variables to a structured object.
 */

export const config = {
    supabase: {
        url: import.meta.env.REACT_APP_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
        key: import.meta.env.REACT_APP_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_KEY,
    },
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
};

export default config;


