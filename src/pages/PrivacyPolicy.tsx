import { Shield } from "lucide-react";
import LegalPage from "@/components/shared/LegalPage";
import { PRIVACY_TEXT } from "@/content/legal-texts";

const PrivacyPolicy = () => (
  <LegalPage icon={<Shield className="w-8 h-8 text-primary" aria-hidden="true" />} text={PRIVACY_TEXT} cookieLink />
);

export default PrivacyPolicy;
