import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Loader2, User } from "lucide-react";
import GlobalFooter from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import MobileNavigation from "@/components/MobileNavigation";
import ChildInfoStep from "@/components/wizard/ChildInfoStep";
import TopicStep from "@/components/wizard/TopicStep";
import GeneratingStep from "@/components/wizard/GeneratingStep";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";

export interface AdventureLogic {
  outfit: string;
  background: string;
  theme: string;
}

export interface StoryFormData {
  childName: string;
  childGender: "male" | "female";
  ageRange: "0-2" | "2-4" | "5-7" | "8-10";
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
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<StoryFormData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
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

  if (!user || !user.email_confirmed_at) {
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
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/");
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
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-amber-50 to-orange-50 pb-20 overflow-y-auto overscroll-contain">
      <div className="container max-w-lg mx-auto px-3 py-4">
        
        {/* Compact Header with back button */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-1 min-h-[40px] px-2 py-1 text-sm"
            aria-label="חזרה לשלב הקודם"
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
            חזרה
          </Button>
        </div>

        {/* Compact Progress Bar - 4 Steps */}
        {step < 3 && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              {steps.map((s, index) => (
                <div key={s.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        displayStep >= s.number
                          ? "bg-purple-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {s.number}
                    </div>
                    <span className="text-[10px] mt-0.5 text-muted-foreground whitespace-nowrap">
                      {s.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-6 sm:w-10 mx-0.5 rounded-full transition-all ${
                        displayStep > s.number ? "bg-purple-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compact User Icon */}
        {step === 1 && (
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-md">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>
        )}

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

        {/* Compact Navigation Buttons */}
        {step < 3 && (
          <div className="mt-4">
            <Button
              onClick={handleNext}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-base py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 2 ? "צרו את הסיפור" : "המשיכו"}
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        )}

      </div>
      
      {step < 3 && (
        <>
          <GlobalFooter />
          <MobileNavigation />
        </>
      )}
    </div>
  );
};

export default CreateStory;
