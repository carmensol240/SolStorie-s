import { useRef, useEffect, useState } from "react";
import { User, Camera, Sparkles, RefreshCw, Trash2, Heart, ChevronDown, ChevronUp, Check, X, Loader2, Save, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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

// Helper to convert age number to age range
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
    case "2-4": return 3;
    case "5-7": return 6;
    case "8-10": return 9;
    default: return 3;
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
  
  // Slider age state (0-10)
  const [sliderAge, setSliderAge] = useState<number>(rangeToAge(formData.ageRange));

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
          setSliderAge(firstChild.age);
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
          setSliderAge(firstChild.age);
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

  // Update age range when slider changes
  const handleSliderChange = (value: number[]) => {
    const age = value[0];
    setSliderAge(age);
    updateFormData({ ageRange: ageToRange(age) });
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
    setSliderAge(child.age);
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

    try {
      // In dev mode or for non-logged users, always save to localStorage
      const isDevMode = isDevModeEnabled();
      const shouldUseLocalStorage = isDevMode || !user;

      if (!shouldUseLocalStorage && user) {
        // Use upsert for database persistence
        const childData = {
          user_id: user.id,
          name: formData.childName,
          age: sliderAge,
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
              age: sliderAge,
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
              ? { ...c, age: sliderAge, gender: formData.childGender, photo_url: formData.childPhoto, avatar_url: formData.childAvatarUrl, personality_traits: formData.personalityTraits }
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
          age: sliderAge,
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

  // Get age label for display
  const getAgeLabel = (age: number): string => {
    if (age === 0) return "0 - תינוק/ת";
    if (age === 1) return "שנה 1";
    return `${age} שנים`;
  };

  return (
    <div className="w-full space-y-5 px-0">
      {/* Title */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">ספרו לנו על הילד/ה</h1>
        <p className="text-sm text-muted-foreground">בחרו פרופיל קיים או צרו חדש</p>
      </div>

      {/* Saved Children Quick Select */}
      {savedChildren.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            בחרו פרופיל שמור
          </Label>
          <div className="flex gap-2 flex-wrap">
            {savedChildren.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => loadChildProfile(child)}
                className={cn(
                  "px-4 py-2.5 rounded-2xl border-2 transition-all flex items-center gap-2 text-sm font-medium",
                  formData.childName === child.name
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/50"
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
      <div className="space-y-2">
        <Label htmlFor="childName" className="text-sm font-medium">
          שם הילד/ה
        </Label>
        <Input
          id="childName"
          type="text"
          placeholder="לדוגמה: נועה"
          value={formData.childName}
          onChange={(e) => updateFormData({ childName: e.target.value })}
          className="h-12 text-base bg-card border-2 border-border rounded-2xl focus:border-primary px-4"
          dir="rtl"
        />
      </div>

      {/* Gender Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">מגדר</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateFormData({ childGender: "male" })}
            className={cn(
              "p-3.5 rounded-2xl border-2 transition-all text-center flex items-center justify-center gap-2",
              formData.childGender === "male"
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <span className="text-2xl">👦</span>
            <span className="text-base font-bold">בן</span>
          </button>
          <button
            onClick={() => updateFormData({ childGender: "female" })}
            className={cn(
              "p-3.5 rounded-2xl border-2 transition-all text-center flex items-center justify-center gap-2",
              formData.childGender === "female"
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <span className="text-2xl">👧</span>
            <span className="text-base font-bold">בת</span>
          </button>
        </div>
      </div>

      {/* Age Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">גיל</Label>
          <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {getAgeLabel(sliderAge)}
          </span>
        </div>
        <div className="px-1">
          <Slider
            value={[sliderAge]}
            onValueChange={handleSliderChange}
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
            <span>0</span>
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
            <span>10</span>
          </div>
        </div>
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">תמונה של הילד/ה (אופציונלי)</Label>
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
            <div className="flex flex-col items-center justify-center w-full h-24 bg-card border-2 border-primary bg-primary/5 rounded-2xl">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" />
              <span className="text-xs text-muted-foreground">מעלה תמונה...</span>
            </div>
          ) : formData.childPhoto ? (
            <div className="flex flex-col items-center justify-center w-full h-24 bg-card border-2 border-primary bg-primary/5 rounded-2xl py-2">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-primary">
                <img
                  src={formData.childAvatarUrl || formData.childPhoto}
                  alt="תמונת הילד"
                  className="w-full h-full object-cover"
                />
                {formData.childAvatarUrl && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
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
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>צור דמות</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>החלף</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateFormData({ childPhoto: null, childAvatarUrl: null })}
                  className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>מחק</span>
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center w-full h-24 bg-card border-2 border-dashed border-border hover:border-primary/50 rounded-2xl cursor-pointer transition-colors"
            >
              <Camera className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">העלו תמונה</span>
            </label>
          )}
        </div>
        
        {/* Photo Tips Toggle */}
        <button
          type="button"
          onClick={() => setShowPhotoTips(!showPhotoTips)}
          className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          {showPhotoTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          איך לבחור את התמונה הטובה ביותר?
        </button>

        {/* Photo Tips Card */}
        {showPhotoTips && (
          <div className="bg-accent/50 rounded-2xl p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <h3 className="font-bold text-sm text-foreground">איך לבחור את התמונה הטובה ביותר?</h3>
            <div className="space-y-1.5">
              {photoTips.map((tip, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl border",
                    tip.isGood
                      ? "bg-green-50 border-green-300"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  <span className={cn("text-xs", tip.isGood ? "text-green-700" : "text-red-700")}>
                    {tip.text}
                  </span>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      tip.isGood ? "bg-green-500" : "bg-red-400"
                    )}
                  >
                    {tip.isGood ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Personality Traits */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowPersonalityField(!showPersonalityField)}
          className="w-full flex items-center justify-between bg-card rounded-2xl p-4 border-2 border-border hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-pink-500" />
            <div className="text-right">
              <p className="font-medium text-sm">ספרו לנו עוד על הילד/ה</p>
              <p className="text-xs text-muted-foreground">תכונות אופי, תחביבים ופרטים חשובים</p>
            </div>
          </div>
          {showPersonalityField ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        {showPersonalityField && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-muted-foreground px-1">
              כתבו כמה שיותר פרטים כדי שהסיפור יהיה מושלם ✨
            </p>
            <Textarea
              placeholder="לדוגמה: אוהבת דינוזאורים, ביישנית קצת, יש לה כלב בשם לילי, מתחילה בגן החודש..."
              value={formData.personalityTraits}
              onChange={(e) => updateFormData({ personalityTraits: e.target.value })}
              className="min-h-[80px] resize-none bg-card border-2 border-border rounded-2xl focus:border-primary text-sm"
              dir="rtl"
            />
          </div>
        )}
      </div>

      {/* Save Child Profile Button */}
      {formData.childName.trim() && (
        <div className="space-y-3 pt-1">
          <Button
            type="button"
            onClick={handleSaveChildProfile}
            disabled={isSavingChild}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 rounded-2xl shadow-md transition-all"
          >
            {isSavingChild ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 ml-2" />
                שמור פרטים לסיפורים הבאים
              </>
            )}
          </Button>
        </div>
      )}

      {/* Privacy Notice - Always visible at bottom */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/30 rounded-2xl p-3 border border-border">
        <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p>
          פרטי הילד/ה נשמרים בצורה מאובטחת ופרטית בהתאם לתקנות הפרטיות.
        </p>
      </div>

      {/* Avatar Preview Dialog - Always mounted, controlled by open prop to prevent hydration issues */}
      <AvatarPreviewDialog
        open={avatarPreviewOpen && !!pendingPhotoForAvatar}
        onOpenChange={(open) => {
          setAvatarPreviewOpen(open);
          if (!open) {
            // Delay clearing photo to prevent flicker during close animation
            setTimeout(() => setPendingPhotoForAvatar(null), 150);
          }
        }}
        originalPhoto={pendingPhotoForAvatar || ''}
        childId={tempChildId || 'temp-child'}
        childName={formData.childName || 'הילד/ה'}
        onConfirm={handleAvatarConfirm}
        skipStorage={true}
        regenerationCount={avatarRegenerationCount}
        onRegenerationCountChange={handleRegenerationCountChange}
        existingAvatarUrl={existingAvatarForDialog}
      />
    </div>
  );
};

export default ChildInfoStep;
