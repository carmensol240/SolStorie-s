import { useRef, useEffect, useState } from "react";
import { User, Camera, Sparkles, RefreshCw, Trash2, Heart, ChevronDown, ChevronUp, Check, X, Loader2, Save, Shield } from "lucide-react";
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
  { text: "פורטרט עם חיוך", isGood: true },
  { text: "מבט הצידה", isGood: false },
  { text: "פנים מוסתרות", isGood: false },
  { text: "תמונה בעדשה רחבה", isGood: false },
  { text: "פנים מוסתרות בסינון", isGood: false },
  { text: "יותר מילד אחד", isGood: false },
];

// Age range buttons configuration
const AGE_BUTTONS = [
  { id: "0-2", label: "0-2", range: "0-2" as const },
  { id: "3-6", label: "3-6", range: "2-4" as const }, // Maps to internal 2-4 range
  { id: "7-8", label: "7-8", range: "5-7" as const }, // Maps to internal 5-7 range
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
    case "5-7": 
    case "8-10": return "7-8";
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
  const [existingAvatarForDialog, setExistingAvatarForDialog] = useState<string | null>(null);
  
  // Selected age button
  const [selectedAgeButton, setSelectedAgeButton] = useState<string>(rangeToDisplayButton(formData.ageRange));

  // Load saved children and auto-populate form on mount
  useEffect(() => {
    const fetchChildren = async () => {
      if (user) {
        // Fetch from database for authenticated users
        const { data, error } = await supabase
          .from("children")
          .select("id, name, age, gender, photo_url, avatar_url, personality_traits")
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
          });
          if (firstChild.personality_traits) {
            setShowPersonalityField(true);
          }
        } else if (!error && data) {
          setSavedChildren(data);
        }
      } else {
        // Load from localStorage for guest/dev mode users
        const localChildren = JSON.parse(localStorage.getItem('savedChildren') || '[]');
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
    if (!file || !user) return;
    
    setIsUploadingPhoto(true);
    
    try {
      // First read as data URL for preview
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoBase64 = reader.result as string;
        updateFormData({ childPhoto: photoBase64 });
        
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
      localStorage.setItem('savedChildren', JSON.stringify(updatedChildren));
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
        
        const existingChildren = JSON.parse(localStorage.getItem('savedChildren') || '[]');
        const existingIndex = existingChildren.findIndex((c: SavedChild) => c.name === formData.childName);
        
        if (existingIndex >= 0) {
          existingChildren[existingIndex] = savedChild;
        } else {
          existingChildren.push(savedChild);
        }
        
        localStorage.setItem('savedChildren', JSON.stringify(existingChildren));
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

  return (
    <div className="w-full space-y-3 px-1 overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Title */}
      <div className="text-center space-y-0.5">
        <h1 className="text-lg font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">ספרו לנו על הילד/ה</h1>
        <p className="text-xs text-muted-foreground">בחרו פרופיל קיים או צרו חדש</p>
      </div>

      {/* Saved Children Quick Select */}
      {savedChildren.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-500" />
            בחרו פרופיל שמור
          </Label>
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

      {/* Child Name */}
      <div className="space-y-1">
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

      {/* Gender Selection */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">מגדר</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateFormData({ childGender: "male" })}
            className={cn(
              "p-2 rounded-lg border-2 transition-all text-center flex items-center justify-center gap-1.5",
              formData.childGender === "male"
                ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100"
                : "border-border bg-card hover:border-purple-300"
            )}
          >
            <span className="text-lg">🦸‍♂️</span>
            <span className="text-xs font-bold">גיבור</span>
          </button>
          <button
            onClick={() => updateFormData({ childGender: "female" })}
            className={cn(
              "p-2 rounded-lg border-2 transition-all text-center flex items-center justify-center gap-1.5",
              formData.childGender === "female"
                ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100"
                : "border-border bg-card hover:border-purple-300"
            )}
          >
            <span className="text-lg">🦸‍♀️</span>
            <span className="text-xs font-bold">גיבורה</span>
          </button>
        </div>
      </div>

      {/* Age Selection - 3 Distinct Buttons */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">גיל</Label>
        <div className="grid grid-cols-3 gap-2">
          {AGE_BUTTONS.map((button) => (
            <button
              key={button.id}
              onClick={() => handleAgeButtonSelect(button.id)}
              className={cn(
                "p-2 rounded-lg border-2 transition-all text-center",
                selectedAgeButton === button.id
                  ? "border-purple-500 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-bold"
                  : "border-border bg-card hover:border-purple-300"
              )}
            >
              <span className="text-base font-bold">{button.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Length Selection */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">אורך הסיפור</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateFormData({ storyLength: "short" })}
            className={cn(
              "p-2 rounded-lg border-2 transition-all text-center flex flex-col items-center justify-center gap-0.5",
              formData.storyLength === "short"
                ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100"
                : "border-border bg-card hover:border-purple-300"
            )}
          >
            <span className="text-lg">📖</span>
            <span className="text-xs font-bold">קצר</span>
            <span className="text-[10px] text-muted-foreground">4-5 עמודים</span>
          </button>
          <button
            onClick={() => updateFormData({ storyLength: "long" })}
            className={cn(
              "p-2 rounded-lg border-2 transition-all text-center flex flex-col items-center justify-center gap-0.5",
              formData.storyLength === "long"
                ? "border-purple-500 bg-gradient-to-r from-purple-100 to-pink-100"
                : "border-border bg-card hover:border-purple-300"
            )}
          >
            <span className="text-lg">📚</span>
            <span className="text-xs font-bold">ארוך</span>
            <span className="text-[10px] text-muted-foreground">6-8 עמודים</span>
          </button>
        </div>
      </div>

      {/* Photo Upload */}
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
            <div className="flex flex-col items-center justify-center w-full h-20 bg-card border-2 border-purple-400 bg-purple-50 rounded-xl">
              <Loader2 className="w-5 h-5 animate-spin text-purple-500 mb-1" />
              <span className="text-xs text-muted-foreground">מעלה תמונה...</span>
            </div>
          ) : formData.childPhoto ? (
            <div className="flex flex-col items-center justify-center w-full h-20 bg-card border-2 border-purple-400 bg-purple-50 rounded-xl py-1.5">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400">
                <img
                  src={formData.childAvatarUrl || formData.childPhoto}
                  alt="תמונת הילד"
                  className="w-full h-full object-cover"
                />
                {formData.childAvatarUrl && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-1">
                {!formData.childAvatarUrl && formData.childPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPhotoForAvatar(formData.childPhoto);
                      setAvatarPreviewOpen(true);
                    }}
                    className="text-[10px] text-purple-600 underline"
                  >
                    צור אווטאר
                  </button>
                )}
                {formData.childAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPhotoForAvatar(formData.childPhoto);
                      setAvatarPreviewOpen(true);
                    }}
                    className="text-[10px] text-purple-600 flex items-center gap-0.5"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    עדכן אווטאר
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    updateFormData({ childPhoto: null, childAvatarUrl: null });
                    setExistingAvatarForDialog(null);
                  }}
                  className="text-[10px] text-destructive flex items-center gap-0.5"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  מחק
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center w-full h-20 bg-card border-2 border-dashed border-purple-200 rounded-xl cursor-pointer hover:border-purple-400 transition-colors"
            >
              <Camera className="w-5 h-5 text-purple-400 mb-0.5" />
              <span className="text-xs text-muted-foreground">העלו תמונה</span>
            </label>
          )}
        </div>
        
        {/* Photo tips toggle */}
        <button
          type="button"
          onClick={() => setShowPhotoTips(!showPhotoTips)}
          className="text-[10px] text-muted-foreground flex items-center gap-0.5 hover:text-purple-500 transition-colors"
        >
          {showPhotoTips ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          טיפים לתמונה מושלמת
        </button>
        
        {showPhotoTips && (
          <div className="grid grid-cols-2 gap-1.5 p-2 bg-purple-50 rounded-lg">
            {photoTips.map((tip, index) => (
              <div key={index} className="flex items-center gap-1.5 text-[10px]">
                {tip.isGood ? (
                  <Check className="w-2.5 h-2.5 text-green-500" />
                ) : (
                  <X className="w-2.5 h-2.5 text-destructive" />
                )}
                <span className={tip.isGood ? "text-foreground" : "text-muted-foreground"}>
                  {tip.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personality Traits (optional) */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setShowPersonalityField(!showPersonalityField)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-purple-500 transition-colors"
        >
          <Heart className="w-3.5 h-3.5" />
          <span>הוסיפו תכונות אופי (אופציונלי)</span>
          {showPersonalityField ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
        </button>
        
        {showPersonalityField && (
          <Textarea
            placeholder="למשל: אוהב/ת חיות, סקרן/ית, אוהב/ת לשחק כדורגל..."
            value={formData.personalityTraits}
            onChange={(e) => updateFormData({ personalityTraits: e.target.value })}
            className="min-h-14 text-xs bg-card border-2 border-purple-200 rounded-lg resize-none focus:border-purple-400"
            dir="rtl"
          />
        )}
      </div>

      {/* Save Button - Light purple theme matching saved profiles */}
      <Button
        type="button"
        onClick={handleSaveChildProfile}
        disabled={isSavingChild || !formData.childName.trim()}
        className="w-full h-10 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 font-bold text-xs rounded-lg border-2 border-purple-300 shadow-sm hover:shadow-md transition-all"
      >
        {isSavingChild ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin ml-1.5" />
        ) : (
          <Save className="w-3.5 h-3.5 ml-1.5" />
        )}
        שמור פרטים לסיפורים הבאים
      </Button>

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
