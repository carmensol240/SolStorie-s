import { User, Session } from '@supabase/supabase-js';

/**
 * SECURITY: Dev mode is ONLY available in development builds.
 * - import.meta.env.DEV is a compile-time constant that becomes `false` in production
 * - Vite completely removes this code path in production builds
 * - Production builds (npm run build) will never have this bypass available
 */

// Check if dev mode is enabled globally - ONLY works in development builds
export const isDevModeEnabled = (): boolean => {
  // CRITICAL: import.meta.env.DEV is a compile-time constant
  // In production builds, this entire function body is dead code eliminated
  if (!import.meta.env.DEV) {
    return false;
  }
  
  // Only in development: Check URL param first
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('dev') === 'true') {
    // Persist dev mode in sessionStorage so it works across navigation
    sessionStorage.setItem('devMode', 'true');
    console.warn('⚠️ DEV MODE ENABLED - This bypass is ONLY available in development builds');
    return true;
  }
  
  // Only in development: Check sessionStorage for persistent dev mode
  if (sessionStorage.getItem('devMode') === 'true') {
    return true;
  }
  
  return false;
};

// Mock user for dev mode - using a clearly invalid UUID that will be rejected by database
// This UUID is intentionally formatted to be recognizable as a test/mock user
export const MOCK_DEV_USER: User = {
  id: 'dev-mode-user-not-for-production', // Intentionally invalid UUID to fail DB operations
  aud: 'authenticated',
  role: 'authenticated',
  email: 'devmode-local@localhost.invalid',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'], is_dev_mode: true },
  user_metadata: { display_name: 'Dev Mode User', is_dev_mode: true },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock session for dev mode
export const MOCK_DEV_SESSION: Session = {
  access_token: 'dev-mode-token-not-valid-for-api-calls',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'dev-mode-refresh-not-valid',
  user: MOCK_DEV_USER,
};

// Mock profile data for dev mode
export const MOCK_DEV_PROFILE = {
  id: 'dev-mode-user-not-for-production', // Matches MOCK_DEV_USER
  display_name: 'Dev Mode User',
  avatar_emoji: '🧪',
  story_credits: 5,
  is_subscriber: true,
  share_coins: 10,
  terms_accepted_at: new Date().toISOString(),
  terms_version: '1.0',
  daily_edit_credits: 3,
  referral_code: 'DEVMODE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Helper to clear dev mode
export const clearDevMode = () => {
  if (import.meta.env.DEV) {
    sessionStorage.removeItem('devMode');
  }
};

// Helper to enable dev mode programmatically - ONLY works in development
export const enableDevMode = () => {
  if (import.meta.env.DEV) {
    sessionStorage.setItem('devMode', 'true');
    console.warn('⚠️ DEV MODE ENABLED - This bypass is ONLY available in development builds');
  }
};
