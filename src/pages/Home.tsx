import { useState, useEffect } from "react";
import MobileNavigation from "@/components/MobileNavigation";
import OfflineIndicator from "@/components/ui/offline-indicator";
import GuestLanding from "@/components/home/GuestLanding";
import LoggedInHome from "@/components/home/LoggedInHome";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const { isOnline } = useOfflineStorage();
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user && !authLoading;
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Fetch display name from profile
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) {
        setDisplayName(null);
        return;
      }
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      
      setDisplayName(data?.display_name || user.email?.split('@')[0] || null);
    };
    
    fetchDisplayName();
  }, [user]);

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-gradient-to-b from-amber-50/50 to-background overflow-hidden">
      <OfflineIndicator isOnline={isOnline} />
      
      <div className="flex-1 overflow-hidden flex flex-col pb-16">
        <div className="container max-w-lg mx-auto px-4 py-3 flex-1 flex flex-col">
          
          {/* Show LoggedInHome (Sol/Tree) for authenticated users, GuestLanding for guests */}
          {isLoggedIn ? (
            <LoggedInHome user={user} displayName={displayName} />
          ) : (
            <GuestLanding user={user} isLoggedIn={isLoggedIn} />
          )}

        </div>
      </div>
      
      <MobileNavigation />
    </div>
  );
};

export default Home;
