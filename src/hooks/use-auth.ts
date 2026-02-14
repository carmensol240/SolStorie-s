import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isDevModeEnabled, MOCK_DEV_USER, MOCK_DEV_SESSION, clearDevMode } from './use-dev-mode';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔧 DEV MODE: Return mock user immediately
    if (isDevModeEnabled()) {
      console.log('🔧 Dev mode: using mock user');
      setUser(MOCK_DEV_USER);
      setSession(MOCK_DEV_SESSION);
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // Preserve returnTo through OAuth flow
    const returnTo = localStorage.getItem('returnTo') || '/library';
    const redirectUrl = `${window.location.origin}/consent?returnTo=${encodeURIComponent(returnTo)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, metadata?: Record<string, string>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    
    // Auto-login after successful signup (when auto-confirm is enabled)
    if (!error && data?.user) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.warn('Auto-login after signup failed:', signInError.message);
      }
    }
    
    return { data, error };
  };

  const signOut = async () => {
    // Clear dev mode if active
    clearDevMode();
    
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email, redirectUrl },
      });
      
      if (error) {
        console.error('Password reset error:', error);
        return { error: new Error(error.message || 'Failed to send reset email') };
      }
      
      if (data?.error) {
        return { error: new Error(data.error) };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPasswordForEmail,
    updatePassword,
  };
};
