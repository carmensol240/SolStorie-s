import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileNavigation from "@/components/MobileNavigation";
import DebugMenu from "@/components/DebugMenu";
import OfflineIndicator from "@/components/ui/offline-indicator";
import GuestLanding from "@/components/home/GuestLanding";
import LoggedInHome from "@/components/home/LoggedInHome";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const navigate = useNavigate();
  const { isOnline } = useOfflineStorage();
  const { user, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState<string | null>(null);

  // Reset state when user logs out
  useEffect(() => {
    if (!user) {
      setDisplayName(null);
      return;
    }

    const fetchUserData = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        setDisplayName(profile?.display_name || null);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setDisplayName(null);
      }
    };

    fetchUserData();
  }, [user]);

  const isLoggedIn = !!user && !authLoading;

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-gradient-to-b from-amber-50/50 to-background overflow-hidden">
      <OfflineIndicator isOnline={isOnline} />
      <DebugMenu />
      
      <div className="flex-1 overflow-hidden flex flex-col pb-16">
        <div className="container max-w-lg mx-auto px-4 py-3 flex-1 flex flex-col">
          
          {/* Show appropriate view based on auth state */}
          {isLoggedIn ? (
            <LoggedInHome user={user} displayName={displayName} />
          ) : (
            <GuestLanding />
          )}

        </div>
      </div>
      
      <MobileNavigation />
    </div>
  );
};

export default Home;
