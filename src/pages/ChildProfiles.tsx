import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Camera, Pencil, Trash2, RefreshCw, Heart, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import MobileNavigation from "@/components/MobileNavigation";
import AvatarPreviewDialog from "@/components/story/AvatarPreviewDialog";
import { getUserData, setUserData } from "@/lib/user-storage";
import { stripBase64ForStorage } from "@/lib/strip-base64";

/** Check if a string is a Supabase Storage path (not a URL or base64) */
const isStoragePath = (url: string | null): boolean => {
  if (!url) return false;
  return !url.startsWith('data:') && !url.startsWith('http') && !url.startsWith('blob:');
};

/** Fetch a signed URL for a private storage path */
const getSignedUrl = async (path: string): Promise<string> => {
  const { data } = await supabase.storage
    .from('child-photos')
    .createSignedUrl(path, 3600);
  return data?.signedUrl || path;
};

interface Child {
  id: string;
  name: string;
  age: number;
  gender: string;
  photo_url: string | null;
  avatar_url: string | null;
  personality_traits: string | null;
}

const ChildProfiles = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildAge, setNewChildAge] = useState<string>("");
  const [newChildGender, setNewChildGender] = useState<"male" | "female">("male");
  const [newChildTraits, setNewChildTraits] = useState("");
  const [newChildPhoto, setNewChildPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editGender, setEditGender] = useState<"male" | "female">("male");
  const [editTraits, setEditTraits] = useState("");
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editPhotoRemoved, setEditPhotoRemoved] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Avatar preview states
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [pendingAvatarChild, setPendingAvatarChild] = useState<{id: string, name: string, photoUrl: string, storagePath: string} | null>(null);
  // Cache signed URLs for display
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;
      
      setLoading(true);
      
      // First, always load from localStorage (for dev mode/guests and offline access)
      const localChildren = loadLocalChildren();
      
      // For authenticated users with valid UUID, also fetch from database
      const isValidUser = user?.id && user.id !== '00000000-0000-0000-0000-000000000000';
      
      if (isValidUser) {
        try {
          const { data, error } = await supabase
            .from("children")
            .select("id, name, age, gender, photo_url, avatar_url, personality_traits")
            .order("created_at", { ascending: true });

          if (!error && data && data.length > 0) {
            setChildren(data);
            setUserData(user?.id, 'savedChildren', JSON.stringify(stripBase64ForStorage(data)));
            // Pre-fetch signed URLs for private storage paths
            const urls: Record<string, string> = {};
            for (const child of data) {
              if (child.photo_url && isStoragePath(child.photo_url)) {
                urls[child.photo_url] = await getSignedUrl(child.photo_url);
              }
              if (child.avatar_url && isStoragePath(child.avatar_url)) {
                urls[child.avatar_url] = await getSignedUrl(child.avatar_url);
              }
            }
            setSignedUrls(prev => ({ ...prev, ...urls }));
          } else if (!error && data && data.length === 0) {
            // User has no children in DB, use localStorage if available
            if (localChildren.length > 0) {
              setChildren(localChildren);
            }
          }
        } catch (error) {
          console.error("Error fetching children from DB:", error);
          // Keep localStorage data on error
        }
      } else {
        // For guests/dev mode, use localStorage data
        if (localChildren.length > 0) {
          setChildren(localChildren);
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [user, authLoading]);

  const loadLocalChildren = (): Child[] => {
    try {
      const localChildren = JSON.parse(getUserData(user?.id, 'savedChildren') || '[]');
      if (localChildren.length > 0) {
        // Convert localStorage format to Child format
        const converted: Child[] = localChildren.map((c: any, index: number) => ({
          id: c.id || `local-${index}`,
          name: c.name || 'ילד',
          age: c.age || 3,
          gender: c.gender || 'male',
          photo_url: c.photo_url || null,
          avatar_url: c.avatar_url || null,
          personality_traits: c.personality_traits || null,
        }));
        return converted;
      }
    } catch (error) {
      console.error('Error loading local children:', error);
    }
    return [];
  };

  const refetchChildren = async () => {
    const isValidUser = user?.id && user.id !== '00000000-0000-0000-0000-000000000000';
    
    if (isValidUser) {
      try {
        const { data, error } = await supabase
          .from("children")
          .select("id, name, age, gender, photo_url, avatar_url, personality_traits")
          .order("created_at", { ascending: true });

        if (!error && data) {
          setChildren(data);
          setUserData(user?.id, 'savedChildren', JSON.stringify(stripBase64ForStorage(data)));
          // Refresh signed URLs
          const urls: Record<string, string> = {};
          for (const child of data) {
            if (child.photo_url && isStoragePath(child.photo_url)) {
              urls[child.photo_url] = await getSignedUrl(child.photo_url);
            }
            if (child.avatar_url && isStoragePath(child.avatar_url)) {
              urls[child.avatar_url] = await getSignedUrl(child.avatar_url);
            }
          }
          setSignedUrls(prev => ({ ...prev, ...urls }));
        }
      } catch (error) {
        console.error("Error fetching children:", error);
      }
    } else {
      // For guests, reload from localStorage
      const localChildren = loadLocalChildren();
      setChildren(localChildren);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewChildPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (childId: string): Promise<string | null> => {
    if (!newChildPhoto || !user) return null;
    
    const fileExt = newChildPhoto.name.split('.').pop();
    const timestamp = Date.now();
    // Use unique timestamp to preserve history in storage
    const fileName = `${user.id}/${childId}-${timestamp}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('child-photos')
      .upload(fileName, newChildPhoto, { upsert: false });
      
    if (error) throw error;
    
    return fileName;
  };

  const handleAddChild = async () => {
    // Validate required fields first
    if (!newChildName.trim() || !newChildAge) {
      toast({
        title: "שגיאה",
        description: "נא למלא את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Check if user is authenticated with valid UUID
      const isValidUser = user?.id && user.id !== '00000000-0000-0000-0000-000000000000';

      if (isValidUser) {
        // Save to database for authenticated users
        const insertData = {
          user_id: user.id,
          name: newChildName.trim(),
          age: parseInt(newChildAge, 10),
          gender: newChildGender || 'male',
          personality_traits: newChildTraits?.trim() || null,
        };
        
        console.log('Inserting child to DB:', JSON.stringify(insertData, null, 2));
        
        const { data: insertedChild, error } = await supabase
          .from("children")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Database insert error:', JSON.stringify(error, null, 2));
          throw error;
        }

        // Upload photo if selected
        if (newChildPhoto && insertedChild) {
          const photoUrl = await uploadPhoto(insertedChild.id);
          if (photoUrl) {
            await supabase.from("children").update({ photo_url: photoUrl }).eq("id", insertedChild.id);
            
            // Open avatar preview dialog
            setPendingAvatarChild({
              id: insertedChild.id,
              name: newChildName.trim(),
              photoUrl: photoUrl.startsWith('data:') ? photoUrl : (await getSignedUrl(photoUrl)),
              storagePath: photoUrl,
            });
            setAvatarPreviewOpen(true);
          }
        }
      } else {
        // Save to localStorage for guests/dev mode
        console.log('Saving child to localStorage (guest/dev mode)');
        
        const localChildren = JSON.parse(getUserData(user?.id, 'savedChildren') || '[]');
        const newChild = {
          id: `local-${Date.now()}`,
          name: newChildName.trim(),
          age: parseInt(newChildAge, 10),
          gender: newChildGender || 'male',
          personality_traits: newChildTraits?.trim() || null,
          photo_url: photoPreview, // Use base64 preview for guests
          avatar_url: null,
        };
        
        localChildren.push(newChild);
        setUserData(user?.id, 'savedChildren', JSON.stringify(stripBase64ForStorage(localChildren)));
        
        // Add to local state
        setChildren(prev => [...prev, newChild as Child]);
      }

      toast({
        title: "נוסף בהצלחה!",
        description: `${newChildName} נוסף לרשימת הילדים`,
      });

      setNewChildName("");
      setNewChildAge("");
      setNewChildGender("male");
      setNewChildTraits("");
      setNewChildPhoto(null);
      setPhotoPreview(null);
      setDialogOpen(false);
      
      // Only fetch from DB if authenticated
      if (isValidUser) {
        refetchChildren();
      }
    } catch (error) {
      console.error("Error adding child:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו להוסיף את הילד",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectChild = (childId: string) => {
    setUserData(user?.id, 'selected_child_id', childId);
    navigate("/library");
  };

  const handleEditChild = (child: Child, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChild(child);
    setEditName(child.name);
    setEditAge(String(child.age));
    setEditGender(child.gender as "male" | "female");
    setEditTraits(child.personality_traits || "");
    setEditPhoto(null);
    setEditPhotoPreview(
      child.photo_url && isStoragePath(child.photo_url) 
        ? (signedUrls[child.photo_url] || child.photo_url) 
        : child.photo_url
    );
    setEditPhotoRemoved(false);
    setEditDialogOpen(true);
  };

  const handleEditPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPhoto(file);
      setEditPhotoRemoved(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const deletePhotoFromStorage = async (photoUrl: string) => {
    try {
      // Only attempt deletion for actual storage paths (not data: URLs, http URLs, blobs)
      if (!isStoragePath(photoUrl)) return;
      await supabase.storage.from('child-photos').remove([photoUrl]);
    } catch (error) {
      console.error("Error deleting photo from storage:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingChild || !editName.trim() || !editAge) return;

    setSaving(true);
    try {
      let photoUrl = editingChild.photo_url;

      // Handle photo removal (don't delete from storage - keep history)
      if (editPhotoRemoved && editingChild.photo_url) {
        photoUrl = null;
      }

      if (editPhoto && user) {
        // Delete the previous photo from storage to avoid accumulating old files.
        // The active photo lives at children.photo_url; only that single file is preserved.
        if (editingChild.photo_url && isStoragePath(editingChild.photo_url)) {
          await deletePhotoFromStorage(editingChild.photo_url);
        }

        // Upload new photo with unique timestamp to avoid overwriting
        const fileExt = editPhoto.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${user.id}/${editingChild.id}-${timestamp}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('child-photos')
          .upload(fileName, editPhoto, { upsert: false });
          
        if (uploadError) throw uploadError;
        
        photoUrl = fileName;
      }

      console.log('handleSaveEdit updating children table:', { childId: editingChild.id, photoUrl, editName: editName.trim() });
      const { error } = await supabase
        .from("children")
        .update({
          name: editName.trim(),
          age: parseInt(editAge),
          gender: editGender,
          photo_url: photoUrl,
          personality_traits: editTraits.trim() || null,
        })
        .eq("id", editingChild.id);

      if (error) throw error;

      toast({
        title: "עודכן בהצלחה!",
        description: `הפרטים של ${editName} עודכנו`,
      });

      setEditDialogOpen(false);
      refetchChildren();
    } catch (error) {
      console.error("Error updating child:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לעדכן את הפרטים",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChild = (child: Child, e: React.MouseEvent) => {
    e.stopPropagation();
    setChildToDelete(child);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!childToDelete) return;

    setDeleting(true);
    try {
      // Delete photo AND avatar from storage so we don't leave orphaned files
      const filesToRemove: string[] = [];
      if (childToDelete.photo_url && isStoragePath(childToDelete.photo_url)) {
        filesToRemove.push(childToDelete.photo_url);
      }
      if (childToDelete.avatar_url && isStoragePath(childToDelete.avatar_url)) {
        filesToRemove.push(childToDelete.avatar_url);
      }
      if (filesToRemove.length > 0) {
        try {
          await supabase.storage.from('child-photos').remove(filesToRemove);
        } catch (storageErr) {
          console.error('Error deleting child files from storage:', storageErr);
        }
      }

      const { error } = await supabase
        .from("children")
        .delete()
        .eq("id", childToDelete.id);

      if (error) throw error;

      toast({
        title: "נמחק בהצלחה",
        description: `${childToDelete.name} הוסר מהרשימה`,
      });

      setDeleteDialogOpen(false);
      setChildToDelete(null);
      refetchChildren();
    } catch (error) {
      console.error("Error deleting child:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו למחוק את הילד",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-purple-50/50 to-background bg-halftone pb-24 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="container max-w-lg mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-1 min-h-[44px] text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            aria-label="חזרה לדף הבית"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              בחרו ילד
            </h1>
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
        <p className="text-muted-foreground text-center mb-6">
          למי ניצור את הסיפור הבא?
        </p>

        <div className="space-y-4">
          {children.map((child) => (
            <div
              key={child.id}
              onClick={() => handleSelectChild(child.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectChild(child.id)}
              tabIndex={0}
              role="button"
              aria-label={`בחר את ${child.name}`}
              className="w-full bg-card border-2 border-foreground/10 rounded-2xl p-6 flex items-center gap-4 hover:border-primary hover:shadow-lg transition-all duration-200 comic-shadow cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {/* Show avatar if available, otherwise photo, otherwise emoji */}
              {child.avatar_url ? (
                <div className="relative">
                  <img 
                    src={isStoragePath(child.avatar_url) ? (signedUrls[child.avatar_url!] || '') : child.avatar_url!} 
                    alt={child.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
              ) : child.photo_url ? (
                <div className="relative">
                  <img 
                    src={isStoragePath(child.photo_url) ? (signedUrls[child.photo_url!] || '') : child.photo_url!} 
                    alt={child.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                  />
                  {/* Show button to generate avatar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const displayUrl = isStoragePath(child.photo_url) 
                        ? (signedUrls[child.photo_url!] || child.photo_url!) 
                        : child.photo_url!;
                      setPendingAvatarChild({
                        id: child.id,
                        name: child.name,
                        photoUrl: displayUrl,
                        storagePath: child.photo_url!,
                      });
                      setAvatarPreviewOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors"
                    title="צור דמות 3D"
                  >
                    <Sparkles className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">{child.gender === "female" ? "👧" : "👦"}</span>
                </div>
              )}
              <div className="text-right flex-1">
                <h3 className="text-xl font-bold text-foreground">{child.name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">{child.gender === "female" ? "בת" : "בן"} {child.age}</p>
                  {child.avatar_url && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">דמות מוכנה</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => handleEditChild(child, e)}
                  className="p-2 rounded-full hover:bg-primary/10 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`ערוך את ${child.name}`}
                >
                  <Pencil className="w-5 h-5 text-muted-foreground hover:text-primary" aria-hidden="true" />
                </button>
                <button
                  onClick={(e) => handleDeleteChild(child, e)}
                  className="p-2 rounded-full hover:bg-destructive/10 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`מחק את ${child.name}`}
                >
                  <Trash2 className="w-5 h-5 text-muted-foreground hover:text-destructive" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="w-full border-2 border-dashed border-muted-foreground/30 rounded-2xl p-6 flex items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Plus className="w-6 h-6 text-primary" />
                <span className="text-lg font-medium text-muted-foreground">
                  הוסף ילד
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-right">הוספת ילד חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Photo Upload */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center hover:border-primary hover:bg-primary/20 transition-all overflow-hidden"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-primary/60" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground -mt-2">הוספת תמונה (אופציונלי)</p>
                
                <div className="space-y-2">
                  <Label htmlFor="childName">שם הילד/ה</Label>
                  <Input
                    id="childName"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    placeholder="הכניסו את שם הילד/ה"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label>מגדר</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewChildGender("male")}
                      className={`p-3 rounded-xl border-2 transition-all text-center flex items-center justify-center gap-2 ${
                        newChildGender === "male"
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <span className="text-xl">👦</span>
                      <span className="font-medium">בן</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChildGender("female")}
                      className={`p-3 rounded-xl border-2 transition-all text-center flex items-center justify-center gap-2 ${
                        newChildGender === "female"
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <span className="text-xl">👧</span>
                      <span className="font-medium">בת</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childAge">גיל</Label>
                  <Select value={newChildAge} onValueChange={setNewChildAge}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחרו גיל" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {i === 0 ? "פחות משנה" : `${i} שנים`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Personality Traits */}
                <div className="space-y-2">
                  <Label htmlFor="childTraits" className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent" />
                    ספרו לנו עוד על הילד/ה (אופציונלי)
                  </Label>
                  <Textarea
                    id="childTraits"
                    value={newChildTraits}
                    onChange={(e) => setNewChildTraits(e.target.value)}
                    placeholder="תכונות אופי, תחביבים, דברים שאוהב/ת..."
                    className="min-h-[80px] resize-none text-right"
                    dir="rtl"
                  />
                </div>
                
                <Button
                  onClick={handleAddChild}
                  disabled={!newChildName.trim() || !newChildAge || saving}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "הוסף"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-right">עריכת פרטי ילד</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Photo Upload/Edit */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center hover:border-primary hover:bg-primary/20 transition-all overflow-hidden"
                  >
                    {editPhotoPreview && !editPhotoRemoved ? (
                      <img src={editPhotoPreview} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-primary/60" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleEditPhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  {(editPhotoPreview && !editPhotoRemoved) && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>החלפה</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditPhotoPreview(null);
                          setEditPhoto(null);
                          setEditPhotoRemoved(true);
                        }}
                        className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>מחיקה</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editChildName">שם הילד/ה</Label>
                  <Input
                    id="editChildName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="הכניסו את שם הילד/ה"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label>מגדר</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditGender("male")}
                      className={`p-3 rounded-xl border-2 transition-all text-center flex items-center justify-center gap-2 ${
                        editGender === "male"
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <span className="text-xl">👦</span>
                      <span className="font-medium">בן</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditGender("female")}
                      className={`p-3 rounded-xl border-2 transition-all text-center flex items-center justify-center gap-2 ${
                        editGender === "female"
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <span className="text-xl">👧</span>
                      <span className="font-medium">בת</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editChildAge">גיל</Label>
                  <Select value={editAge} onValueChange={setEditAge}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחרו גיל" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {i === 0 ? "פחות משנה" : `${i} שנים`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Personality Traits */}
                <div className="space-y-2">
                  <Label htmlFor="editChildTraits" className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent" />
                    ספרו לנו עוד על הילד/ה (אופציונלי)
                  </Label>
                  <Textarea
                    id="editChildTraits"
                    value={editTraits}
                    onChange={(e) => setEditTraits(e.target.value)}
                    placeholder="תכונות אופי, תחביבים, דברים שאוהב/ת..."
                    className="min-h-[80px] resize-none text-right"
                    dir="rtl"
                  />
                </div>

                <Button
                  onClick={handleSaveEdit}
                  disabled={!editName.trim() || !editAge || saving}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "שמור שינויים"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-right">
                  האם למחוק את {childToDelete?.name}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-right">
                  פעולה זו תמחק את הפרופיל לצמיתות ולא ניתן יהיה לשחזר אותו.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogCancel disabled={deleting}>ביטול</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "מחיקה"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Avatar Preview Dialog */}
          {pendingAvatarChild && (
            <AvatarPreviewDialog
              open={avatarPreviewOpen}
              onOpenChange={(open) => {
                setAvatarPreviewOpen(open);
                if (!open) setPendingAvatarChild(null);
              }}
              originalPhoto={pendingAvatarChild.photoUrl}
              childId={pendingAvatarChild.id}
              childName={pendingAvatarChild.name}
              onConfirm={async (avatarUrl) => {
                refetchChildren();
              }}
            />
          )}
        </div>
      </div>
      <MobileNavigation />
    </div>
  );
};

export default ChildProfiles;
