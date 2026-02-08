import MobileNavigation from "@/components/MobileNavigation";
import OfflineIndicator from "@/components/ui/offline-indicator";
import GuestLanding from "@/components/home/GuestLanding";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useAuth } from "@/hooks/use-auth";

const Home = () => {
  const { isOnline } = useOfflineStorage();
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user && !authLoading;

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-gradient-to-b from-amber-50/50 to-background overflow-hidden">
      <OfflineIndicator isOnline={isOnline} />
      
      <div className="flex-1 overflow-hidden flex flex-col pb-16">
        <div className="container max-w-lg mx-auto px-4 py-3 flex-1 flex flex-col">
          
          {/* Universal landing page for all users */}
          <GuestLanding user={user} isLoggedIn={isLoggedIn} />

        </div>
      </div>
      
      <MobileNavigation />
    </div>
  );
};

export default Home;
