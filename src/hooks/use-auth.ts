import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isDevModeEnabled, MOCK_DEV_USER, MOCK_DEV_SESSION, clearDevMode } from './use-dev-mode';
import { clearAllUserData, migrateToUserScoped } from '@/lib/user-storage';

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
    // Guard against getSession() hanging indefinitely (e.g. flaky network,
    // in-app webviews). Force loading=false after 10s no matter what.
    const SESSION_TIMEOUT_MS = 10000;
    const timeoutId = setTimeout(() => {
      console.warn('[useAuth] getSession() timed out after 10s — forcing loading=false');
      setLoading(false);
    }, SESSION_TIMEOUT_MS);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Migrate legacy localStorage data to user-scoped keys
        if (session?.user?.id) {
          migrateToUserScoped(session.user.id);
        }
      })
      .catch((err) => {
        console.warn('[useAuth] getSession() rejected:', err);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback'
        }
      });
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
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

      // Send welcome email (fire-and-forget)
      supabase.functions.invoke('send-welcome-email', {
        body: { email, displayName: metadata?.display_name || '' },
      }).catch((err) => console.warn('Welcome email failed:', err));
    }
    
    return { data, error };
  };

  const signOut = async () => {
    // Clear dev mode if active
    clearDevMode();
    // Clear ALL user-scoped personal data from localStorage
    clearAllUserData();
    
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
