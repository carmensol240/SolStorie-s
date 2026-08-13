import { useRef, useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Camera, Sparkles, RefreshCw, Trash2, Heart, ChevronDown, ChevronUp, Check, X, Loader2, Save, Shield, Globe, PlusCircle, BookOpen, ArrowLeft, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { isDevModeEnabled } from "@/hooks/use-dev-mode";
import { toast } from "sonner";

import { getUserData, setUserData } from "@/lib/user-storage";
import { stripBase64ForStorage } from "@/lib/strip-base64";

interface SavedChild {
  id: string;
  name: string;
  age: number;
  gender: string;
  photo_url: string | null;
  avatar_url: string | null;
  personality_traits: string | null;
  avatar_regeneration_count?: number;
}

interface ChildInfoStepProps {
  formData: StoryFormData;
  updateFormData: (updates: Partial<StoryFormData>) => void;
  /** 1 = basics (name/age/gender/language), 2 = personalization (photo/clothing/hair) */
  screen?: 1 | 2;
}

interface PhotoTip {
  text: string;
  isGood: boolean;
}

const photoTips: PhotoTip[] = [
  { text: "פנים מסתכלות קדימה", isGood: true },
  { text: "דמות יחידה בתמונה", isGood: true },
  { text: "ללא אביזרים (משקפי שמש, כובע)", isGood: true },
  { text: "תאורה טובה וברורה", isGood: true },
  { text: "מבט הצידה או פנים מוסתרות", isGood: false },
  { text: "יותר מילד/ה אחד/ת בתמונה", isGood: false },
];

// Helper to convert age number to age range
const CLOTHING_TYPES = [
  { value: "בגדי יומיום", emoji: "👕" },
  { value: "גיבור/ת על", emoji: "🦸" },
  { value: "שמלה", emoji: "👗" },
  { value: "בגד ים", emoji: "🩳" },
  { value: "פיג'מה", emoji: "🌙" },
  { value: "בגדי חורף", emoji: "❄️" },
];

const CLOTHING_COLORS = ["כחול", "ורוד", "אדום", "ירוק", "סגול", "צהוב"];

const HAIR_COLORS = ["חום", "שחור", "בלונדיני", "ג'ינג'י", "חום בהיר"];

const HAIR_STYLES = [
  { value: "קוקיות", emoji: "🎀" },
  { value: "צמה", emoji: "👱‍♀️" },
  { value: "שיער פזור", emoji: "💇‍♀️" },
  { value: "סרט/קליפס", emoji: "🎗️" },
  { value: "קצר", emoji: "✂️" },
];

const ageToRange = (age: number): "0-2" | "2-4" | "5-7" | "8-10" => {
  if (age <= 2) return "0-2";
  if (age <= 4) return "2-4";
  if (age <= 7) return "5-7";
  return "8-10";
};

// Helper to get a representative age from range
const rangeToAge = (range: string): number => {
  switch (range) {
    case "0-2": return 1;
    case "2-4": return 4;
    case "5-7": return 6;
    case "8-10": return 9;
    default: return 4;
  }
};

const ChildInfoStep = ({ formData, updateFormData, screen = 1 }: ChildInfoStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [savedChildren, setSavedChildren] = useState<SavedChild[]>([]);
  const [showPersonalityField, setShowPersonalityField] = useState(false);
  const [showPhotoTips, setShowPhotoTips] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [avatarRegenerationCount, setAvatarRegenerationCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDeletingChild, setIsDeletingChild] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [priorPhotoConsent, setPriorPhotoConsent] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const hasAutoLoadedRef = useRef<string | null>(null);

  // Persist selected child id so other screens (e.g. Library) can show the matching avatar
  useEffect(() => {
    if (!user?.id) return;
    if (selectedChildId) {
      setUserData(user.id, 'selected_child_id', selectedChildId);
    }
  }, [user?.id, selectedChildId]);

  // Fetch display name from profile for greeting
  useEffect(() => {
    if (!user) {
      setDisplayName(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, photo_consent_at")
        .eq("id", user.id)
        .maybeSingle();
      setDisplayName(data?.display_name || user.email?.split("@")[0] || null);
      if ((data as any)?.photo_consent_at) {
        updateFormData({ photoConsent: true });
        setPriorPhotoConsent(true);
      }
    })();
  }, [user]);
  const [photoValidation, setPhotoValidation] = useState<{
    facingForward: boolean;
    singlePerson: boolean;
    noAccessories: boolean;
    goodLighting: boolean;
  } | null>(null);
  const [isValidatingPhoto, setIsValidatingPhoto] = useState(false);
  
  // (Age is now a free numeric input — formData.childAge is the source of truth)

  // Scroll to photo upload section when navigated with #photo-upload-section hash (e.g. from DemoStory CTA)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#photo-upload-section") {
      const t = setTimeout(() => {
        document.getElementById("photo-upload-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(t);
    }
  }, []);

  // Load saved children and auto-populate form on mount
  // Depend on user.id (not user object) so token refresh doesn't re-trigger.
  // Use hasAutoLoadedRef so we auto-load the first child only ONCE per user
  // and never overwrite a selection the user already made.
  useEffect(() => {
    const fetchChildren = async () => {
      const userKey = user?.id || '__guest__';
      const shouldAutoLoadFirst = hasAutoLoadedRef.current !== userKey;
      if (user) {
        // Fetch role
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_role")
          .eq("id", user.id)
          .maybeSingle();
        if (profileData) setUserRole(profileData.user_role);

        // Fetch from database for authenticated users
        const { data, error } = await supabase
          .from("children")
          .select("id, name, age, gender, photo_url, avatar_url, personality_traits, fixed_details, clothing_type, clothing_color, hair_color, hair_style")
          .eq("user_id", user.id);
        
        if (!error && data && data.length > 0) {
          setSavedChildren(data);
          if (shouldAutoLoadFirst) {
            hasAutoLoadedRef.current = userKey;
            const firstChild = data[0];
            setIsCreatingNew(false);
            setSelectedChildId(firstChild.id);
            updateFormData({
              childName: firstChild.name,
              childGender: firstChild.gender as "male" | "female",
              ageRange: ageToRange(firstChild.age),
              childAge: firstChild.age,
              childPhoto: firstChild.photo_url,
              childAvatarUrl: firstChild.avatar_url,
              personalityTraits: firstChild.personality_traits || "",
              fixedDetails: (firstChild as any).fixed_details || "",
              clothingType: (firstChild as any).clothing_type || "",
              clothingColor: (firstChild as any).clothing_color || "",
              hairColor: (firstChild as any).hair_color || "",
              hairStyle: (firstChild as any).hair_style || "",
            });
            if (firstChild.personality_traits) {
              setShowPersonalityField(true);
            }
          }
        } else if (!error && data) {
          setSavedChildren(data);
        }
      } else {
        // Load from localStorage for guest/dev mode users
        const localChildren = JSON.parse(getUserData(user?.id, 'savedChildren') || '[]');
        if (localChildren.length > 0) {
          setSavedChildren(localChildren);
          if (shouldAutoLoadFirst) {
            hasAutoLoadedRef.current = userKey;
            const firstChild = localChildren[0];
            setIsCreatingNew(false);
            setSelectedChildId(firstChild.id);
            updateFormData({
              childName: firstChild.name,
              childGender: firstChild.gender as "male" | "female",
              ageRange: ageToRange(firstChild.age),
              childAge: firstChild.age,
              childPhoto: firstChild.photo_url,
              childAvatarUrl: firstChild.avatar_url,
              personalityTraits: firstChild.personality_traits || "",
              fixedDetails: firstChild.fixed_details || "",
              clothingType: firstChild.clothing_type || "",
              clothingColor: firstChild.clothing_color || "",
              hairColor: firstChild.hair_color || "",
              hairStyle: firstChild.hair_style || "",
            });
            if (firstChild.personality_traits) {
              setShowPersonalityField(true);
            }
          }
        }
      }
    };
    
    fetchChildren();
  }, [user?.id]);

  // Handle numeric age input
  const handleAgeInputChange = (raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      updateFormData({ childAge: 0 as any });
      return;
    }
    const clamped = Math.max(1, Math.min(12, n));
    updateFormData({ childAge: clamped, ageRange: ageToRange(clamped) });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingPhoto(true);
    
    try {
      // First read as data URL for preview
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoBase64 = reader.result as string;
        updateFormData({ childPhoto: photoBase64 });
        
        // Validate photo quality with AI
        setPhotoValidation(null);
        setIsValidatingPhoto(true);
        try {
          const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-child-photo', {
            body: { childPhoto: photoBase64 }
          });
          if (!validationError && validationData?.validation) {
            setPhotoValidation(validationData.validation);
          }
        } catch (err) {
          console.error('Photo validation error:', err);
        } finally {
          setIsValidatingPhoto(false);
        }
        
        // Auto-generate avatar inline immediately after upload
        generateAvatarInline(photoBase64);
        
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploadingPhoto(false);
    }
  };

  const generateAvatarInline = async (photo?: string) => {
    const photoToUse = photo || formData.childPhoto;
    if (!photoToUse || isGeneratingAvatar) return;
    
    if (avatarRegenerationCount >= 2) {
      toast.error('הגעת למגבלת היצירות (2 פעמים)');
      return;
    }
    
    setIsGeneratingAvatar(true);
    try {
      const { data, error } = await supabase.functions.invoke('preview-child-avatar', {
        body: { childPhoto: photoToUse }
      });
      if (error) throw new Error(error.message || 'שגיאה בשרת');
      if (data?.error) throw new Error(data.error);
      if (data?.previewUrl) {
        updateFormData({ childAvatarUrl: data.previewUrl });
        const newCount = avatarRegenerationCount + 1;
        setAvatarRegenerationCount(newCount);
        // Persist count
        const currentChild = selectedChildId
          ? savedChildren.find(c => c.id === selectedChildId)
          : undefined;
        if (currentChild) {
          const updatedChildren = savedChildren.map(c =>
            c.id === currentChild.id ? { ...c, avatar_regeneration_count: newCount } : c
          );
          setSavedChildren(updatedChildren);
          setUserData(user?.id, 'savedChildren', JSON.stringify(stripBase64ForStorage(updatedChildren)));
        }
      } else {
        throw new Error('לא התקבלה תמונה מהשרת');
      }
    } catch (err) {
      console.error('Avatar generation error:', err);
      toast.error(err instanceof Error ? err.message : 'שגיאה ביצירת הדמות');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleRegenerationCountChange = (count: number) => {
    setAvatarRegenerationCount(count);
    // Update in saved children if exists
    const currentChild = selectedChildId
      ? savedChildren.find(c => c.id === selectedChildId)
      : undefined;
    if (currentChild) {
      const updatedChildren = savedChildren.map(c => 
        c.id === currentChild.id ? { ...c, avatar_regeneration_count: count } : c
      );
      setSavedChildren(updatedChildren);
      
      // Persist to localStorage for all users
      setUserData(user?.id, 'savedChildren', JSON.stringify(stripBase64ForStorage(updatedChildren)));
    }
  };

  const loadChildProfile = (child: SavedChild) => {
    setIsCreatingNew(false);
    setSelectedChildId(child.id);
    updateFormData({
      childName: child.name,
      childGender: child.gender as "male" | "female",
      ageRange: ageToRange(child.age),
      childAge: child.age,
      childPhoto: child.photo_url,
      childAvatarUrl: child.avatar_url,
      personalityTraits: child.personality_traits || "",
      fixedDetails: (child as any).fixed_details || "",
      clothingType: (child as any).clothing_type || "",
      clothingColor: (child as any).clothing_color || "",
      hairColor: (child as any).hair_color || "",
      hairStyle: (child as any).hair_style || "",
    });
    
    // Load avatar regeneration count
    setAvatarRegenerationCount(child.avatar_regeneration_count || 0);
    // Avatar regeneration count loaded above
    
    if (child.personality_traits) {
      setShowPersonalityField(true);
    }
  };

  const handleSaveChildProfile = async () => {
    if (!formData.childName.trim()) {
      toast.error("נא להזין את שם הילד/ה");
      return;
    }

    setIsSavingChild(true);
    const selectedAge = formData.childAge && formData.childAge > 0
      ? formData.childAge
      : rangeToAge(formData.ageRange);

    try {
      // In dev mode or for non-logged users, always save to localStorage
      const isDevMode = isDevModeEnabled();
      const shouldUseLocalStorage = isDevMode || !user;

      if (!shouldUseLocalStorage && user) {
        // Use upsert for database persistence
        const childData = {
          user_id: user.id,
          name: formData.childName,
          age: selectedAge,
          gender: formData.childGender,
          photo_url: formData.childPhoto,
          avatar_url: formData.childAvatarUrl,
          personality_traits: formData.personalityTraits || null,
          fixed_details: formData.fixedDetails || null,
          clothing_type: formData.clothingType || null,
          clothing_color: formData.clothingColor || null,
          hair_color: formData.hairColor || null,
          hair_style: formData.hairStyle || null,
        };

        // When creating a new profile, never match against existing children by name.
        // Only treat as an update when the user explicitly loaded an existing profile.
        const existingChild = isCreatingNew || !selectedChildId
          ? undefined
          : savedChildren.find(c => c.id === selectedChildId);

        // If user is creating a new profile but typed a name that collides with an existing one,
        // refuse to overwrite — ask them to pick a different name.
        if (isCreatingNew && savedChildren.some(c => c.name === formData.childName)) {
          toast.error("כבר קיים פרופיל בשם הזה. נא לבחור שם אחר.");
          setIsSavingChild(false);
          return;
        }

        if (existingChild) {
          // Update existing child
          const { error } = await supabase
            .from("children")
            .update({
              name: formData.childName,
              age: selectedAge,
              gender: formData.childGender,
              photo_url: formData.childPhoto,
              avatar_url: formData.childAvatarUrl,
              personality_traits: formData.personalityTraits || null,
              fixed_details: formData.fixedDetails || null,
              clothing_type: formData.clothingType || null,
              clothing_color: formData.clothingColor || null,
              hair_color: formData.hairColor || null,
              hair_style: formData.hairStyle || null,
            })
            .eq("id", existingChild.id);

          if (error) {
            console.error('Supabase update error:', error);
            throw new Error(error.message);
          }
          
          // Update local state
          setSavedChildren(prev => prev.map(c => 
            c.id === existingChild.id 
              ? { ...c, name: formData.childName, age: selectedAge, gender: formData.childGender, photo_url: formData.childPhoto, avatar_url: formData.childAvatarUrl, personality_traits: formData.personalityTraits }
              : c
          ));
        } else {
          // Create new child
          const { data, error } = await supabase
            .from("children")
            .insert(childData)
            .select()
            .single();

          if (error) {
            console.error('Supabase insert error:', error);
            throw new Error(error.message);
          }
          
          // Add to local state
          if (data) {
            setSavedChildren(prev => [...prev, data]);
            setIsCreatingNew(false);
            setSelectedChildId(data.id);
          }
        }
        
        toast.success("הפרטים נשמרו בהצלחה! 🎉");
      } else {
        // Save to localStorage for dev mode or non-logged users
        const savedChild = {
          id: selectedChildId && !isCreatingNew ? selectedChildId : `local-${Date.now()}`,
          name: formData.childName,
          age: selectedAge,
          gender: formData.childGender,
          photo_url: formData.childPhoto,
          avatar_url: formData.childAvatarUrl,
          personality_traits: formData.personalityTraits,
        };
        
        const existingChildren = JSON.parse(getUserData(user?.id, 'savedChildren') || '[]');
        const existingIndex = isCreatingNew || !selectedChildId
          ? -1
          : existingChildren.findIndex((c: SavedChild) => c.id === selectedChildId);

        if (isCreatingNew && existingChildren.some((c: SavedChild) => c.name === formData.childName)) {
          toast.error("כבר קיים פרופיל בשם הזה. נא לבחור שם אחר.");
          setIsSavingChild(false);
          return;
        }

        if (existingIndex >= 0) {
          existingChildren[existingIndex] = savedChild;
        } else {
          existingChildren.push(savedChild);
          setIsCreatingNew(false);
          setSelectedChildId(savedChild.id);
        }
        
        setUserData(user?.id, 'savedChildren', JSON.stringify(stripBase64ForStorage(existingChildren)));
        setSavedChildren(existingChildren);
        
        toast.success("הפרטים נשמרו בהצלחה! 🎉");
      }
    } catch (error) {
      console.error('Error saving child profile:', error);
      const errorMessage = error instanceof Error ? error.message : "שגיאה לא ידועה";
      toast.error(`שגיאה בשמירה: ${errorMessage}`);
    } finally {
      setIsSavingChild(false);
    }
  };

  const handleDeleteChildProfile = async () => {
    const currentChild = selectedChildId
      ? savedChildren.find(c => c.id === selectedChildId)
      : undefined;
    if (!currentChild) {
      toast.error("לא נבחר פרופיל למחיקה");
      return;
    }

    setIsDeletingChild(true);
    try {
      if (user && !currentChild.id.startsWith('local-')) {
        const { error } = await supabase
          .from("children")
          .delete()
          .eq("id", currentChild.id);
        if (error) throw new Error(error.message);
      } else {
        const localChildren = JSON.parse(localStorage.getItem('savedChildren') || '[]');
        const filtered = localChildren.filter((c: SavedChild) => c.id !== currentChild.id);
        localStorage.setItem('savedChildren', JSON.stringify(filtered));
      }

      setSavedChildren(prev => prev.filter(c => c.id !== currentChild.id));
      setSelectedChildId(null);
      updateFormData({
        childName: "",
        childGender: "male",
        ageRange: "2-4",
        childAge: 4,
        childPhoto: null,
        childAvatarUrl: null,
        personalityTraits: "",
        className: "",
        fixedDetails: "",
        clothingType: "",
        clothingColor: "",
        hairColor: "",
        hairStyle: "",
      });
      
      toast.success(`הפרופיל של ${currentChild.name} נמחק בהצלחה`);
    } catch (error) {
      console.error('Error deleting child profile:', error);
      toast.error("שגיאה במחיקת הפרופיל");
    } finally {
      setIsDeletingChild(false);
    }
  };

  return (

    <div className="w-full space-y-2 px-1">
      {screen === 1 && (
      <>
      {/* Personalized greeting (logged-in users) */}
      {user && (
        <div className="text-center mb-1">
          <h2 className="text-base sm:text-lg font-bold">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              שלום, {displayName || "משתמש"}!
            </span>{" "}👋
          </h2>
        </div>
      )}
      {/* Title */}
      <div className="text-center">
        <h1 className="text-lg font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">ספרו לנו על הילד/ה</h1>
      </div>

      {/* Profiles row: saved children + new/delete actions (actions on the LEFT) */}
      <div className="flex gap-1.5 flex-wrap items-center" dir="rtl">
        {savedChildren.map((child) => (
          <button
            key={child.id}
            type="button"
            onClick={() => loadChildProfile(child)}
            className={cn(
              "px-3 py-1.5 rounded-lg border-2 transition-all flex items-center gap-1.5 text-xs font-medium",
              selectedChildId === child.id
                ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
                : "border-border bg-card hover:border-purple-300"
            )}
          >
            <span>{child.gender === "female" ? "👧" : "👦"}</span>
            <span>{child.name}</span>
          </button>
        ))}
        <div className="flex items-center gap-1.5 ms-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              updateFormData({
                childName: "",
                childGender: "male",
                ageRange: "2-4",
                childAge: 4,
                childPhoto: null,
                childAvatarUrl: null,
                personalityTraits: "",
                className: "",
                fixedDetails: "",
                clothingType: "",
                clothingColor: "",
                hairColor: "",
                hairStyle: "",
              });
              setIsCreatingNew(true);
              setSelectedChildId(null);
              setAvatarRegenerationCount(0);
              toast.success("הטופס נוקה - הזינו פרטי ילד/ה חדש/ה");
            }}
            className="text-sm font-bold text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <PlusCircle className="w-4 h-4 ml-1" />
            פרופיל חדש +
          </Button>
          {selectedChildId && savedChildren.some(c => c.id === selectedChildId) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeleteChildProfile}
              disabled={isDeletingChild}
              className="text-sm text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              {isDeletingChild ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Child Name + Fixed Details Row */}
      <div className="space-y-1">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Child Name - narrower */}
          <div className="sm:w-1/3 space-y-1">
            <Label htmlFor="childName" className="text-xs font-medium">
              שם הילד/ה
            </Label>
            <Input
              id="childName"
              type="text"
              placeholder="שם הילד/ה"
              value={formData.childName}
              onChange={(e) => updateFormData({ childName: e.target.value })}
              className="h-9 text-sm font-medium border-purple-200 focus:border-purple-400"
              dir="rtl"
            />
          </div>
          
          {/* Fixed Details - wider */}
          <div className="sm:flex-1 space-y-1">
            <Label htmlFor="fixedDetails" className="text-xs font-medium">
              פרטים קבועים (אופציונלי)
            </Label>
            <Textarea
              id="fixedDetails"
              placeholder="למשל: בן 4, מבנה משפחתי, חיית מחמד..."
              value={formData.fixedDetails || ""}
              onChange={(e) => updateFormData({ fixedDetails: e.target.value })}
              className="min-h-[36px] h-9 text-sm border-purple-200 focus:border-purple-400 resize-none"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      {/* Gender Selection */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">מגדר</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateFormData({ childGender: "male" })}
            className={cn(
              "p-1.5 rounded-lg border-2 transition-all text-center flex items-center justify-center gap-1.5",
              formData.childGender === "male"
                ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100"
                : "border-border bg-card hover:border-purple-300"
            )}
          >
            <span className="text-base">🦸‍♂️</span>
            <span className="text-xs font-bold">גיבור</span>
          </button>
          <button
            onClick={() => updateFormData({ childGender: "female" })}
            className={cn(
              "p-1.5 rounded-lg border-2 transition-all text-center flex items-center justify-center gap-1.5",
              formData.childGender === "female"
                ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100"
                : "border-border bg-card hover:border-purple-300"
            )}
          >
            <span className="text-base">🦸‍♀️</span>
            <span className="text-xs font-bold">גיבורה</span>
          </button>
        </div>
      </div>

      {/* Age · Language - Compact Row */}
      <div className="grid grid-cols-2 gap-2 items-start">
        {/* Age (numeric input) */}
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-center block">גיל הילד/ה</Label>
          <div className="flex items-center justify-center gap-2 py-1">
            <Input
              type="number"
              min={1}
              max={12}
              inputMode="numeric"
              value={formData.childAge ? String(formData.childAge) : ""}
              onChange={(e) => handleAgeInputChange(e.target.value)}
              className="w-16 h-10 text-center text-base font-bold border-2 border-purple-300 focus-visible:border-purple-500"
              aria-label="גיל הילד/ה בשנים"
            />
            <span className="text-xs font-medium text-muted-foreground">שנים</span>
          </div>
        </div>

        {/* Language */}
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-center block">שפה</Label>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => updateFormData({ language: "he", nikud: true })}
              className={cn(
                "py-1.5 rounded-md border transition-all text-center text-sm font-bold flex items-center justify-center gap-1",
                formData.language === "he"
                  ? "border-purple-500 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white"
                  : "border-border bg-card hover:border-purple-300"
              )}
            >
              🇮🇱 עברית
            </button>
            <button
              onClick={() => updateFormData({ language: "en", nikud: false })}
              className={cn(
                "py-1.5 rounded-md border transition-all text-center text-sm font-bold flex items-center justify-center gap-1",
                formData.language === "en"
                  ? "border-purple-500 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white"
                  : "border-border bg-card hover:border-purple-300"
              )}
            >
              🇺🇸 EN
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {screen === 2 && (
      <>
      {/* Title */}
      <div className="text-center">
        <h1 className="text-lg font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">נוסיף תמונה והתאמה אישית</h1>
      </div>

      {/* Clothing type · Clothing color */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">סוג לבוש</Label>
        <div className="grid grid-cols-3 gap-2">
          {CLOTHING_TYPES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => updateFormData({ clothingType: item.value })}
              className={cn(
                "p-1.5 rounded-lg border-2 transition-all text-center flex items-center justify-center gap-1",
                formData.clothingType === item.value
                  ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100"
                  : "border-border bg-card hover:border-purple-300"
              )}
            >
              <span className="text-base">{item.emoji}</span>
              <span className="text-[11px] font-bold">{item.value}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium">צבע עיקרי</Label>
        <div className="grid grid-cols-3 gap-2">
          {CLOTHING_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => updateFormData({ clothingColor: color })}
              className={cn(
                "p-1.5 rounded-lg border-2 transition-all text-center flex items-center justify-center",
                formData.clothingColor === color
                  ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100"
                  : "border-border bg-card hover:border-purple-300"
              )}
            >
              <span className="text-[11px] font-bold">{color}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hair color · Hair style */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">צבע שיער</Label>
        <div className="grid grid-cols-3 gap-2">
          {HAIR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => updateFormData({ hairColor: color })}
              className={cn(
                "p-1.5 rounded-lg border-2 transition-all text-center flex items-center justify-center",
                formData.hairColor === color
                  ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100"
                  : "border-border bg-card hover:border-purple-300"
              )}
            >
              <span className="text-[11px] font-bold">{color}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium">תסרוקת</Label>
        <div className="grid grid-cols-3 gap-2">
          {HAIR_STYLES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => updateFormData({ hairStyle: item.value })}
              className={cn(
                "p-1.5 rounded-lg border-2 transition-all text-center flex items-center justify-center gap-1",
                formData.hairStyle === item.value
                  ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100"
                  : "border-border bg-card hover:border-purple-300"
              )}
            >
              <span className="text-base">{item.emoji}</span>
              <span className="text-[11px] font-bold">{item.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Class/Kindergarten Name - Educators only */}
      {userRole === "educator" && (
        <div className="space-y-1">
          <Label htmlFor="className" className="text-xs font-medium flex items-center gap-1.5">
            🏫 שם הכיתה / הגן
          </Label>
          <Input
            id="className"
            type="text"
            placeholder="לדוגמה: כיתת הדבורים, גן חבצלת"
            value={formData.className || ""}
            onChange={(e) => updateFormData({ className: e.target.value })}
            className="h-9 text-sm font-medium border-purple-200 focus:border-purple-400"
            dir="rtl"
            maxLength={100}
          />
          <p className="text-[10px] text-muted-foreground">שם הכיתה ישולב בסיפור בצורה טבעית</p>
        </div>
      )}

      {/* Photo Upload - Enlarged */}
      <div id="photo-upload-section" className="space-y-1.5 scroll-mt-24">
        <Label className="text-xs font-medium">תמונה של הילד/ה</Label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          {isUploadingPhoto ? (
            <div className="flex flex-col items-center justify-center w-full py-8 bg-card border-2 border-purple-400 bg-purple-50 rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500 mb-2" />
              <span className="text-sm text-muted-foreground">מעלה תמונה...</span>
            </div>
          ) : formData.childPhoto ? (
            <div className="flex flex-col items-center justify-center w-full py-4 sm:py-6 bg-card border-2 border-purple-400 bg-purple-50 rounded-xl gap-2">
              {(formData.childAvatarUrl || isGeneratingAvatar) && formData.childPhoto ? (
                /* Avatar only — magical Disney-style display */
                <div className="relative w-full flex flex-col items-center gap-3 py-2">
                  <div className="relative w-full max-w-md mx-auto aspect-square">
                    {/* Golden magical glow behind avatar */}
                    <div
                      className="absolute -inset-6 rounded-full pointer-events-none animate-magic-glow"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(253,224,71,0.35) 40%, rgba(244,114,182,0.15) 65%, transparent 80%)",
                        filter: "blur(28px)",
                      }}
                      aria-hidden
                    />

                    {/* Avatar frame */}
                    <div
                      className="relative w-full h-full rounded-3xl overflow-hidden border-[3px] border-white ring-[6px] ring-amber-300/60 shadow-[0_0_60px_rgba(251,191,36,0.5)] flex items-center justify-center"
                      style={{
                        background: isGeneratingAvatar
                          ? "linear-gradient(135deg, hsl(280 60% 92%), hsl(330 70% 92%), hsl(40 80% 92%))"
                          : "hsl(280 60% 96%)",
                      }}
                    >
                      {isGeneratingAvatar ? (
                        <>
                          <div className="absolute inset-0 shimmer-overlay pointer-events-none" />
                          <Loader2 className="w-12 h-12 animate-spin text-purple-500 relative z-10" />
                        </>
                      ) : formData.childAvatarUrl ? (
                        <img
                          src={formData.childAvatarUrl}
                          alt="דמות בסיפור"
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>

                    {/* Sparkles around avatar — hidden while generating */}
                    {!isGeneratingAvatar && formData.childAvatarUrl && (
                      <>
                        <Sparkles
                          className="absolute -top-3 -right-2 w-6 h-6 text-amber-400 animate-twinkle drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                          style={{ animationDelay: "0s" }}
                          aria-hidden
                        />
                        <Star
                          className="absolute top-6 -left-4 w-4 h-4 text-yellow-300 fill-yellow-300 animate-twinkle drop-shadow-[0_0_4px_rgba(253,224,71,0.9)]"
                          style={{ animationDelay: "0.4s" }}
                          aria-hidden
                        />
                        <Sparkles
                          className="absolute top-1/3 -right-5 w-5 h-5 text-pink-300 animate-twinkle drop-shadow-[0_0_5px_rgba(249,168,212,0.8)]"
                          style={{ animationDelay: "0.9s" }}
                          aria-hidden
                        />
                        <Star
                          className="absolute bottom-8 -right-3 w-3 h-3 text-amber-300 fill-amber-300 animate-twinkle"
                          style={{ animationDelay: "1.3s" }}
                          aria-hidden
                        />
                        <Sparkles
                          className="absolute -bottom-2 left-6 w-5 h-5 text-yellow-400 animate-twinkle drop-shadow-[0_0_5px_rgba(250,204,21,0.85)]"
                          style={{ animationDelay: "1.7s" }}
                          aria-hidden
                        />
                        <Star
                          className="absolute bottom-1/3 -left-3 w-3.5 h-3.5 text-pink-200 fill-pink-200 animate-twinkle"
                          style={{ animationDelay: "2.1s" }}
                          aria-hidden
                        />
                      </>
                    )}
                  </div>

                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-md"
                    style={{
                      background: "linear-gradient(135deg, hsl(270 80% 60%), hsl(330 85% 65%))",
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingAvatar ? 'יוצר דמות...' : 'דמות בסיפור'}
                  </span>
                </div>
              ) : (
                /* Single image: original photo only — larger square */
                <div className="flex flex-col items-center gap-1">
                  <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-purple-300 shadow-md">
                    <img
                      src={formData.childPhoto!}
                      alt="תמונת הילד"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">תמונה מקורית</span>
                </div>
              )}
              {/* Photo Validation Criteria */}
              {isValidatingPhoto && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                  <span>בודק איכות תמונה...</span>
                </div>
              )}
              {photoValidation && !isValidatingPhoto && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full px-4">
                  <div className="flex items-center gap-1 text-[11px]">
                    {photoValidation.facingForward ? (
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    )}
                    <span className={photoValidation.facingForward ? "text-foreground" : "text-muted-foreground"}>פנים מסתכלות קדימה</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    {photoValidation.singlePerson ? (
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    )}
                    <span className={photoValidation.singlePerson ? "text-foreground" : "text-muted-foreground"}>דמות יחידה בתמונה</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    {photoValidation.noAccessories ? (
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    )}
                    <span className={photoValidation.noAccessories ? "text-foreground" : "text-muted-foreground"}>ללא אביזרים (משקפי שמש, כובע)</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    {photoValidation.goodLighting ? (
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    )}
                    <span className={photoValidation.goodLighting ? "text-foreground" : "text-muted-foreground"}>תאורה טובה וברורה</span>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                {!formData.childAvatarUrl && formData.childPhoto && !isGeneratingAvatar && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateAvatarInline()}
                    className="text-sm text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    <Sparkles className="w-4 h-4 ml-1" />
                    צור אווטאר
                  </Button>
                )}
                {isGeneratingAvatar && (
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>יוצר דמות...</span>
                  </div>
                )}
                {formData.childAvatarUrl && !isGeneratingAvatar && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      <Camera className="w-4 h-4 ml-1" />
                      החלף תמונה מקורית
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateAvatarInline()}
                      disabled={avatarRegenerationCount >= 2}
                      className="text-sm text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      <RefreshCw className="w-4 h-4 ml-1" />
                      עדכן אווטאר ({2 - avatarRegenerationCount})
                    </Button>
                  </>
                )}
                {!formData.childAvatarUrl && !isGeneratingAvatar && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateFormData({ childPhoto: null, childAvatarUrl: null, photoConsent: false });
                      setPhotoValidation(null);
                    }}
                    className="text-sm text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    מחק
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center w-full min-h-[140px] sm:min-h-[200px] md:min-h-[220px] bg-card border-2 border-dashed border-purple-200 rounded-xl cursor-pointer hover:border-purple-400 transition-colors p-4 sm:p-8 gap-2.5 sm:gap-5"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-6 h-6 sm:w-10 sm:h-10 text-purple-400" />
                <span className="text-sm sm:text-lg font-medium text-muted-foreground">העלו תמונה</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-y-2.5 w-full">
                {photoTips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-1 text-[10px] sm:text-sm">
                    {tip.isGood ? (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-3 h-3 sm:w-4 sm:h-4 text-destructive flex-shrink-0" />
                    )}
                    <span className={tip.isGood ? "text-foreground" : "text-muted-foreground"}>
                      {tip.text}
                    </span>
                  </div>
                ))}
              </div>
            </label>
          )}
        </div>

        {/* Photo consent checkbox - only when photo is uploaded AND user hasn't previously consented */}
        {formData.childPhoto && !priorPhotoConsent && (
          <div className="flex items-start gap-2 mt-2">
            <Checkbox
              id="photo-consent"
              checked={formData.photoConsent || false}
              onCheckedChange={(c) => {
                const checked = c === true;
                updateFormData({ photoConsent: checked });
                if (checked && user) {
                  supabase
                    .from("profiles")
                    .update({ photo_consent_at: new Date().toISOString() } as any)
                    .eq("id", user.id)
                    .is("photo_consent_at", null)
                    .then(() => {});
                }
              }}
              className={`border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 h-4 w-4 mt-0.5 ${!formData.photoConsent ? 'animate-[checkbox-pulse-glow_1.5s_infinite]' : ''}`}
            />
            <label htmlFor="photo-consent" className="text-[11px] text-muted-foreground cursor-pointer leading-tight">
              אני מסכים/ה לשימוש בתמונה לצורך יצירת איורי הסיפור בלבד
            </label>
          </div>
        )}
      </div>

      {/* Save Button - clearly visible above the fixed Continue button */}
      <div className="pt-2 pb-4">
        <Button
          type="button"
          onClick={handleSaveChildProfile}
          disabled={isSavingChild || !formData.childName.trim()}
          className="w-full h-12 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 font-bold text-sm rounded-xl border-2 border-purple-300 shadow-md hover:shadow-lg transition-all"
        >
          {isSavingChild ? (
            <Loader2 className="w-4 h-4 animate-spin ml-1.5" />
          ) : (
            <Save className="w-4 h-4 ml-1.5" />
          )}
          שמור פרטים לסיפורים הבאים
        </Button>
      </div>

      {/* Privacy Note */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground text-center pt-1">
        <Shield className="w-2.5 h-2.5" />
        <span>פרטי הילד/ה נשמרים בצורה מאובטחת ופרטית בהתאם לתקנות הפרטיות.</span>
      </div>

      
    </div>
  );
};

export default ChildInfoStep;
