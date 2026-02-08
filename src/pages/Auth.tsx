import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, Loader2, Eye, EyeOff, KeyRound, FileText, Shield, CheckCircle2, Sparkles, Heart, Users, Camera, Check, ArrowRight, RefreshCw } from "lucide-react";
import MobileNavigation from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/use-analytics";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import soliBackground from "@/assets/soli-tree-background.png";

const emailSchema = z.string().email("כתובת אימייל לא תקינה");
const passwordSchema = z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים");
const TERMS_VERSION = "1.0";

const Auth = () => {
  const navigate = useNavigate();
  const handleGoBack = () => navigate("/");
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const { user, loading, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth();
  
  const [email, setEmail] = useState("");
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
        .select('share_coins')
        .eq('id', referrer.id)
        .single();

      if (referrerProfile) {
        await supabase
          .from('profiles')
          .update({ share_coins: (referrerProfile.share_coins ?? 0) + 1 })
          .eq('id', referrer.id);
      }

      trackEvent({ 
        eventType: 'referral_signup_completed', 
        metadata: { referrer_id: referrer.id } 
      });
      trackEvent({ eventType: 'coin_awarded' });

      localStorage.removeItem('referral_code');
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  };

  // Get return URL - default to library page (with open redirect protection)
  const getReturnTo = () => {
    const returnTo = searchParams.get('returnTo') || localStorage.getItem('returnTo') || '/library';
    // Only allow relative paths starting with / but not // (protocol-relative)
    if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }
    return '/library';
  };

  // Check terms acceptance when user is logged in
  useEffect(() => {
    const checkTermsAcceptance = async () => {
      if (!user || loading) return;
      
      setCheckingTerms(true);
      try {
        // First, try to get existing profile
        const { data, error } = await supabase
          .from("profiles")
          .select("terms_accepted_at, display_name, story_credits")
          .eq("id", user.id)
          .maybeSingle();

        // If no profile exists (error or null data), create one
        if (error || !data) {
          console.log("No profile found, creating one for user:", user.id);
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              display_name: user.email?.split('@')[0] || null,
            });
          
          if (insertError) {
            console.error("Error creating profile:", insertError);
          }
          
          // Set defaults and show consent
          setDisplayName(user.email?.split('@')[0] || "");
          setStoryCredits(1);
          setShowConsentStep(true);
          setCheckingTerms(false);
          return;
        }

        // Store profile data for trial offer screen
        setDisplayName(data?.display_name || user.email?.split('@')[0] || "");
        setStoryCredits(data?.story_credits ?? 1);

        if (data?.terms_accepted_at) {
          // Terms already accepted - redirect to destination
          const returnTo = getReturnTo();
          localStorage.removeItem('returnTo');
          navigate(returnTo);
        } else {
          // Redirect to onboarding page for consent
          navigate("/onboarding");
        }
      } catch (error) {
        console.error("Error checking terms:", error);
        navigate("/onboarding");
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
    }
    setIsSubmitting(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const { error, data } = await signUpWithEmail(email, password);
    
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
      // Signup successful - user is auto-confirmed and logged in
      if (data?.user?.id) {
        await processReferral(data.user.id);
      }
      toast({
        title: "ברוכים הבאים ל-StoryTime! 🎉",
        description: "מחכה לך סיפור ראשון במתנה מאיתנו כדי להתחיל בקסם ✨",
      });
      // The useEffect will handle redirect after checking terms
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
        title: "ברוכים הבאים ל-StoryTime! 🎉",
        description: "מחכה לך סיפור ראשון במתנה מאיתנו כדי להתחיל בקסם ✨",
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
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${soliBackground})` }}
      >
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 pb-20 overflow-y-auto">
        {/* Glassmorphism Login Container */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-5 md:p-6 animate-fade-in max-h-[80vh] overflow-y-auto border border-white/50">
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
              {/* Waving Hand Icon */}
              <div className="flex justify-center mb-4 animate-fade-in [animation-delay:100ms]">
                <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center shadow-md">
                  <span className="text-3xl animate-bounce-gentle">👋</span>
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-4 animate-fade-in [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
                <h1 className="text-xl font-black text-black mb-1">
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
                      placeholder="••••••••"
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

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-purple hover:underline text-sm font-medium"
                >
                  שכחתי סיסמה
                </button>

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
      <MobileNavigation />
    </div>
  );
};

export default Auth;
