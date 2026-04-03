import { useRef, useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Camera, Sparkles, RefreshCw, Trash2, Heart, ChevronDown, ChevronUp, Check, X, Loader2, Save, Shield, Globe, PlusCircle, BookOpen } from "lucide-react";
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
import AvatarPreviewDialog from "@/components/story/AvatarPreviewDialog";
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

// Age range buttons configuration
const AGE_BUTTONS = [
  { id: "0-2", label: "0-2", range: "0-2" as const },
  { id: "3-6", label: "3-6", range: "2-4" as const }, // Maps to internal 2-4 range
  { id: "7-8", label: "7-8", range: "5-7" as const }, // Maps to internal 5-7 range
  { id: "9-12", label: "9-12", range: "8-10" as const }, // Maps to internal 8-10 range
];

// Helper to convert age number to age range
const ageToRange = (age: number): "0-2" | "2-4" | "5-7" | "8-10" => {
  if (age <= 2) return "0-2";
  if (age <= 4) return "2-4";
  if (age <= 7) return "5-7";
  return "8-10";
};

// Helper to get display age button from range
const rangeToDisplayButton = (range: string): string => {
  switch (range) {
    case "0-2": return "0-2";
    case "2-4": return "3-6";
    case "5-7": return "7-8";
    case "8-10": return "9-12";
    default: return "3-6";
  }
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

const ChildInfoStep = ({ formData, updateFormData }: ChildInfoStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [savedChildren, setSavedChildren] = useState<SavedChild[]>([]);
  const [showPersonalityField, setShowPersonalityField] = useState(false);
  const [showPhotoTips, setShowPhotoTips] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [pendingPhotoForAvatar, setPendingPhotoForAvatar] = useState<string | null>(null);
  const [tempChildId, setTempChildId] = useState<string | null>(null);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [avatarRegenerationCount, setAvatarRegenerationCount] = useState(0);
  const [existingAvatarForDialog, setExistingAvatarForDialog] = useState<string | null>(formData.childAvatarUrl || null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDeletingChild, setIsDeletingChild] = useState(false);
  const [photoValidation, setPhotoValidation] = useState<{
    facingForward: boolean;
    singlePerson: boolean;
    noAccessories: boolean;
    goodLighting: boolean;
  } | null>(null);
  const [isValidatingPhoto, setIsValidatingPhoto] = useState(false);
  
  // Selected age button
  const [selectedAgeButton, setSelectedAgeButton] = useState<string>(rangeToDisplayButton(formData.ageRange));

  // Load saved children and auto-populate form on mount
  useEffect(() => {
    const fetchChildren = async () => {
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
          .select("id, name, age, gender, photo_url, avatar_url, personality_traits, fixed_details")
          .eq("user_id", user.id);
        
        if (!error && data && data.length > 0) {
          setSavedChildren(data);
          // Auto-load the first child's data
          const firstChild = data[0];
          setSelectedAgeButton(rangeToDisplayButton(ageToRange(firstChild.age)));
          updateFormData({
            childName: firstChild.name,
            childGender: firstChild.gender as "male" | "female",
            ageRange: ageToRange(firstChild.age),
            childPhoto: firstChild.photo_url,
            childAvatarUrl: firstChild.avatar_url,
            personalityTraits: firstChild.personality_traits || "",
            fixedDetails: (firstChild as any).fixed_details || "",
          });
          if (firstChild.personality_traits) {
            setShowPersonalityField(true);
          }
        } else if (!error && data) {
          setSavedChildren(data);
        }
      } else {
        // Load from localStorage for guest/dev mode users
        const localChildren = JSON.parse(getUserData(user?.id, 'savedChildren') || '[]');
        if (localChildren.length > 0) {
          setSavedChildren(localChildren);
          // Auto-load the first child
          const firstChild = localChildren[0];
          setSelectedAgeButton(rangeToDisplayButton(ageToRange(firstChild.age)));
          updateFormData({
            childName: firstChild.name,
            childGender: firstChild.gender as "male" | "female",
            ageRange: ageToRange(firstChild.age),
            childPhoto: firstChild.photo_url,
            childAvatarUrl: firstChild.avatar_url,
            personalityTraits: firstChild.personality_traits || "",
            fixedDetails: firstChild.fixed_details || "",
          });
          if (firstChild.personality_traits) {
            setShowPersonalityField(true);
          }
        }
      }
    };
    
    fetchChildren();
  }, [user]);

  // Handle age button selection
  const handleAgeButtonSelect = (buttonId: string) => {
    setSelectedAgeButton(buttonId);
    const ageButton = AGE_BUTTONS.find(b => b.id === buttonId);
    if (ageButton) {
      updateFormData({ ageRange: ageButton.range });
    }
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
        
        // If we have a temp child ID or selected child, upload and trigger avatar generation
        if (formData.childName.trim()) {
          // Store photo and open avatar preview dialog
          setPendingPhotoForAvatar(photoBase64);
          setAvatarPreviewOpen(true);
        }
        
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploadingPhoto(false);
    }
  };

  const handleAvatarConfirm = (avatarUrl: string) => {
    updateFormData({ childAvatarUrl: avatarUrl });
    setExistingAvatarForDialog(avatarUrl);
    setAvatarPreviewOpen(false);
    setPendingPhotoForAvatar(null);
  };

  const handleRegenerationCountChange = (count: number) => {
    setAvatarRegenerationCount(count);
    // Update in saved children if exists
    const currentChild = savedChildren.find(c => c.name === formData.childName);
    if (currentChild) {
      const updatedChildren = savedChildren.map(c => 
        c.name === formData.childName ? { ...c, avatar_regeneration_count: count } : c
      );
      setSavedChildren(updatedChildren);
      
      // Persist to localStorage for all users
      setUserData(user?.id, 'savedChildren', JSON.stringify(stripBase64ForStorage(updatedChildren)));
    }
  };

  const loadChildProfile = (child: SavedChild) => {
    setSelectedAgeButton(rangeToDisplayButton(ageToRange(child.age)));
    updateFormData({
      childName: child.name,
      childGender: child.gender as "male" | "female",
      ageRange: ageToRange(child.age),
      childPhoto: child.photo_url,
      childAvatarUrl: child.avatar_url,
      personalityTraits: child.personality_traits || "",
      fixedDetails: (child as any).fixed_details || "",
    });
    
    // Load avatar regeneration count
    setAvatarRegenerationCount(child.avatar_regeneration_count || 0);
    setExistingAvatarForDialog(child.avatar_url);
    
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
    const selectedAge = rangeToAge(formData.ageRange);

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
        };

        // Check if child already exists
        const existingChild = savedChildren.find(c => c.name === formData.childName);
        
        if (existingChild) {
          // Update existing child
          const { error } = await supabase
            .from("children")
            .update({
              age: selectedAge,
              gender: formData.childGender,
              photo_url: formData.childPhoto,
              avatar_url: formData.childAvatarUrl,
              personality_traits: formData.personalityTraits || null,
              fixed_details: formData.fixedDetails || null,
            })
            .eq("id", existingChild.id);

          if (error) {
            console.error('Supabase update error:', error);
            throw new Error(error.message);
          }
          
          // Update local state
          setSavedChildren(prev => prev.map(c => 
            c.id === existingChild.id 
              ? { ...c, age: selectedAge, gender: formData.childGender, photo_url: formData.childPhoto, avatar_url: formData.childAvatarUrl, personality_traits: formData.personalityTraits }
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
          }
        }
        
        toast.success("הפרטים נשמרו בהצלחה! 🎉");
      } else {
        // Save to localStorage for dev mode or non-logged users
        const savedChild = {
          id: `local-${Date.now()}`,
          name: formData.childName,
          age: selectedAge,
          gender: formData.childGender,
          photo_url: formData.childPhoto,
          avatar_url: formData.childAvatarUrl,
          personality_traits: formData.personalityTraits,
        };
        
        const existingChildren = JSON.parse(getUserData(user?.id, 'savedChildren') || '[]');
        const existingIndex = existingChildren.findIndex((c: SavedChild) => c.name === formData.childName);
        
        if (existingIndex >= 0) {
          existingChildren[existingIndex] = savedChild;
        } else {
          existingChildren.push(savedChild);
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
    const currentChild = savedChildren.find(c => c.name === formData.childName);
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
      updateFormData({
        childName: "",
        childGender: "male",
        ageRange: "2-4",
        storyLength: "short",
        childPhoto: null,
        childAvatarUrl: null,
        personalityTraits: "",
        className: "",
        fixedDetails: "",
      });
      setSelectedAgeButton("3-6");
      setExistingAvatarForDialog(null);
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
      {/* Title */}
      <div className="text-center space-y-1">
        <h1 className="text-lg font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">ספרו לנו על הילד/ה</h1>
        <p className="text-xs text-muted-foreground">בחרו פרופיל קיים או צרו חדש</p>
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              updateFormData({
                childName: "",
                childGender: "male",
                ageRange: "2-4",
                storyLength: "short",
                childPhoto: null,
                childAvatarUrl: null,
                personalityTraits: "",
                className: "",
                fixedDetails: "",
              });
              setSelectedAgeButton("3-6");
              setExistingAvatarForDialog(null);
              toast.success("הטופס נוקה - הזינו פרטי ילד/ה חדש/ה");
            }}
            className="text-sm font-bold text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <PlusCircle className="w-4 h-4 ml-1" />
            פרופיל חדש +
          </Button>
          {formData.childName && savedChildren.some(c => c.name === formData.childName) && (
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

      {/* Saved Children Quick Select */}
      {savedChildren.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex gap-1.5 flex-wrap">
            {savedChildren.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => loadChildProfile(child)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border-2 transition-all flex items-center gap-1.5 text-xs font-medium",
                  formData.childName === child.name
                    ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
                    : "border-border bg-card hover:border-purple-300"
                )}
              >
                <span>{child.gender === "female" ? "👧" : "👦"}</span>
                <span>{child.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* Age · Length · Language - Compact Row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Age */}
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-center block">גיל</Label>
          <div className="flex flex-col gap-1">
            {AGE_BUTTONS.filter(b => b.id !== "9-12").map((button) => (
              <button
                key={button.id}
                onClick={() => handleAgeButtonSelect(button.id)}
                className={cn(
                  "py-1.5 rounded-md border transition-all text-center text-sm font-bold",
                  selectedAgeButton === button.id
                    ? "border-purple-500 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white"
                    : "border-border bg-card hover:border-purple-300"
                )}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>

        {/* Story Length */}
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-center block flex items-center justify-center gap-1"><BookOpen className="w-3 h-3" />אורך</Label>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => updateFormData({ storyLength: "short" })}
              className={cn(
                "py-1.5 rounded-md border transition-all text-center text-sm font-bold",
                formData.storyLength === "short"
                  ? "border-purple-500 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white"
                  : "border-border bg-card hover:border-purple-300"
              )}
            >
              קצר · 4-5
            </button>
            <button
              onClick={() => updateFormData({ storyLength: "long" })}
              className={cn(
                "py-1.5 rounded-md border transition-all text-center text-sm font-bold",
                formData.storyLength === "long"
                  ? "border-purple-500 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white"
                  : "border-border bg-card hover:border-purple-300"
              )}
            >
              ארוך · 6-8
            </button>
            <button
              onClick={() => updateFormData({ storyLength: "extra-long" })}
              className={cn(
                "py-1.5 rounded-md border transition-all text-center text-[11px] font-bold",
                formData.storyLength === "extra-long"
                  ? "border-purple-500 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white"
                  : "border-border bg-card hover:border-purple-300"
              )}
            >
              ארוך במיוחד · 10-12
            </button>
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
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">תמונה של הילד/ה (אופציונלי)</Label>
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
            <div className="flex flex-col items-center justify-center w-full py-4 bg-card border-2 border-purple-400 bg-purple-50 rounded-xl gap-2">
              {formData.childAvatarUrl && formData.childPhoto ? (
                /* Side-by-side: original photo + avatar */
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(270,70%,60%))' }}>
                      <img
                        src={formData.childPhoto}
                        alt="תמונה מקורית"
                        className="w-full h-full object-cover opacity-90"
                      />
                      {/* Vignette overlay to soften edges */}
                      <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: 'inset 0 0 12px 4px rgba(168,85,247,0.25)' }} />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15 rounded-full pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">מקורית</span>
                  </div>
                  <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 animate-pulse" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                      <img
                        src={formData.childAvatarUrl}
                        alt="דמות בסיפור"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <span className="text-[10px] text-purple-600 font-medium">דמות בסיפור</span>
                  </div>
                </div>
              ) : (
                /* Single image: original photo only */
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(270,70%,60%))' }}>
                    <img
                      src={formData.childPhoto!}
                      alt="תמונת הילד"
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: 'inset 0 0 12px 4px rgba(168,85,247,0.25)' }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15 rounded-full pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">מקורית</span>
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
                {!formData.childAvatarUrl && formData.childPhoto && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPendingPhotoForAvatar(formData.childPhoto);
                      setAvatarPreviewOpen(true);
                    }}
                    className="text-sm text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    <Sparkles className="w-4 h-4 ml-1" />
                    צור אווטאר
                  </Button>
                )}
                {formData.childAvatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPendingPhotoForAvatar(formData.childPhoto);
                      setAvatarPreviewOpen(true);
                    }}
                    className="text-sm text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    <RefreshCw className="w-4 h-4 ml-1" />
                    עדכן אווטאר
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateFormData({ childPhoto: null, childAvatarUrl: null, photoConsent: false });
                    setExistingAvatarForDialog(null);
                    setPhotoValidation(null);
                  }}
                  className="text-sm text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  מחק
                </Button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center w-full bg-card border-2 border-dashed border-purple-200 rounded-xl cursor-pointer hover:border-purple-400 transition-colors p-4 gap-2.5"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-6 h-6 text-purple-400" />
                <span className="text-sm font-medium text-muted-foreground">העלו תמונה</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 w-full">
                {photoTips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-1 text-[10px]">
                    {tip.isGood ? (
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-3 h-3 text-destructive flex-shrink-0" />
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

        {/* Photo consent checkbox - only when photo is uploaded */}
        {formData.childPhoto && (
          <div className="flex items-start gap-2 mt-2">
            <Checkbox
              id="photo-consent"
              checked={formData.photoConsent || false}
              onCheckedChange={(c) => updateFormData({ photoConsent: c === true })}
              className="border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 h-4 w-4 mt-0.5"
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

      {/* Avatar Preview Dialog */}
      <AvatarPreviewDialog
        open={avatarPreviewOpen}
        onOpenChange={setAvatarPreviewOpen}
        originalPhoto={pendingPhotoForAvatar || ""}
        childId="temp-child"
        childName={formData.childName}
        existingAvatarUrl={existingAvatarForDialog}
        onConfirm={handleAvatarConfirm}
        skipStorage={true}
        regenerationCount={avatarRegenerationCount}
        onRegenerationCountChange={handleRegenerationCountChange}
      />
    </div>
  );
};

export default ChildInfoStep;
