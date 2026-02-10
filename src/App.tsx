import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import BetaBanner from "@/components/BetaBanner";
import AccessibilityProvider from "@/components/AccessibilityProvider";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import About from "./pages/About";
import Welcome from "./pages/Welcome";
import Adventure from "./pages/Adventure";
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

import Library from "./pages/Library";
import FlipbookViewer from "./pages/FlipbookViewer";
import AccountExit from "./pages/AccountExit";
import Settings from "./pages/Settings";
import Upgrade from "./pages/Upgrade";

import ShareAndEarn from "./pages/ShareAndEarn";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import RequireTerms from "./components/RequireTerms";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <TooltipProvider>
          <BetaBanner />
          <AccessibilityMenu />
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Home />} />
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
            {/* Protected routes - require terms acceptance */}
            <Route path="/children" element={<RequireTerms><ChildProfiles /></RequireTerms>} />
            <Route path="/create" element={<RequireTerms><CreateStory /></RequireTerms>} />
            <Route path="/story/:storyId" element={<RequireTerms><StoryViewer /></RequireTerms>} />
            
            <Route path="/library" element={<Library />} />
            <Route path="/flipbook/:bookId" element={<RequireTerms><FlipbookViewer /></RequireTerms>} />
            <Route path="/settings" element={<RequireTerms><Settings /></RequireTerms>} />
            <Route path="/account-exit" element={<RequireTerms><AccountExit /></RequireTerms>} />
            <Route path="/upgrade" element={<RequireTerms><Upgrade /></RequireTerms>} />
            
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
);

export default App;
