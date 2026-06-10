import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";

import AccessibilityProvider from "@/components/AccessibilityProvider";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import { useTimeTheme } from "@/hooks/use-time-theme";

import About from "./pages/About";

import Adventure from "./pages/Adventure";
import CategoryView from "./pages/CategoryView";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LegalConsent from "./pages/LegalConsent";
import Onboarding from "./pages/Onboarding";
import ChildProfiles from "./pages/ChildProfiles";
import CreateStory from "./pages/CreateStory";
import StoryViewer from "./pages/StoryViewer";
import DemoStory from "./pages/DemoStory";

import Library from "./pages/Library";
import FlipbookViewer from "./pages/FlipbookViewer";
import PublicStoryViewer from "./pages/PublicStoryViewer";
import AccountExit from "./pages/AccountExit";
import Settings from "./pages/Settings";
import Upgrade from "./pages/Upgrade";
import GiftCard from "./pages/GiftCard";

import ShareAndEarn from "./pages/ShareAndEarn";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import RequireTerms from "./components/RequireTerms";
import RequireAdmin from "./components/RequireAdmin";
import ScrollToTop from "./components/ScrollToTop";
import OAuthReturnHandler from "./components/auth/OAuthReturnHandler";
import GlobalPurchaseHandler from "./components/paywall/GlobalPurchaseHandler";
import Toolkit from "./pages/Toolkit";
import AdminReviews from "./pages/AdminReviews";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

function App() { useTimeTheme(); return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <TooltipProvider>
          
          
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <OAuthReturnHandler />
          <GlobalPurchaseHandler />
          
          <AccessibilityMenu />
          
          <Routes>
            <Route path="/" element={<Adventure />} />
            <Route path="/about" element={<About />} />
            <Route path="/welcome" element={<Navigate to="/adventure" replace />} />
            <Route path="/adventure" element={<Adventure />} />
            <Route path="/category/:categoryId" element={<RequireTerms><CategoryView /></RequireTerms>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/consent" element={<LegalConsent />} />
            <Route path="/onboarding" element={<Onboarding />} />
            {/* Public flipbook viewer - accessible via share link */}
            <Route path="/flipbook" element={<FlipbookViewer />} />
            {/* Legacy public story viewer paths */}
            <Route path="/view/:storySlug" element={<PublicStoryViewer />} />
            <Route path="/s/:storySlug" element={<PublicStoryViewer />} />
            {/* Protected routes - require terms acceptance */}
            <Route path="/children" element={<RequireTerms><ChildProfiles /></RequireTerms>} />
            <Route path="/create" element={<CreateStory />} />
            <Route path="/demo-story" element={<DemoStory />} />
            {/* Story viewer - handles both slug and UUID, public fallback for unauthenticated */}
            <Route path="/story/:storyId" element={<StoryViewer />} />
            <Route path="/library" element={<Library />} />
            <Route path="/flipbook/:bookId" element={<RequireTerms><FlipbookViewer /></RequireTerms>} />
            {/* Premium/NLP – hidden from navigation, accessible via direct URL only */}
            <Route path="/profile" element={<RequireTerms><Profile /></RequireTerms>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/account-exit" element={<RequireTerms><AccountExit /></RequireTerms>} />
            <Route path="/upgrade" element={<RequireTerms><Upgrade /></RequireTerms>} />
            {/* Premium/NLP – hidden from navigation */}
            <Route path="/gift" element={<GiftCard />} />
            
            <Route path="/toolkit" element={<RequireTerms><Toolkit /></RequireTerms>} />
            <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/admin/reviews" element={<RequireAdmin><AdminReviews /></RequireAdmin>} />
            <Route path="/share" element={<RequireTerms><ShareAndEarn /></RequireTerms>} />
            <Route path="/contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AccessibilityProvider>
    </QueryClientProvider>
  </ErrorBoundary>
); }

export default App;
