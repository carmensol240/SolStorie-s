import { FileText } from "lucide-react";
import LegalPage from "@/components/shared/LegalPage";
import { TERMS_TEXT } from "@/content/legal-texts";

const TermsOfService = () => (
  <LegalPage icon={<FileText className="w-8 h-8 text-primary" aria-hidden="true" />} text={TERMS_TEXT} privacyLink />
);

export default TermsOfService;
