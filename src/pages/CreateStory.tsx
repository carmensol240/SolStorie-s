import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import MobileNavigation from "@/components/MobileNavigation";
import GlobalFooter from "@/components/shared/GlobalFooter";
import ChildInfoStep from "@/components/wizard/ChildInfoStep";
import TopicStep from "@/components/wizard/TopicStep";
import GeneratingStep from "@/components/wizard/GeneratingStep";
import AuthStep from "@/components/wizard/AuthStep";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { isDevModeEnabled } from "@/hooks/use-dev-mode";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/use-analytics";

export interface AdventureLogic {
  outfit: string;
  background: string;
  theme: string;
}

export interface StoryFormData {
  childName: string;
  childGender: "male" | "female";
  ageRange: "0-2" | "2-4" | "5-7" | "8-10";
  childAge: number;
  storyLength: "short" | "long" | "extra-long";
  childPhoto: string | null;
  childAvatarUrl: string | null;
  photoConsent: boolean;
  nikud: boolean;
  language: "he" | "en";
  topic: string;
  customTopic: string;
  personalityTraits: string;
  className: string;
  fixedDetails: string;
  clothingType: string;
  clothingColor: string;
  hairColor: string;
  hairStyle: string;
  adventureLogic?: AdventureLogic;
}

const INITIAL_DATA: StoryFormData = {
  childName: "",
  childGender: "male",
  ageRange: "2-4",
  childAge: 4,
  storyLength: "short",
  childPhoto: null,
  childAvatarUrl: null,
  photoConsent: false,
  nikud: true,
  language: "he",
  topic: "",
  customTopic: "",
  personalityTraits: "",
  className: "",
  fixedDetails: "",
  clothingType: "",
  clothingColor: "",
  hairColor: "",
  hairStyle: "",
};

const steps = [
  { number: 1, label: "פרטי הילד/ה" },
  { number: 2, label: "התאמה אישית" },
  { number: 3, label: "הרשמה" },
  { number: 4, label: "נושא" },
  { number: 5, label: "יצירה" },
];

