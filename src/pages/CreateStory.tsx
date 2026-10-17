import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import MobileNavigation from "@/components/MobileNavigation";
import GlobalFooter from "@/components/shared/GlobalFooter";
import ChildInfoStep from "@/components/wizard/ChildInfoStep";
import TopicStep from "@/components/wizard/TopicStep";
import GeneratingStep from "@/components/wizard/GeneratingStep";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { isDevModeEnabled } from "@/hooks/use-dev-mode";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  startGenerationSession,
  getActiveGenerationSession,
  clearGenerationSession,
  decideArrival,
  newRequestId,
  type ArrivalDecision,
} from "@/lib/story-generation-session";

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
  { number: 3, label: "נושא" },
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
  const [awaitingGenerationAfterAuth, setAwaitingGenerationAfterAuth] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [arrival, setArrival] = useState<ArrivalDecision | null>(null);
  const [arrivalChecked, setArrivalChecked] = useState(false);
  const startGenerationRef = useRef<(freshUserId?: string) => Promise<void>>(async () => {});

  // Funnel: wizard opened
  useEffect(() => {
    trackEvent({ eventType: "create_story_opened" });
  }, [trackEvent]);

  // Returning with ?resume=true (after re-login): the in-progress mark drives
  // the resume (see the arrival check below) — just clean up the URL.
  useEffect(() => {
    if (searchParams.get('resume') === 'true') {
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
      navigate(`/s/${slug}`);
      return;
    }
    
    // Creation finished: drop the in-progress mark and the saved form
    clearGenerationSession(user.id);
    // Mark that a story was just created so the PDF popup shows
    sessionStorage.setItem("just_created_story", "true");
    // Navigate using slug for clean URLs — guaranteed to run
    navigate(`/story/${slug}`);
  }, [refetchCredits, navigate, user]);

  // After signing up / logging in on the last wizard step, start generation
  // as soon as the session is available.
  useEffect(() => {
    if (!awaitingGenerationAfterAuth || !user) return;
    setAwaitingGenerationAfterAuth(false);
    void startGenerationRef.current(user.id);
  }, [awaitingGenerationAfterAuth, user]);

  const handleStoryGeneratedRef = useRef(handleStoryGenerated);
  useEffect(() => { handleStoryGeneratedRef.current = handleStoryGenerated; }, [handleStoryGenerated]);
  const stableOnComplete = useCallback((id: string) => handleStoryGeneratedRef.current(id), []);

  // Sign-up happens before the wizard: guests are sent to the single sign-up screen.
  // Only at entry: once a user was seen on this page, or a creation is running,
  // a momentary "no user" (sign-in refresh) never sends anyone away.
  const hasConfirmedUserRef = useRef(false);
  if (user) hasConfirmedUserRef.current = true;
  useEffect(() => {
    if (loading || user || isDevModeEnabled()) return;
    if (hasConfirmedUserRef.current || step === 5) return;
    navigate('/auth?returnTo=%2Fcreate%3Fresume%3Dtrue', { replace: true });
  }, [loading, user, step, navigate]);

  // Safety net on arrival: a valid in-progress mark means a creation was
  // interrupted (reload, tab closed, re-login). Show / resume it instead of the form.
  useEffect(() => {
    if (loading || !user || arrivalChecked) return;
    if (step === 5) { setArrivalChecked(true); return; }
    const session = getActiveGenerationSession<StoryFormData>(user.id);
    if (!session) { setArrivalChecked(true); return; }
    let cancelled = false;
    (async () => {
      const { data: story } = await supabase
        .from("stories")
        .select("id, slug, generation_status")
        .eq("user_id", user.id)
        .eq("client_request_id", session.requestId)
        .maybeSingle();
      if (cancelled) return;
      const decision = decideArrival(session as any, story ?? null);
      if (decision.kind === "resume_generation" && session.formData) {
        // Never reached the server (or it failed and was refunded): re-send the SAME ID.
        setFormData({ ...INITIAL_DATA, ...session.formData });
        setRequestId(session.requestId);
        setStep(5);
      } else if (decision.kind === "restore_form" && session.formData) {
        clearGenerationSession(user.id);
        setFormData({ ...INITIAL_DATA, ...session.formData, childPhoto: null, photoConsent: false });
        setStep(2);
      } else if (decision.kind === "form") {
        clearGenerationSession(user.id);
      } else {
        setArrival(decision);
      }
      setArrivalChecked(true);
    })();
    return () => { cancelled = true; };
  }, [loading, user, arrivalChecked, step]);

  // While "still being created", keep checking until the story is ready.
  useEffect(() => {
    if (arrival?.kind !== "still_generating" || !user) return;
    const id = arrival.storyId;
    const t = setInterval(async () => {
      const { data } = await supabase.from("stories").select("id, slug, generation_status").eq("id", id).maybeSingle();
      if (!data || data.generation_status === "failed") {
        clearInterval(t);
        clearGenerationSession(user.id);
        setArrival(null);
        return;
      }
      if (data.generation_status !== "generating") {
        clearInterval(t);
        setArrival({ kind: "ready", storyId: data.id, slug: data.slug });
      }
    }, 4000);
    return () => clearInterval(t);
  }, [arrival, user]);

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

  const handleNext = async () => {
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
      setStep(3);
    } else if (step === 3 && canProceedTopic) {
      trackEvent({
        eventType: "topic_selected",
        metadata: {
          topic: formData.topic || "custom",
          is_custom: !formData.topic,
        },
      });
      if (!user && !isDevModeEnabled()) {
        navigate('/auth?returnTo=%2Fcreate');
        return;
      }
      await startGeneration();
    }
  };

  // Credit check + start generation. Used after the topic step (logged in)
  // and right after signing up / logging in on the auth step.
  // `freshUserId` is passed right after sign-up / log-in, when the credits
  // hook may not have reloaded yet; credits are then read straight from the
  // profile so a returning user with credits is not sent to the paywall.
  const startGeneration = async (freshUserId?: string) => {
    {
      const uid = freshUserId ?? user?.id ?? null;
      let noCredits = false;
      if (freshUserId) {
        const { data } = await supabase
          .from('profiles')
          .select('story_credits')
          .eq('id', freshUserId)
          .maybeSingle();
        noCredits = (data?.story_credits ?? 1) <= 0;
      } else {
        noCredits = !!user && !hasCredits();
      }
      if (uid && noCredits) {
        // Check whether this user has ever created a story before
        const { count } = await supabase
          .from('stories')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .or('generation_status.is.null,generation_status.not.in.(generating,failed)');

        // Returning users go straight to purchase; new users get the one-time free taste
        if (count && count > 0) {
          trackEvent({ eventType: "paywall_view", metadata: { reason: "no_credits_returning" } });
          navigate('/upgrade?noCredits=true');
          return;
        }
      }
      trackEvent({ eventType: "generation_started" });
      // One-time ID + saved form: a reload / re-login resumes this same creation
      // and the server never creates or charges twice for it.
      const session = uid
        ? startGenerationSession(uid, formData as unknown as Record<string, unknown>)
        : { requestId: newRequestId() };
      setRequestId(session.requestId);
      setStep(5);
      setIsGenerating(true);
    }
  };

  startGenerationRef.current = startGeneration;

  const startNewStory = () => {
    clearGenerationSession(user?.id);
    setArrival(null);
    setRequestId(null);
    setFormData(INITIAL_DATA);
    setStep(1);
  };

  const openReadyStory = () => {
    if (arrival?.kind !== "ready") return;
    clearGenerationSession(user?.id);
    sessionStorage.setItem("just_created_story", "true");
    navigate(`/story/${arrival.slug || arrival.storyId}`);
  };

  const handleBack = () => {
    if (step === 1) {
      navigate("/"); // Go back to home from first step
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  // Step 5 - Full screen generating, no header/footer
  if (step === 5 && requestId) {
    return (
      <GeneratingStep
        formData={formData}
        requestId={requestId}
        onComplete={stableOnComplete}
      />
    );
  }

  // Checking for a creation in progress before showing the form
  if (!arrivalChecked && user) {
    return (
      <div className="flex items-center justify-center bg-background" style={{ minHeight: '100dvh' }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="טוען" />
      </div>
    );
  }

  // Safety net: a creation was in progress when the page reloaded / reopened
  if (arrival && (arrival.kind === "ready" || arrival.kind === "still_generating")) {
    const ready = arrival.kind === "ready";
    return (
      <div className="flex flex-col items-center justify-center bg-background px-6 text-center" style={{ minHeight: '100dvh' }} dir="rtl">
        <div className="max-w-sm w-full space-y-5">
          {!ready && <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" aria-hidden="true" />}
          <h1 className="text-2xl font-black text-foreground">
            {ready ? "הסיפור שלך מוכן! 🎉" : "הסיפור עדיין נוצר…"}
          </h1>
          <p className="text-base text-muted-foreground">
            {ready
              ? "אפשר לפתוח אותו עכשיו. האיורים ממשיכים להופיע תוך כדי קריאה."
              : "זה לוקח עוד כמה רגעים. הסיפור יופיע גם בספרייה ברגע שיהיה מוכן."}
          </p>
          {ready ? (
            <Button size="lg" className="w-full min-h-[48px] text-base font-bold" onClick={openReadyStory}>
              לסיפור
            </Button>
          ) : (
            <Button size="lg" className="w-full min-h-[48px] text-base font-bold" onClick={() => navigate('/library')}>
              לספרייה
            </Button>
          )}
          <Button size="lg" variant="outline" className="w-full min-h-[48px] text-base" onClick={startNewStory}>
            צור סיפור חדש
          </Button>
        </div>
      </div>
    );
  }

  // Steps 1-4 - Regular wizard layout
  const displayStep = step;
  const visibleSteps = steps;

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
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      displayStep >= s.number
                        ? "bg-primary text-white shadow-md"
                        : "bg-purple-100 text-purple-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs mt-0.5 text-purple-500 whitespace-nowrap">
                    {s.label}
                  </span>
                </div>
                {index < visibleSteps.length - 1 && (
                  <div
                    className={`h-0.5 w-4 sm:w-8 mx-0.5 rounded-full transition-all ${
                      displayStep > s.number ? "bg-primary" : "bg-purple-100"
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
          {step === 3 && (
            <TopicStep formData={formData} updateFormData={updateFormData} />
          )}
        </div>
      </main>

      {(
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
              className="w-full bg-primary hover:bg-primary/90 text-white font-black text-sm py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {step === 3 ? "צרו את הסיפור" : "המשיכו"}
              <ArrowLeft className="w-4 h-4 mr-1.5" />
            </Button>
            <GlobalFooter />
          </div>
        </div>
      )}

      <MobileNavigation />
    </div>
  );
};

export default CreateStory;
