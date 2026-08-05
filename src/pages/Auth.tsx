import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, Loader2, Eye, EyeOff, KeyRound, FileText, Shield, CheckCircle2, Sparkles, Heart, Users, Camera, Check, ArrowRight, RefreshCw, Smartphone, Tablet, Monitor, X } from "lucide-react";
import MobileNavigation from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
// Logo is now text-based with rainbow gradient
import { useAnalytics } from "@/hooks/use-analytics";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
// Background is now CSS-only (adventure sky theme)

const emailSchema = z.string().email("כתובת אימייל לא תקינה");
const passwordSchema = z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים");
const TERMS_VERSION = "1.0";
const PROFILE_QUERY_TIMEOUT_MS = 8000;
const AUTH_GATE_TIMEOUT_MS = 12000;
const GOOGLE_SIGNIN_ENABLED = false;

const withTimeout = <T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    Promise.resolve(promise).then(
      (value) => {
        window.clearTimeout(t);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(t);
        reject(error);
      },
    );
  });

const Auth = () => {
  const navigate = useNavigate();
  const handleGoBack = () => navigate("/");
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const { user, loading, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth();
  
  const [email, setEmail] = useState(() => localStorage.getItem('saved_login_email') || "");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showEmailVerificationMessage, setShowEmailVerificationMessage] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  
  // Consent step state
  const [showConsentStep, setShowConsentStep] = useState(false);
  const [showTrialOfferStep, setShowTrialOfferStep] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [isParentConsent, setIsParentConsent] = useState(false);
  const [checkingTerms, setCheckingTerms] = useState(false);
  const [authGateStuck, setAuthGateStuck] = useState(false);
  const [authGateError, setAuthGateError] = useState<string | null>(null);
  
  // Signup terms consent (inline in registration form)
  const [signupTermsAccepted, setSignupTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('saved_login_email'));
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // User role selection
  const [userRole, setUserRole] = useState<"parent" | "educator">("parent");
  const [referralCodeInput, setReferralCodeInput] = useState("");
  
  // Profile data for trial offer
  const [displayName, setDisplayName] = useState<string>("");
  const [storyCredits, setStoryCredits] = useState<number>(1);
  
  // Child photo upload state
  const [childPhoto, setChildPhoto] = useState<string | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewStep, setPreviewStep] = useState<"upload" | "preview" | "saved">("upload");
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle child photo upload - generate 3D preview first
  const handleChildPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setGeneratingPreview(true);
    
    try {
      // 1. Convert to base64
      const base64 = await fileToBase64(file);
      setOriginalPhoto(base64);
      
      // 2. Call Edge Function to generate 3D preview
      const { data, error } = await supabase.functions.invoke('preview-child-avatar', {
        body: { childPhoto: base64 }
      });
      
      if (error) throw error;
      if (!data?.previewUrl) throw new Error("No preview generated");
      
      setPreviewPhoto(data.previewUrl);
      setPreviewStep("preview");
      
    } catch (error) {
      console.error('Preview generation error:', error);
      toast({
        title: "שגיאה ביצירת התצוגה המקדימה",
        description: "נסו שוב או המשיכו בלי תמונה",
        variant: "destructive",
      });
      setOriginalPhoto(null);
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Confirm and save the photo
  const handleConfirmPhoto = async () => {
    if (!user || !originalPhoto) return;
    
    setUploadingPhoto(true);
    
    try {
      // Convert base64 to blob for upload using direct atob() method (more reliable)
      const base64Content = originalPhoto.includes(',') 
        ? originalPhoto.split(',')[1] 
        : originalPhoto;
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      // 1. Upload to Storage
      const fileName = `${user.id}/default-child.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('child-photos')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
      
      if (uploadError) throw uploadError;
      
      // 2. Store file path (not public URL) for private bucket security
      // Signed URLs will be fetched when displaying
      
      // 3. Save to children table with file path
      const { error: upsertError } = await supabase.from('children').upsert({
        user_id: user.id,
        name: 'הילד/ה שלי',
        age: 5,
        gender: 'boy',
        photo_url: fileName,
      }, { onConflict: 'user_id,name' });
      
      if (upsertError) {
        await supabase.from('children').insert({
          user_id: user.id,
          name: 'הילד/ה שלי',
          age: 5,
          gender: 'boy',
          photo_url: fileName,
        });
      }
      
      setChildPhoto(fileName);
      setPreviewStep("saved");
      
      toast({
        title: "התמונה נשמרה! 📸",
        description: "הילד/ה יופיעו בסיפורים בסגנון אנימציה 3D קסום",
      });
    } catch (error) {
      console.error('Photo save error:', error);
      toast({
        title: "שגיאה בשמירת התמונה",
        description: "נסו שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Reset and try different photo
  const handleRetryPhoto = () => {
    setPreviewPhoto(null);
    setOriginalPhoto(null);
    setPreviewStep("upload");
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const canSubmitConsent = hasReadTerms && isParentConsent;

  // Store referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
    }
  }, [searchParams]);

  // Process referral after signup
  const processReferral = async (newUserId: string) => {
    const refCode = localStorage.getItem('referral_code');
    if (!refCode) return;

    try {
      const { data: referrer, error: referrerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', refCode)
        .maybeSingle();

      if (referrerError || !referrer) return;
      if (referrer.id === newUserId) return;

      await supabase.from('referrals').insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
        referral_code: refCode,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      const { data: referrerProfile } = await supabase
        .from('profiles')
        .select('story_credits')
        .eq('id', referrer.id)
        .single();

      if (referrerProfile) {
        await supabase
          .from('profiles')
          .update({ story_credits: (referrerProfile.story_credits ?? 0) + 1 })
          .eq('id', referrer.id);
      }

      trackEvent({ 
        eventType: 'referral_signup_completed', 
        metadata: { referrer_id: referrer.id } 
      });
      trackEvent({ eventType: 'referral_credit_awarded' });

      localStorage.removeItem('referral_code');
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  };

  // Get return URL - default to home/adventure page (with open redirect protection)
  const getReturnTo = () => {
    // Cookie fallback for mobile: localStorage can be unavailable after OAuth context switches
    const cookieMatch = document.cookie.match(/(?:^|;\s*)ss_return_to=([^;]+)/);
    const cookieReturnTo = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
    const returnTo =
      searchParams.get('returnTo') ||
      localStorage.getItem('returnTo') ||
      cookieReturnTo ||
      '/adventure';
    // Only allow relative paths starting with / but not // (protocol-relative)
    if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }
    return '/adventure';
  };

  // Check terms acceptance when user is logged in
  useEffect(() => {
    if (!loading && !checkingTerms) return;

    const t = window.setTimeout(() => {
      console.warn('[Auth] gate stuck loading > 12s — showing fallback UI');
      setAuthGateError('timeout');
      setAuthGateStuck(true);
    }, AUTH_GATE_TIMEOUT_MS);

    return () => window.clearTimeout(t);
  }, [loading, checkingTerms]);

  useEffect(() => {
    const checkTermsAcceptance = async () => {
      if (!user || loading) return;
      
      setCheckingTerms(true);
      setAuthGateError(null);
      setAuthGateStuck(false);
      try {
        // If user just consented in the wizard's Google flow, persist now
        const pendingWizardTerms = localStorage.getItem('pending_wizard_terms_accept');
        if (pendingWizardTerms === '1') {
          const pendingMarketing = localStorage.getItem('pending_wizard_marketing_consent') === '1';
          try {
            await supabase
              .from("profiles")
              .update({
                terms_accepted_at: new Date().toISOString(),
                terms_version: TERMS_VERSION,
                marketing_consent: pendingMarketing,
              })
              .eq("id", user.id);
          } catch (e) {
            console.warn('Failed to persist wizard terms acceptance:', e);
          }
          localStorage.removeItem('pending_wizard_terms_accept');
          localStorage.removeItem('pending_wizard_marketing_consent');
        }

        // If educator just signed in via Google with consent flag, persist terms
        const pendingEducatorAccept = localStorage.getItem('pending_educator_terms_accept');
        if (pendingEducatorAccept === '1') {
          try {
            await supabase
              .from("profiles")
              .update({
                terms_accepted_at: new Date().toISOString(),
                terms_version: TERMS_VERSION,
              })
              .eq("id", user.id);
          } catch (e) {
            console.warn('Failed to persist educator terms acceptance:', e);
          }
          localStorage.removeItem('pending_educator_terms_accept');
        }

        const { data, error } = await withTimeout(
          supabase
            .from("profiles")
            .select("terms_accepted_at")
            .eq("id", user.id)
            .maybeSingle(),
          PROFILE_QUERY_TIMEOUT_MS,
          'auth profiles.terms_accepted_at query',
        );

        if (error) {
          console.warn("[Auth] Error checking terms:", error);
          setAuthGateError('query-error');
          setAuthGateStuck(true);
          return;
        }

        if (data?.terms_accepted_at) {
          // Terms already accepted - redirect to destination
          const returnTo = getReturnTo();
          localStorage.removeItem('returnTo');
          document.cookie = 'ss_return_to=; Max-Age=0; Path=/; SameSite=Lax; Secure';
          navigate(returnTo, { replace: true });
        } else {
          // Terms not yet accepted - redirect to onboarding
          const returnTo = getReturnTo();
          navigate(`/onboarding?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
        }
      } catch (error) {
        console.warn("[Auth] Terms check failed / timed out:", error);
        setAuthGateError('timeout');
        setAuthGateStuck(true);
      } finally {
        setCheckingTerms(false);
      }
    };

    checkTermsAcceptance();
  }, [user, loading, navigate]);

  const validateForm = () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({
        title: "שגיאה",
        description: emailResult.error.errors[0].message,
        variant: "destructive",
      });
      return false;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({
        title: "שגיאה",
        description: passwordResult.error.errors[0].message,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };


  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const { error } = await signInWithEmail(email, password);
    
    if (error) {
      let message = "לא הצלחנו להתחבר. נסו שוב.";
      if (error.message.includes("Invalid login credentials")) {
        message = "אימייל או סיסמה שגויים";
      } else if (error.message.includes("Email not confirmed")) {
        // For users who signed up before auto-confirm was enabled
        message = "האימייל שלך טרם אומת. שלחנו לך קישור חדש לאימות.";
        try {
          await supabase.auth.resend({
            type: 'signup',
            email: email,
          });
        } catch (e) {
          console.warn('Could not resend verification:', e);
        }
      }
      toast({
        title: "שגיאה בהתחברות",
        description: message,
        variant: "destructive",
      });
    } else {
      if (rememberMe) {
        localStorage.setItem('saved_login_email', email);
      } else {
        localStorage.removeItem('saved_login_email');
      }
    }
    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    if (!GOOGLE_SIGNIN_ENABLED) return;
    try {
      const returnTo = searchParams.get('returnTo') || localStorage.getItem('returnTo') || '/adventure';
      if (returnTo) localStorage.setItem('returnTo', returnTo);
      // Cookie fallback (mobile-safer than localStorage across OAuth context switches)
      document.cookie =
        'ss_return_to=' + encodeURIComponent(returnTo) +
        '; Max-Age=600; Path=/; SameSite=Lax; Secure';
      // If we're inside the Lovable preview iframe, Google blocks OAuth via X-Frame-Options.
      // Pop out to a top-level tab first so the redirect flow can complete normally.
      if (typeof window !== 'undefined' && window.self !== window.top) {
        // Open the production /auth URL in a new tab, preserving the intended destination.
        window.open(
          `https://soulstory.co.il/auth?returnTo=${encodeURIComponent(returnTo)}`,
          '_blank',
          'noopener'
        );
        return;
      }
      // User already accepted terms in the signup form — persist after OAuth callback
      if (signupTermsAccepted) {
        localStorage.setItem('pending_educator_terms_accept', '1');
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `https://soulstory.co.il/auth?returnTo=${encodeURIComponent(returnTo)}`
        }
      });
      if (error) {
        toast({
          title: "שגיאה",
          description: "ההתחברות עם Google נכשלה. נסו שוב.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה, נסו שוב",
        variant: "destructive",
      });
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    if (!signupTermsAccepted) {
      toast({
        title: "יש לאשר את התנאים",
        description: "אנא אשרו את תנאי השימוש ומדיניות הפרטיות כדי להמשיך",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Save referral code input to localStorage so processReferral picks it up
    if (referralCodeInput.trim()) {
      localStorage.setItem('referral_code', referralCodeInput.trim().toUpperCase());
    }
    
    const { error, data } = await signUpWithEmail(email, password, { user_role: userRole });
    
    if (error) {
      let message = "לא הצלחנו ליצור חשבון. נסו שוב.";
      if (error.message.includes("User already registered")) {
        message = "משתמש עם אימייל זה כבר קיים. נסו להתחבר.";
      }
      toast({
        title: "שגיאה בהרשמה",
        description: message,
        variant: "destructive",
      });
    } else if (data?.user) {
      // Signup successful - save terms acceptance immediately
      if (data?.user?.id) {
        await processReferral(data.user.id);
      }
      trackEvent({ eventType: "signup_completed", metadata: { method: "email", user_role: userRole } });
      // User already consented in the signup form — persist now to skip /onboarding
      if (data.user.id && signupTermsAccepted) {
        try {
          await supabase
            .from("profiles")
            .update({
              terms_accepted_at: new Date().toISOString(),
              terms_version: TERMS_VERSION,
            })
            .eq("id", data.user.id);
        } catch (e) {
          console.warn('Failed to persist terms acceptance:', e);
        }
      }
      if (userRole === "educator") {
        toast({
          title: "ברוכים הבאים, צוות החינוך! 🎓",
          description: "מחכה לכם סיפור לדוגמא מאיתנו כדי שתתרשמו מהקסם ✨",
          duration: 6000,
        });
      } else {
        toast({
          title: "ברוכים הבאים ל-SolStorie's™! 🎉",
          description: "מחכה לך סיפור לדוגמא מאיתנו כדי שתתרשמו מהקסם ✨",
        });
      }
      // The useEffect will handle redirect - terms already accepted so goes straight to /adventure
    }
    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(resetEmail);
    if (!emailResult.success) {
      toast({
        title: "שגיאה",
        description: emailResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await resetPasswordForEmail(resetEmail);
    
    if (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשלוח את המייל. ודאו שהאימייל תקין ונסו שוב.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "נשלח בהצלחה!",
        description: "שלחנו לכם קישור לאיפוס הסיסמה. בדקו את תיבת הדואר שלכם (גם בתיקיית ספאם)",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    }
    setIsSubmitting(false);
  };

  const handleAcceptTerms = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          terms_accepted_at: new Date().toISOString(),
          terms_version: TERMS_VERSION,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "ברוכים הבאים ל-SolStorie's™! 🎉",
        description: "מחכה לך סיפור לדוגמא מאיתנו כדי שתתרשמו מהקסם ✨",
      });
      
      // Navigate to home page after accepting terms
      const returnTo = getReturnTo();
      localStorage.removeItem('returnTo');
      navigate(returnTo);
    } catch (error) {
      console.error("Error accepting terms:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שמירת ההסכמה. נסו שוב.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!pendingEmail) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "המייל נשלח! ✉️",
        description: "בדקו את תיבת הדואר שלכם (גם בתיקיית ספאם)",
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      toast({
        title: "שגיאה בשליחת המייל",
        description: "נסו שוב בעוד כמה דקות",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authGateStuck || authGateError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" dir="rtl">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <p className="text-lg font-semibold">הטעינה נתקעה</p>
          <p className="text-sm text-muted-foreground">
            נראה שהחיבור לשרת איטי או לא זמין. נסי שוב, או התחברי מחדש.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()}>
              נסי שוב
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try { await supabase.auth.signOut(); } catch {}
                window.location.href = '/auth';
              }}
            >
              התחברות מחדש
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || checkingTerms) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show email verification message
  if (showEmailVerificationMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-background to-background" dir="rtl">
        <div className="container max-w-lg mx-auto px-4 py-12">
          <div className="bg-card rounded-3xl p-8 shadow-lg border border-border text-center space-y-6">
            {/* Email Icon */}
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                ✉️ בדקו את האימייל שלכם
              </h1>
              <p className="text-muted-foreground">
                שלחנו קישור אימות לכתובת:
              </p>
              <p className="font-semibold text-primary text-lg">
                {pendingEmail}
              </p>
            </div>
            
            {/* Instructions */}
            <div className="bg-muted/50 rounded-xl p-4 text-right space-y-2">
              <p className="text-sm text-muted-foreground">
                📧 לחצו על הקישור במייל כדי להפעיל את החשבון
              </p>
              <p className="text-sm text-muted-foreground">
                📁 לא מצאתם? בדקו גם בתיקיית הספאם
              </p>
              <p className="text-sm text-muted-foreground">
                ⏰ הקישור תקף ל-24 שעות
              </p>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                variant="outline"
                disabled={isSubmitting}
                className="w-full gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                שלחו שוב את המייל
              </Button>
              
              <Button
                onClick={() => {
                  setShowEmailVerificationMessage(false);
                  setActiveTab("login");
                }}
                variant="ghost"
                className="w-full"
              >
                חזרה להתחברות
              </Button>
            </div>
            
            {/* Help text */}
            <p className="text-xs text-muted-foreground">
              אימתם כבר את המייל? <button onClick={() => { setShowEmailVerificationMessage(false); setActiveTab("login"); }} className="text-primary underline">התחברו כאן</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show trial offer step after accepting terms
  if (user && showTrialOfferStep) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-background to-background" dir="rtl">
        <div className="container max-w-lg mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="mb-4 flex items-center gap-1 min-h-[44px]"
            aria-label="חזרה לדף הבית"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Button>
          {/* Header - Credits + Personal Greeting */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-700">{storyCredits}</span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground text-sm">שלום 👋</span>
              <h2 className="text-xl font-bold text-primary">
                {displayName || "אורח/ת"}
              </h2>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center space-y-6">
            <div className="space-y-2 animate-fade-in [animation-delay:100ms]">
              <h1 className="text-2xl font-bold text-foreground">
                ✨ מוכנים ליצור סיפור קסום?
              </h1>
              <p className="text-muted-foreground">
                הילד שלכם הופך לגיבור של הסיפור!
              </p>
            </div>

            {/* Hero Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl animate-fade-in [animation-delay:200ms]">
              <img 
                src="/src/assets/hero-child-book.png" 
                alt="ילד קורא סיפור"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* CTA Button */}
            <div className="animate-fade-in [animation-delay:300ms]">
              <Button
                onClick={() => navigate('/create')}
                size="lg"
                className="w-full h-16 text-lg font-bold rounded-2xl 
                           bg-gradient-to-r from-amber-400 to-amber-500
                           hover:from-amber-500 hover:to-amber-600
                           text-white shadow-lg transition-all hover:scale-[1.02]
                           gap-2"
              >
                <Sparkles className="w-5 h-5" />
                צור סיפור חדש
              </Button>
              
              <p className="text-sm text-muted-foreground mt-3">
                הילד שלכם כגיבור הסיפור! 🌟
              </p>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-3 animate-fade-in [animation-delay:400ms]">
              <p className="text-sm text-muted-foreground">
                רוצים שהדמות תהיה דומה לילד שלכם?
              </p>
              
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handleChildPhotoUpload}
                className="hidden"
                id="child-photo-upload"
              />
              
              {/* Step 1: Upload */}
              {previewStep === "upload" && (
                <Button
                  variant="outline"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full gap-2 rounded-xl h-12 border-dashed border-2"
                  disabled={generatingPreview}
                >
                  {generatingPreview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      ממירים לסגנון אנימציה...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      העלו תמונה של הילד/ה
                    </>
                  )}
                </Button>
              )}

              {/* Step 2: Preview - Show original + 3D version */}
              {previewStep === "preview" && originalPhoto && previewPhoto && (
                <div className="space-y-4 p-4 bg-gradient-to-b from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                  <p className="text-center font-medium text-foreground">
                    איך הילד/ה ייראו בסיפורים:
                  </p>
                  
                  <div className="flex justify-center items-center gap-4">
                    {/* Original photo */}
                    <div className="text-center">
                      <img 
                        src={originalPhoto} 
                        alt="תמונה מקורית"
                        className="w-20 h-20 rounded-full object-cover border-2 border-muted shadow-md" 
                      />
                      <p className="text-xs text-muted-foreground mt-2">מקור</p>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex items-center text-amber-500">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                    
                    {/* 3D Preview */}
                    <div className="text-center">
                      <div className="relative">
                        <img 
                          src={previewPhoto} 
                          alt="תצוגה מקדימה בסגנון 3D"
                          className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-lg ring-2 ring-amber-300 ring-offset-2" 
                        />
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <p className="text-xs text-primary font-medium mt-2">סגנון אנימציה ✨</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleRetryPhoto}
                      className="flex-1 gap-2 rounded-xl"
                      disabled={uploadingPhoto}
                    >
                      <RefreshCw className="w-4 h-4" />
                      נסה תמונה אחרת
                    </Button>
                    <Button
                      onClick={handleConfirmPhoto}
                      className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600"
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {uploadingPhoto ? "שומר..." : "אישור ושמירה"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Saved */}
              {previewStep === "saved" && (
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-200">
                  <img 
                    src={previewPhoto || childPhoto} 
                    alt="תמונת הילד/ה"
                    className="w-16 h-16 rounded-full object-cover border-2 border-green-300" 
                  />
                  <div className="flex-1 text-right">
                    <p className="font-medium text-green-700 flex items-center gap-2 justify-end">
                      <Check className="w-4 h-4" />
                      התמונה נשמרה!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      הילד/ה יופיעו כך בסיפורים
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show consent step after authentication
  if (user && showConsentStep) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background" dir="rtl">
        <div className="container max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              לפני שמתחילים... 📋
            </h1>
            <p className="text-muted-foreground text-lg">
              אנא קראו ואשרו את התנאים שלנו כדי להתחיל ליצור סיפורים קסומים
            </p>
          </div>

          {/* Quick Summary */}
          <div className="bg-card rounded-2xl border shadow-sm p-6 mb-6 animate-fade-in [animation-delay:100ms]">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              בקצרה - מה חשוב לדעת:
            </h2>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">שימוש משפחתי</p>
                  <p className="text-sm text-muted-foreground">הסיפורים מיועדים לשימוש אישי ומשפחתי בלבד</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">הגנה על פרטיות</p>
                  <p className="text-sm text-muted-foreground">אנו לא מוכרים מידע לצדדים שלישיים - לעולם לא</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">בטיחות ילדים (COPPA)</p>
                  <p className="text-sm text-muted-foreground">שומרים על פרטיות הילדים בהתאם לתקנות הבינלאומיות</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Privacy Tabs */}
          <div className="bg-card rounded-2xl border shadow-sm mb-6 overflow-hidden animate-fade-in [animation-delay:200ms]">
            <Tabs defaultValue="terms" className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none h-14 bg-muted/50">
                <TabsTrigger 
                  value="terms" 
                  className="gap-2 data-[state=active]:bg-background rounded-none h-full text-base"
                >
                  <FileText className="w-4 h-4" />
                  תנאי שימוש
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="gap-2 data-[state=active]:bg-background rounded-none h-full text-base"
                >
                  <Shield className="w-4 h-4" />
                  מדיניות פרטיות
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="terms" className="p-6 mt-0">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4 text-right leading-relaxed">
                    <section>
                      <h3 className="font-bold text-foreground mb-2">1. כללי</h3>
                      <p className="text-muted-foreground text-sm">
                        ברוכים הבאים לאפליקציית סיפורי ילדים. תנאי שימוש אלו מהווים הסכם משפטי מחייב בינך לבין החברה.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">2. תנאי שימוש</h3>
                      <p className="text-muted-foreground text-sm">
                        האפליקציה מיועדת ליצירת סיפורים מותאמים אישית לילדים. השימוש מותר למטרות חוקיות בלבד.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">3. הגנה על פרטיות ילדים</h3>
                      <p className="text-muted-foreground text-sm">
                        אנו מחויבים להגנה על פרטיותם של ילדים ופועלים בהתאם לחוק הגנת הפרטיות ולתקנות COPPA.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">4. הסכמת הורים</h3>
                      <p className="text-muted-foreground text-sm">
                        השימוש באפליקציה על ידי ילדים מחייב הסכמה ופיקוח של הורה או אפוטרופוס חוקי.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">5. תוכן שנוצר באפליקציה</h3>
                      <p className="text-muted-foreground text-sm">
                        הסיפורים נוצרים בעזרת בינה מלאכותית ומותרים לשימוש אישי ומשפחתי בלבד.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">6. קניין רוחני</h3>
                      <p className="text-muted-foreground text-sm">
                        כל זכויות הקניין הרוחני באפליקציה שייכות לחברה.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">7. הגבלת אחריות</h3>
                      <p className="text-muted-foreground text-sm">
                        האפליקציה מסופקת "כמות שהיא" (AS IS). אנו ממליצים על פיקוח הורים בעת השימוש.
                      </p>
                    </section>
                    <p className="text-xs text-muted-foreground pt-4 border-t">
                      גרסה {TERMS_VERSION} | עדכון אחרון: ינואר 2026
                    </p>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="privacy" className="p-6 mt-0">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4 text-right leading-relaxed">
                    <section>
                      <h3 className="font-bold text-foreground mb-2">1. מידע שאנו אוספים</h3>
                      <p className="text-muted-foreground text-sm">
                        אנו אוספים: כתובת אימייל להתחברות, שם וגיל הילד/ה להתאמת הסיפורים, ונתוני שימוש אנונימיים.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">2. שימוש במידע</h3>
                      <p className="text-muted-foreground text-sm">
                        המידע משמש ליצירת סיפורים מותאמים, שיפור השירות ותמיכה טכנית. אנו לא משתמשים במידע לפרסום.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">3. הגנה על פרטיות ילדים (COPPA)</h3>
                      <p className="text-muted-foreground text-sm">
                        אנו לא אוספים מידע אישי מזהה ישירות מילדים. כל איסוף נעשה באמצעות ההורה.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">4. שיתוף מידע</h3>
                      <p className="text-muted-foreground text-sm">
                        אנו לא מוכרים מידע אישי לצדדים שלישיים ולעולם לא נעשה זאת.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">5. אבטחת מידע</h3>
                      <p className="text-muted-foreground text-sm">
                        המידע מוגן בהצפנה ואמצעי אבטחה מתקדמים.
                      </p>
                    </section>
                    <section>
                      <h3 className="font-bold text-foreground mb-2">6. זכויותיכם</h3>
                      <p className="text-muted-foreground text-sm">
                        יש לכם זכות לעיין, לתקן ולמחוק את המידע שלכם בכל עת.
                      </p>
                    </section>
                    <p className="text-xs text-muted-foreground pt-4 border-t">
                      גרסה {TERMS_VERSION} | עדכון אחרון: ינואר 2026
                    </p>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Consent Checkboxes */}
          <div className="bg-card rounded-2xl border shadow-sm p-6 mb-6 space-y-4 animate-fade-in [animation-delay:300ms]">
            <div className="flex items-start gap-4">
              <Checkbox
                id="read-terms"
                checked={hasReadTerms}
                onCheckedChange={(checked) => setHasReadTerms(checked === true)}
                className="mt-1 h-5 w-5"
                aria-describedby="read-terms-desc"
              />
              <Label 
                htmlFor="read-terms" 
                className="text-base leading-relaxed cursor-pointer"
              >
                קראתי והבנתי את תנאי השימוש ומדיניות הפרטיות
                <span id="read-terms-desc" className="sr-only">
                  סמנו כדי לאשר שקראתם את התנאים
                </span>
              </Label>
            </div>

            <div className="flex items-start gap-4">
              <Checkbox
                id="parent-consent"
                checked={isParentConsent}
                onCheckedChange={(checked) => setIsParentConsent(checked === true)}
                className="mt-1 h-5 w-5"
                aria-describedby="parent-consent-desc"
              />
              <Label 
                htmlFor="parent-consent" 
                className="text-base leading-relaxed cursor-pointer"
              >
                אני הורה או אפוטרופוס חוקי ומסכים/ה לתנאים אלו בשם ילדי
                <span id="parent-consent-desc" className="sr-only">
                  סמנו כדי לאשר שאתם הורה או אפוטרופוס
                </span>
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col items-center gap-4 animate-fade-in [animation-delay:400ms]">
            <Button
              onClick={handleAcceptTerms}
              disabled={!canSubmitConsent || isSubmitting}
              size="lg"
              className="gap-3 min-w-[280px] h-14 text-lg font-bold shadow-lg"
              aria-label={canSubmitConsent ? "אישור התנאים והמשך לאפליקציה" : "יש לסמן את שני התנאים כדי להמשיך"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  מאשר/ת ומתחיל/ה!
                </>
              )}
            </Button>
            
            {!canSubmitConsent && (
              <p className="text-sm text-muted-foreground text-center">
                יש לסמן את שתי ההסכמות כדי להמשיך
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] flex flex-col overflow-hidden relative">
      {/* Full-screen Background Image */}
      {/* Adventure Sky Background - covers full viewport on all screen sizes */}
      <div className="absolute inset-0 bg-adventure-sky">
        <div className="absolute inset-0 rainbow-arc" />
        {/* Soft cloud shapes - spread across full width */}
        <div className="absolute top-[15%] left-[10%] w-40 lg:w-64 h-20 lg:h-32 bg-white/30 rounded-full blur-2xl" />
        <div className="absolute top-[20%] right-[15%] w-52 lg:w-72 h-24 lg:h-36 bg-white/25 rounded-full blur-3xl" />
        <div className="absolute top-[10%] left-[50%] w-36 lg:w-56 h-16 lg:h-24 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute bottom-[20%] left-[20%] w-48 h-20 bg-white/15 rounded-full blur-3xl hidden lg:block" />
        <div className="absolute bottom-[30%] right-[25%] w-40 h-16 bg-white/20 rounded-full blur-2xl hidden lg:block" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 pb-14 overflow-y-auto">
        {/* SolStorie's™ Title */}
        <div className="flex justify-center mb-4 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black logo-3d-bubble">
            <span className="logo-rainbow">SolStorie's™</span>
          </h1>
        </div>

        {/* Login container - centered on all screens */}
        <div className="relative w-full max-w-md overflow-visible">

          {/* Glassmorphism Login Container */}
          <div className="relative z-10 w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-4 md:p-5 animate-fade-in max-h-[80vh] overflow-y-auto border border-white/50">
          {showForgotPassword ? (
            /* Forgot Password Form */
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center shadow-md">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                </div>
              <h2 className="text-2xl font-black text-black mb-2">איפוס סיסמה</h2>
              <p className="text-black/70 text-sm font-medium">
                הזינו את כתובת האימייל שלכם ונשלח לכם קישור לאיפוס הסיסמה
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-black font-bold">אימייל</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pr-11 text-left h-12 rounded-xl border-gray-200"
                    dir="ltr"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white font-black text-lg h-14 rounded-full shadow-xl shadow-black/25 hover:shadow-2xl hover:scale-[1.02] transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "שלחו קישור לאיפוס"
                )}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-center text-purple hover:underline text-sm font-medium"
            >
              חזרה להתחברות
            </button>
          </div>
          ) : (
            <>

              {/* Header */}
              <div className="text-center mb-4 animate-fade-in [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
        <h1 className="text-2xl font-black text-black mb-1">
                  ברוכים הבאים!
                </h1>
                <p className="text-black/70 text-sm font-medium">
                  התחברו כדי ליצור סיפורים מותאמים אישית
                </p>
              </div>

              {/* Custom Tabs */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-full mb-4 animate-fade-in [animation-delay:300ms] opacity-0 [animation-fill-mode:forwards]">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all ${
                  activeTab === "login"
                    ? "bg-purple text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                התחברות
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all ${
                  activeTab === "signup"
                    ? "bg-purple text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                הרשמה
              </button>
            </div>

            {/* Login Form */}
            {activeTab === "login" && (
              <div className="animate-fade-in">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-black font-bold">אימייל</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-11 text-left h-12 rounded-xl border-gray-200"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-black font-bold">סיסמה</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="הסיסמה שיצרת"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-11 pl-11 text-left h-12 rounded-xl border-gray-200"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label htmlFor="remember-me" className="text-sm text-black/70 font-medium cursor-pointer">
                      זכור אותי
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-purple hover:underline text-sm font-medium"
                  >
                    שכחתי סיסמה
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white font-black text-lg h-14 rounded-full shadow-xl shadow-black/25 hover:shadow-2xl hover:scale-[1.02] transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "התחברות"
                  )}
                </Button>
              </form>
              </div>
            )}

            {/* Signup Form */}
            {activeTab === "signup" && (
              <div className="animate-fade-in">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-black font-bold">אימייל</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-11 text-left h-12 rounded-xl border-gray-200"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-black font-bold">סיסמה</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="לפחות 6 תווים"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-11 pl-11 text-left h-12 rounded-xl border-gray-200"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    💡 לידיעתך: יש ליצור סיסמה חדשה לאפליקציה (זו לא חייבת להיות סיסמת המייל שלך)
                  </p>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label className="text-black font-bold">אני...</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUserRole("parent")}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        userRole === "parent"
                          ? "border-purple-500 bg-purple-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl">👨‍👩‍👧</span>
                      <span className="text-sm font-bold text-black">הורה</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRole("educator")}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        userRole === "educator"
                          ? "border-purple-500 bg-purple-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl">📚</span>
                      <span className="text-sm font-bold text-black">איש/ת חינוך או טיפול</span>
                    </button>
                  </div>
                </div>


                {/* Terms consent checkbox - simplified */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <Checkbox
                    id="signup-terms"
                    checked={signupTermsAccepted}
                    onCheckedChange={(checked) => setSignupTermsAccepted(checked === true)}
                    className="mt-0.5 h-5 w-5"
                  />
                  <Label 
                    htmlFor="signup-terms" 
                    className="text-sm leading-relaxed cursor-pointer text-black/80"
                  >
                    אני מאשר/ת את{' '}
                    <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-purple underline font-medium">תקנון השימוש</button>
                    {' '}ו
                    <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} className="text-purple underline font-medium">מדיניות הפרטיות</button>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !signupTermsAccepted}
                  size="lg"
                  className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white font-black text-lg h-14 rounded-full shadow-xl shadow-black/25 hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "הרשמה"
                  )}
                </Button>
              </form>
              </div>
            )}

            </>
          )}
          </div>
        </div>

        {/* Device availability icons */}
        <div className="flex flex-col items-center gap-1.5 mt-3 mb-1 animate-fade-in-delay-3">
          <div className="flex items-center gap-4">
            <Smartphone className="w-5 h-5 text-white drop-shadow-md" />
            <Tablet className="w-5 h-5 text-white drop-shadow-md" />
            <Monitor className="w-5 h-5 text-white drop-shadow-md" />
          </div>
          <p className="text-xs font-bold text-white drop-shadow-md">זמינה עבורכם בכל מקום</p>
        </div>
      </div>
      <MobileNavigation />

      {/* Terms of Service Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 justify-center">
              <FileText className="w-5 h-5 text-primary" />
              תקנון שימוש
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 text-right leading-relaxed text-sm">
              <p className="text-muted-foreground">תקנון שימוש זה מהווה הסכם משפטי מחייב בין המשתמש לבין הנהלת האפליקציה.</p>
              <section>
                <h3 className="font-bold text-foreground mb-1">מהות השירות</h3>
                <p className="text-muted-foreground"><span dir="ltr" className="inline-block">SolStorie's™</span> מספקת פלטפורמה ליצירת תוכן ספרותי מותאם אישית לילדים בגילאי 0-8, המיועדת להורים, אפוטרופוסים חוקיים ואנשי חינוך וטיפול.</p>
              </section>
              <section>
                <h3 className="font-bold text-foreground mb-1">הגבלת אחריות מקצועית</h3>
                <p className="text-muted-foreground">השימוש באפליקציה הינו כלי עזר טכנולוגי בלבד ואינו מהווה תחליף לייעוץ מקצועי, חינוכי או רפואי.</p>
              </section>
              <section>
                <h3 className="font-bold text-foreground mb-1">אחריות המשתמש והורה</h3>
                <p className="text-muted-foreground">השימוש באפליקציה מיועד להורים או לאפוטרופוסים חוקיים. באחריות המבוגר האחראי לבחון את התוכן שנוצר על ידי הבינה המלאכותית ולוודא את התאמתו לילד בטרם הקראתו.</p>
              </section>
              <section>
                <h3 className="font-bold text-foreground mb-1">מערכת קרדיטים ורכישות</h3>
                <p className="text-muted-foreground">השימוש בשירות מותנה ביתרת קרדיטים. ניתן לבצע רכישות באמצעות כרטיס אשראי גם ללא חשבון פייפאל. קרדיטים שנוצלו אינם ניתנים להחזר.</p>
              </section>
              <section>
                <h3 className="font-bold text-foreground mb-1">קניין רוחני</h3>
                <p className="text-muted-foreground">העיצוב, הקוד, הדמויות (סול וחבריה), האיורים והטכנולוגיה הם קניינה הבלעדי של <span dir="ltr" className="inline-block">SolStorie's™</span>. הסיפורים הנוצרים מיועדים לשימוש אישי ופרטי בלבד.</p>
              </section>
              <section>
                <h3 className="font-bold text-foreground mb-1">סיום התקשרות</h3>
                <p className="text-muted-foreground">הנהלת האפליקציה שומרת לעצמה את הזכות להפסיק שירות למשתמש שיעשה שימוש לרעה במערכת או יזין תכנים פוגעניים.</p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 justify-center">
              <Shield className="w-5 h-5 text-primary" />
              מדיניות פרטיות
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 text-right leading-relaxed text-sm">
              <p className="text-muted-foreground">ברוכים הבאים למדיניות הפרטיות של <span dir="ltr" className="inline-block">SolStorie's™</span>. אנו מחויבים להגנה על פרטיות המשתמשים שלנו, ובפרט על פרטיותם של קטינים.</p>
              <section>
                <h3 className="font-bold text-foreground mb-1">איסוף מידע ושימוש בו</h3>
                <p className="text-muted-foreground">לצורך אספקת השירות, אנו אוספים מידע מינימלי הכולל את שם הילד/ה, העדפת קבוצת גיל ותיאורי דמויות. מידע זה משמש אך ורק את מנוע הבינה המלאכותית ליצירת סיפורים מותאמים אישית.</p>
              </section>
              <section>
                <h3 className="font-bold text-foreground mb-1">הגנה על מידע ילדים (גילאי 0-8)</h3>
                <p className="text-muted-foreground mb-2"><span dir="ltr" className="inline-block">SolStorie's™</span> מיועדת ליצירת תוכן עבור ילדים בגילאי 0-8, ולכן אנו מקפידים על הגנה מיוחדת:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-2">
                  <li><strong>מינימום מידע:</strong> אנו אוספים רק את שם הילד/ה, טווח הגיל ותיאור הדמות.</li>
                  <li><strong>ללא שיווק:</strong> מידע הילדים אינו משמש לפרסום, שיווק או יצירת פרופילים מסחריים.</li>
                  <li><strong>ללא שיתוף:</strong> מידע הילדים אינו מועבר, נמכר או משותף עם צדדים שלישיים.</li>
                  <li><strong>מחיקה:</strong> ניתן למחוק את כל מידע הילדים בכל עת דרך הגדרות החשבון.</li>
                </ul>
              </section>
              <section>
                <h3 className="font-bold text-foreground mb-1">אחסון ועיבוד מידע</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-2">
                  <li><strong>אחסון תמונות ואיורים:</strong> האפליקציה משתמשת בשירותי אחסון ענן מאובטחים לצורך שמירה והצגה של כריכות הסיפורים והאיורים.</li>
                  <li><strong>פרטיות ומידע רגיש:</strong> האפליקציה אינה אוספת מידע רגיש ללא צורך תפעולי מובהק.</li>
                  <li><strong>הגבלת אחריות:</strong> האיורים נוצרים באמצעות טכנולוגיית בינה מלאכותית. האחריות על השימוש בסיפורים ובאיורים היא על ההורה/המשתמש בלבד.</li>
                </ul>
              </section>
              <section>
                <h3 className="font-bold text-foreground mb-1">אבטחת מידע</h3>
                <p className="text-muted-foreground">אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע השמור במערכותינו. המידע אינו מועבר, נמכר או משותף עם צדדים שלישיים.</p>
              </section>
              <section>
                <h3 className="font-bold text-foreground mb-1">תשלומים ופרטיות פיננסית</h3>
                <p className="text-muted-foreground">תשלומי כרטיס אשראי מעובדים באופן מאובטח. פרטי כרטיס האשראי אינם נשמרים במערכות <span dir="ltr" className="inline-block">SolStorie's™</span>.</p>
              </section>
              <section>
                <h3 className="font-bold text-foreground mb-1">זכויות המשתמש</h3>
                <p className="text-muted-foreground">למשתמש זכות מלאה לעיין במידע, לעדכנו או לבקש את מחיקתו לצמיתות בכל עת דרך הגדרות החשבון.</p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
