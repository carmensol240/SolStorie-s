import { User, Session } from '@supabase/supabase-js';

// Check if dev mode is enabled globally
export const isDevModeEnabled = (): boolean => {
  // Check URL param first
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('dev') === 'true' && import.meta.env.DEV) {
    // Persist dev mode in sessionStorage so it works across navigation
    sessionStorage.setItem('devMode', 'true');
    return true;
  }
  
  // Check sessionStorage for persistent dev mode
  if (import.meta.env.DEV && sessionStorage.getItem('devMode') === 'true') {
    return true;
  }
  
  return false;
};

// Mock user for dev mode
export const MOCK_DEV_USER: User = {
  id: 'dev-user-12345',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'testuser@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { display_name: 'Test User' },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock session for dev mode
export const MOCK_DEV_SESSION: Session = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token',
  user: MOCK_DEV_USER,
};

// Mock profile data for dev mode
export const MOCK_DEV_PROFILE = {
  id: 'dev-user-12345',
  display_name: 'Test User',
  avatar_emoji: '🧪',
  story_credits: 5,
  is_subscriber: true,
  share_coins: 10,
  terms_accepted_at: new Date().toISOString(),
  terms_version: '1.0',
  daily_edit_credits: 3,
  referral_code: 'TESTCODE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Helper to clear dev mode
export const clearDevMode = () => {
  sessionStorage.removeItem('devMode');
};

// Helper to enable dev mode programmatically
export const enableDevMode = () => {
  if (import.meta.env.DEV) {
    sessionStorage.setItem('devMode', 'true');
  }
};
