/**
 * Deprecated Root API Service
 * In accordance with Clean Architecture and security best practices,
 * all service layer logic has been migrated to `src/services/api/`
 * and relies entirely on environment variables without any hardcoded secrets.
 */
export * from './src/services/api/index.js';
