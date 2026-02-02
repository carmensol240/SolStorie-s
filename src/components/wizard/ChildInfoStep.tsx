import { useRef, useEffect, useState } from "react";
import { User, Camera, Sparkles, RefreshCw, Trash2, Heart, ChevronDown, ChevronUp, Check, X, Loader2, Save, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { StoryFormData } from "@/pages/CreateStory";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
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

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("children")
        .select("id, name, age, gender, photo_url, avatar_url, personality_traits")
        .eq("user_id", user.id);
      
      if (!error && data) {
        setSavedChildren(data);
      }
    };
    
    fetchChildren();
  }, [user]);

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
    setAvatarPreviewOpen(false);
    setPendingPhotoForAvatar(null);
  };

  const loadChildProfile = (child: SavedChild) => {
    const ageToRange = (age: number): "0-2" | "2-4" | "5-7" | "8-10" => {
      if (age <= 2) return "0-2";
      if (age <= 4) return "2-4";
      if (age <= 7) return "5-7";
      return "8-10";
    };

    updateFormData({
      childName: child.name,
      childGender: child.gender as "male" | "female",
      ageRange: ageToRange(child.age),
      childPhoto: child.photo_url,
      childAvatarUrl: child.avatar_url,
      personalityTraits: child.personality_traits || "",
    });
    
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
      // Convert age range to number
      const ageFromRange = (range: string): number => {
        switch (range) {
          case "0-2": return 1;
          case "2-4": return 3;
          case "5-7": return 6;
          case "8-10": return 9;
          default: return 3;
        }
      };

      // Check if we have a user for database save
      if (user) {
        // Check if child already exists
        const existingChild = savedChildren.find(c => c.name === formData.childName);
        
        if (existingChild) {
          // Update existing child
          const { error } = await supabase
            .from("children")
            .update({
              age: ageFromRange(formData.ageRange),
              gender: formData.childGender,
              photo_url: formData.childPhoto,
              avatar_url: formData.childAvatarUrl,
              personality_traits: formData.personalityTraits || null,
            })
            .eq("id", existingChild.id);

          if (error) throw error;
          
          // Update local state
          setSavedChildren(prev => prev.map(c => 
            c.id === existingChild.id 
              ? { ...c, age: ageFromRange(formData.ageRange), gender: formData.childGender, photo_url: formData.childPhoto, avatar_url: formData.childAvatarUrl, personality_traits: formData.personalityTraits }
              : c
          ));
        } else {
          // Create new child
          const { data, error } = await supabase
            .from("children")
            .insert({
              user_id: user.id,
              name: formData.childName,
              age: ageFromRange(formData.ageRange),
              gender: formData.childGender,
              photo_url: formData.childPhoto,
              avatar_url: formData.childAvatarUrl,
              personality_traits: formData.personalityTraits || null,
            })
            .select()
            .single();

          if (error) throw error;
          
          // Add to local state
          if (data) {
            setSavedChildren(prev => [...prev, data]);
          }
        }
        
        toast.success("הפרטים נשמרו בהצלחה! 🎉");
      } else {
        // Save to localStorage for non-logged users
        const savedChild = {
          id: `local-${Date.now()}`,
          name: formData.childName,
          age: ageFromRange(formData.ageRange),
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
      toast.error("שגיאה בשמירת הפרטים, נסו שוב");
    } finally {
      setIsSavingChild(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">ספרו לנו על הילד/ה</h1>
        <p className="text-muted-foreground">בחרו פרופיל קיים או צרו חדש</p>
      </div>

      {/* Saved Children Quick Select */}
      {savedChildren.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <User className="w-4 h-4 text-purple-500" />
            בחרו פרופיל שמור
          </Label>
          <div className="flex gap-2 flex-wrap">
            {savedChildren.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => loadChildProfile(child)}
                className={cn(
                  "px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2",
                  formData.childName === child.name
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 bg-white hover:border-purple-300"
                )}
              >
                <span>{child.gender === "female" ? "👧" : "👦"}</span>
                <span className="font-medium">{child.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Child Name */}
      <div className="space-y-2">
        <Label htmlFor="childName" className="text-base font-medium">
          שם הילד/ה
        </Label>
        <Input
          id="childName"
          type="text"
          placeholder="לדוגמה: נועה"
          value={formData.childName}
          onChange={(e) => updateFormData({ childName: e.target.value })}
          className="h-12 text-lg bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500"
          dir="rtl"
        />
      </div>

      {/* Gender Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">מגדר</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateFormData({ childGender: "male" })}
            className={cn(
              "p-4 rounded-xl border-2 transition-all text-center flex items-center justify-center gap-2",
              formData.childGender === "male"
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 bg-white hover:border-purple-300"
            )}
          >
            <span className="text-2xl">👦</span>
            <span className="text-lg font-bold">בן</span>
          </button>
          <button
            onClick={() => updateFormData({ childGender: "female" })}
            className={cn(
              "p-4 rounded-xl border-2 transition-all text-center flex items-center justify-center gap-2",
              formData.childGender === "female"
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 bg-white hover:border-purple-300"
            )}
          >
            <span className="text-2xl">👧</span>
            <span className="text-lg font-bold">בת</span>
          </button>
        </div>
      </div>

      {/* Age Range */}
      <div className="space-y-3">
        <Label className="text-base font-medium">טווח גיל</Label>
        <div className="grid grid-cols-2 gap-3">
          <AgeButton
            label="0-2"
            description="סיפורים ראשונים"
            isSelected={formData.ageRange === "0-2"}
            onClick={() => updateFormData({ ageRange: "0-2" })}
          />
          <AgeButton
            label="2-4"
            description="משפטים קצרים ופשוטים"
            isSelected={formData.ageRange === "2-4"}
            onClick={() => updateFormData({ ageRange: "2-4" })}
          />
          <AgeButton
            label="5-7"
            description="אוצר מילים עשיר יותר"
            isSelected={formData.ageRange === "5-7"}
            onClick={() => updateFormData({ ageRange: "5-7" })}
          />
          <AgeButton
            label="8-10"
            description="סיפורים מורכבים יותר"
            isSelected={formData.ageRange === "8-10"}
            onClick={() => updateFormData({ ageRange: "8-10" })}
          />
        </div>
      </div>

      {/* Photo Upload */}
      <div className="space-y-3">
        <Label className="text-base font-medium">תמונה של הילד/ה (אופציונלי)</Label>
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
            <div className="flex flex-col items-center justify-center w-full h-24 bg-white border-2 border-purple-500 bg-purple-50 rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500 mb-1" />
              <span className="text-xs text-muted-foreground">מעלה תמונה...</span>
            </div>
          ) : formData.childPhoto ? (
            <div className="flex flex-col items-center justify-center w-full h-24 bg-white border-2 border-purple-500 bg-purple-50 rounded-xl py-2">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-purple-500">
                <img
                  src={formData.childAvatarUrl || formData.childPhoto}
                  alt="תמונת הילד"
                  className="w-full h-full object-cover"
                />
                {formData.childAvatarUrl && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
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
                    className="flex items-center gap-1 text-xs text-primary hover:text-purple-600 transition-colors font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>צור דמות</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-purple-500 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>החלף</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateFormData({ childPhoto: null, childAvatarUrl: null })}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>מחק</span>
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center w-full h-24 bg-white border border-dashed border-gray-300 hover:border-purple-400 rounded-xl cursor-pointer transition-colors"
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
          className="text-sm text-purple-500 hover:text-purple-600 transition-colors flex items-center gap-1"
        >
          {showPhotoTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          איך לבחור את התמונה הטובה ביותר?
        </button>

        {/* Photo Tips Card */}
        {showPhotoTips && (
          <div className="bg-sky-50 rounded-2xl p-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <h3 className="font-bold text-lg text-foreground">איך לבחור את התמונה הטובה ביותר?</h3>
            <div className="space-y-2">
              {photoTips.map((tip, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-full border-2",
                    tip.isGood
                      ? "bg-green-50 border-green-500"
                      : "bg-red-50 border-red-300"
                  )}
                >
                  <span className={tip.isGood ? "text-green-700" : "text-red-700"}>
                    {tip.text}
                  </span>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      tip.isGood ? "bg-green-500" : "bg-red-500"
                    )}
                  >
                    {tip.isGood ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <X className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Personality Traits */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowPersonalityField(!showPersonalityField)}
          className="w-full flex items-center justify-between bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-purple-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-pink-500" />
            <div className="text-right">
              <p className="font-medium">ספרו לנו עוד על הילד/ה</p>
              <p className="text-xs text-muted-foreground">תכונות אופי, תחביבים ופרטים חשובים</p>
            </div>
          </div>
          {showPersonalityField ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        
        {showPersonalityField && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <p className="text-sm text-muted-foreground px-1">
              כתבו כמה שיותר פרטים כדי שהסיפור יהיה מושלם ✨
            </p>
            <Textarea
              placeholder="לדוגמה: אוהבת דינוזאורים, ביישנית קצת, יש לה כלב בשם לילי, מתחילה בגן החודש..."
              value={formData.personalityTraits}
              onChange={(e) => updateFormData({ personalityTraits: e.target.value })}
              className="min-h-[100px] resize-none bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500"
              dir="rtl"
            />
          </div>
        )}
      </div>

      {/* Save Child Profile Button */}
      {formData.childName.trim() && (
        <div className="space-y-2 pt-2">
          <Button
            type="button"
            onClick={handleSaveChildProfile}
            disabled={isSavingChild}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all"
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
          
          {/* Privacy Notice */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 rounded-lg p-3">
            <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p>
              המידע נשמר באופן מאובטח ומשמש אך ורק להתאמת הסיפורים אישית עבור ילדכם. 
              אנו מקפידים על הגנת פרטיות בהתאם לתקנות.
            </p>
          </div>
        </div>
      )}

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
      />
    </div>
  );
};

interface AgeButtonProps {
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

const AgeButton = ({ label, description, isSelected, onClick }: AgeButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "p-4 rounded-xl border-2 transition-all text-center",
      isSelected
        ? "border-purple-500 bg-purple-50"
        : "border-gray-200 bg-white hover:border-purple-300"
    )}
  >
    <span className="text-2xl font-bold block">{label}</span>
    <span className="text-xs text-muted-foreground">{description}</span>
  </button>
);

export default ChildInfoStep;
