import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
         console.log('Auth state changed:', event, 'Session:', session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);



  const signInWithEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl }
    });
    return { error };
  };

const signInWithPassword = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });
};

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth` }
    });
    return { error };
  };

const checkFullVerification = async (userId: string) => {
  const { data } = await supabase
    .from('user_verifications')
    .select('phone_verified')
    .eq('user_id', userId)
    .single();

  return data?.phone_verified || false;
};

// Add this new function to useAuth.ts
const verifyUserPhone = async (userId: string, inputPhone: string) => {
  try {
    // Normalize both phone numbers for comparison
    const normalizePhone = (num: string) => num.replace(/\D/g, '').replace(/^\+?/, '');

    // Get user's stored phone number
    const { data, error } = await supabase
      .from('user_verifications')
      .select('phone_number')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('User verification record not found');

    return normalizePhone(data.phone_number) === normalizePhone(inputPhone);
  } catch (error) {
    console.error('Phone verification error:', error);
    return false;
  }
};

// Add these new methods to your useAuth.ts

const sendOtp = async (phone: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: false, // Important for sign-in flow
        channel: 'sms'
      }
    });
    return { error };
  } catch (error) {
    return { error: error as Error };
  }
};

const verifyPhoneOtp = async (phone: string, token: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    if (data?.user?.id) {
      // Update verification status in your database
      await supabase
        .from('user_verifications')
        .upsert({
          user_id: data.user.id,
          phone_number: phone,
          phone_verified: true
        });
    }
    
    return { data, error };
  } catch (error) {
    return { error: error as Error };
  }
};

const checkPhoneVerification = async (userId: string) => {
  const { data } = await supabase
    .from('user_verifications')
    .select('phone_verified')
    .eq('user_id', userId)
    .single();

  return data?.phone_verified || false;
};



  return {
    user,
    session,
    loading,
    signInWithEmail,
    signInWithPassword,
    signInWithGoogle,
    isSignedIn: !!session,
    checkFullVerification,
    verifyUserPhone,

    sendOtp,
    verifyPhoneOtp,
    checkPhoneVerification,

  };
}