const CreateStory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { credits, loading: creditsLoading, hasCredits, refetch: refetchCredits } = useCredits();
  const { trackEvent } = useAnalytics();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<StoryFormData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);

  // Funnel: wizard opened
  useEffect(() => {
    trackEvent({ eventType: "create_story_opened" });
  }, [trackEvent]);

  // Resume after Google OAuth redirect
  useEffect(() => {
    if (searchParams.get('resume') === 'true') {
      const saved = localStorage.getItem('pending_story_formData');
      if (saved) {
        try {
          const restored = JSON.parse(saved) as StoryFormData;
          setFormData(restored);
          setStep(5);
          setIsGenerating(true);
        } catch (e) {
          console.warn('[CreateStory] Failed to restore formData:', e);
        }
        localStorage.removeItem('pending_story_formData');
      }
      // Clean up URL
      navigate('/create', { replace: true });
      return;
    }
    // Restore wizard draft saved before navigating away to demo story
    try {
      const draft = sessionStorage.getItem('create_wizard_draft');
      if (draft) {
        const parsed = JSON.parse(draft) as Partial<StoryFormData>;
        const allowed: (keyof StoryFormData)[] = ['childName', 'childGender', 'ageRange', 'storyLength', 'language'];
        const filtered: Partial<StoryFormData> = {};
        for (const k of allowed) {
          if (parsed[k] !== undefined) (filtered as any)[k] = parsed[k];
        }
        setFormData((prev) => ({ ...prev, ...filtered }));
        sessionStorage.removeItem('create_wizard_draft');
      }
    } catch (e) {
      console.warn('[CreateStory] Failed to restore wizard draft:', e);
    }
  }, [searchParams, navigate]);

  const handleStoryGenerated = useCallback(async (storyId: string) => {
    // Credits are now deducted server-side in generate-story — just refetch local state
    try { await refetchCredits(); } catch (e) { console.warn("[CreateStory] Credit refetch failed:", e); }
    
    // Try to get slug for clean URL, fallback to UUID
    let slug = storyId;
    try {
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase
          .from("stories")
          .select("id, slug")
          .eq("id", storyId)
          .maybeSingle();
        if (data) {
          slug = data.slug || storyId;
          break;
        }
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e) {
      console.warn("[CreateStory] Slug lookup failed, using UUID:", e);
    }
    
    // If user is not authenticated, route to public viewer with guest banner
    if (!user) {
      sessionStorage.setItem("guest_story_id", storyId);
      navigate(`/public-story/${slug}`);
      return;
    }
    
    // Mark that a story was just created so the PDF popup shows
    sessionStorage.setItem("just_created_story", "true");
    // Navigate using slug for clean URLs — guaranteed to run
    navigate(`/story/${slug}`);
  }, [refetchCredits, navigate, user]);

  const handleStoryGeneratedRef = useRef(handleStoryGenerated);
  useEffect(() => { handleStoryGeneratedRef.current = handleStoryGenerated; }, [handleStoryGenerated]);
  const stableOnComplete = useCallback((id: string) => handleStoryGeneratedRef.current(id), []);

  // No auth redirect — unauthenticated users can browse freely

  const updateFormData = (updates: Partial<StoryFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceedStep1 =
    formData.childName.trim().length > 0 &&
    typeof formData.childAge === "number" &&
    formData.childAge >= 1 &&
    formData.childAge <= 12;

  const canProceedPersonalization = Boolean(
    formData.childPhoto &&
    formData.childPhoto.trim().length > 0 &&
    formData.photoConsent
  );

  const canProceedTopic = formData.topic.length > 0 || formData.customTopic.trim().length > 0;

  const handleNext = () => {
    if (step === 1 && canProceedStep1) {
      setStep(2);
    } else if (step === 2 && canProceedPersonalization) {
      trackEvent({
        eventType: "child_info_completed",
        metadata: {
          age_range: formData.ageRange,
          gender: formData.childGender,
          has_photo: Boolean(formData.childPhoto),
          language: formData.language,
        },
      });
      if (formData.childPhoto) {
        trackEvent({ eventType: "photo_uploaded" });
      }
      // Skip auth step if user already logged in
      setStep(user ? 4 : 3);
    } else if (step === 4 && canProceedTopic) {
      trackEvent({
        eventType: "topic_selected",
        metadata: {
          topic: formData.topic || "custom",
          is_custom: !formData.topic,
        },
      });
      // If logged in, check credits first
      if (user && !hasCredits()) {
        trackEvent({ eventType: "paywall_view", metadata: { reason: "no_credits" } });
        navigate('/upgrade?noCredits=true');
        return;
      }
      trackEvent({ eventType: "generation_started" });
      setStep(5);
      setIsGenerating(true);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigate("/"); // Go back to home from first step
    } else if (step === 4) {
      // Skip auth step on the way back if logged in
      setStep(user ? 2 : 3);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  // Step 5 - Full screen generating, no header/footer
  if (step === 5) {
    return (
      <GeneratingStep
        formData={formData}
        onComplete={stableOnComplete}
      />
    );
  }

  // Steps 1-4 - Regular wizard layout
  const displayStep = step;
  const visibleSteps = user ? steps.filter((s) => s.number !== 3) : steps;

  return (
    <div className="flex flex-col bg-background" style={{ minHeight: '100dvh', height: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
          
        </div>
        
        <div className="container max-w-lg mx-auto mt-2">
          <div className="flex items-center justify-between">
            {visibleSteps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                      displayStep >= s.number
                        ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white shadow-md"
                        : "bg-purple-100 text-purple-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-[9px] mt-0.5 text-purple-500 whitespace-nowrap">
                    {s.label}
                  </span>
                </div>
                {index < visibleSteps.length - 1 && (
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
      </header>

      <main className="flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="container max-w-lg mx-auto px-2 py-3" style={{ paddingBottom: '180px' }}>
          {(step === 1 || step === 2) && (
            <ChildInfoStep
              formData={formData}
              updateFormData={updateFormData}
              screen={step === 1 ? 1 : 2}
            />
          )}
          {step === 3 && !user && (
            <AuthStep
              formData={formData}
              onAuthenticated={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <TopicStep formData={formData} updateFormData={updateFormData} />
          )}
        </div>
      </main>

      {step !== 3 && (
        <div className="fixed bottom-[4.5rem] left-0 right-0 z-[50] bg-gradient-to-t from-background via-background to-transparent pt-6 pb-2 px-3 pb-safe">
          <div className="container max-w-lg mx-auto">
            <Button
              onClick={handleNext}
              disabled={
                step === 1
                  ? !canProceedStep1
                  : step === 2
                    ? !canProceedPersonalization
                    : !canProceedTopic
              }
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white font-black text-sm py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {step === 4 ? "צרו את הסיפור" : "המשיכו"}
              <ArrowLeft className="w-4 h-4 mr-1.5" />
            </Button>
            <GlobalFooter />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="pb-24">
          <GlobalFooter />
        </div>
      )}

      <MobileNavigation />
    </div>
  );
};

export default CreateStory;
