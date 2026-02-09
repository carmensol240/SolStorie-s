import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Loader2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import MobileNavigation from "@/components/MobileNavigation";
import ChildInfoStep from "@/components/wizard/ChildInfoStep";
import TopicStep from "@/components/wizard/TopicStep";
import GeneratingStep from "@/components/wizard/GeneratingStep";
// InspirationScreen removed - going directly to child info step
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { isDevModeEnabled } from "@/hooks/use-dev-mode";

export interface AdventureLogic {
  outfit: string;
  background: string;
  theme: string;
}

export interface StoryFormData {
  childName: string;
  childGender: "male" | "female";
  ageRange: "0-2" | "2-4" | "5-7" | "8-10";
  storyLength: "short" | "long";
  childPhoto: string | null;
  childAvatarUrl: string | null;
  nikud: boolean;
  topic: string;
  customTopic: string;
  personalityTraits: string;
  adventureLogic?: AdventureLogic;
}

const INITIAL_DATA: StoryFormData = {
  childName: "",
  childGender: "male",
  ageRange: "2-4",
  storyLength: "short",
  childPhoto: null,
  childAvatarUrl: null,
  nikud: true,
  topic: "",
  customTopic: "",
  personalityTraits: "",
};

const steps = [
  { number: 1, label: "פרטי הילד/ה" },
  { number: 2, label: "דמות" },
  { number: 3, label: "סגנון" },
  { number: 4, label: "יצירה" },
];

const CreateStory = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { credits, loading: creditsLoading, hasCredits, useCredit } = useCredits();
  const [step, setStep] = useState(1); // Start directly at child info step
  const [formData, setFormData] = useState<StoryFormData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // 🔧 DEV MODE: Skip all auth checks
    if (isDevModeEnabled()) {
      console.log('🔧 Dev mode: bypassing auth checks in CreateStory');
      return;
    }

    if (!loading && !user) {
      localStorage.setItem('returnTo', '/create');
      navigate("/auth");
      return;
    }
    
    // Strictly redirect unverified users to verification page
    if (!loading && user) {
      // Check email_confirmed_at - if null/undefined, redirect to verify
      const isVerified = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;
      if (!isVerified) {
        console.log('User email not verified, redirecting to /verify-email');
        navigate("/verify-email", { replace: true });
        return;
      }
    }
  }, [user, loading, navigate]);

  if (loading || creditsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isDevModeEnabled() && (!user || !user.email_confirmed_at)) {
    return null;
  }

  const updateFormData = (updates: Partial<StoryFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceedStep1 = formData.childName.trim().length > 0;
  const canProceedStep2 = formData.topic.length > 0 || formData.customTopic.trim().length > 0;

  const handleNext = () => {
    if (step === 1 && canProceedStep1) {
      setStep(2);
    } else if (step === 2 && canProceedStep2) {
      // Check if user has credits before starting generation
      if (!hasCredits()) {
        navigate('/upgrade?noCredits=true');
        return;
      }
      setStep(3);
      setIsGenerating(true);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigate("/"); // Go back to home from first step
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStoryGenerated = async (storyId: string) => {
    // Check if this was the free credit (credits was 1 before using)
    const wasFirstStory = credits === 1;
    await useCredit();
    
    // After first story, show upgrade screen with package options
    if (wasFirstStory) {
      navigate(`/upgrade?firstStory=${storyId}`);
    } else {
      navigate(`/story/${storyId}`);
    }
  };

  // Map internal step to display step (1,2 -> display steps, 3 -> generating)
  const displayStep = step < 3 ? step : 4;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Header - Compact with gradient theme */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-[#FAF3E8] to-[#F5E6D3] px-3 py-2 border-b border-purple-200 shadow-sm">
        <div className="container max-w-lg mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-1 min-h-[36px] px-2 py-1 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            aria-label="חזרה לשלב הקודם"
          >
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            חזרה
          </Button>
          
          {/* Compact User Icon for Step 1 */}
          {step === 1 && (
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        {/* Compact Progress Bar - 4 Steps */}
        {step >= 1 && step < 3 && (
          <div className="container max-w-lg mx-auto mt-2">
            <div className="flex items-center justify-between">
              {steps.map((s, index) => (
                <div key={s.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                        displayStep >= s.number
                          ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white shadow-md"
                          : "bg-purple-100 text-purple-400"
                      }`}
                    >
                      {s.number}
                    </div>
                    <span className="text-[9px] mt-0.5 text-purple-500 whitespace-nowrap">
                      {s.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-4 sm:w-8 mx-0.5 rounded-full transition-all ${
                        displayStep > s.number ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-purple-100"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Scrollable area */}
      <main className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="container max-w-lg mx-auto px-3 py-3 pb-40">

        {/* Step Content */}
        {step === 1 && (
          <ChildInfoStep
            formData={formData}
            updateFormData={updateFormData}
          />
        )}

        {step === 2 && (
          <TopicStep
            formData={formData}
            updateFormData={updateFormData}
          />
        )}

        {step === 3 && (
          <GeneratingStep
            formData={formData}
            onComplete={handleStoryGenerated}
          />
        )}

        </div>
      </main>

      {/* Fixed Bottom Continue Button */}
      {step < 3 && (
        <div className="fixed bottom-[4.5rem] left-0 right-0 z-[60] bg-gradient-to-t from-background via-background to-transparent pt-4 pb-2 px-3 pb-safe">
          <div className="container max-w-lg mx-auto">
            <Button
              onClick={handleNext}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-black text-sm py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {step === 2 ? "צרו את הסיפור" : "המשיכו"}
              <ArrowLeft className="w-4 h-4 mr-1.5" />
            </Button>
          </div>
        </div>
      )}
      
      {step < 3 && <MobileNavigation />}
    </div>
  );
};

export default CreateStory;
