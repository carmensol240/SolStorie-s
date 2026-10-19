import type { ReactNode } from "react";
import GlobalFooter from "@/components/shared/GlobalFooter";
import { renderLegal } from "@/components/shared/LegalDocument";

const LegalPage = ({ icon, text, cookieLink, privacyLink }: { icon: ReactNode; text: string; cookieLink?: boolean; privacyLink?: boolean }) => {
  const [first, second, ...rest] = (() => {
    const { title, body } = renderLegal(text, { cookieLink, privacyLink });
    return [title, body[0], ...body.slice(1)];
  })();
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-8 overflow-y-auto" dir="rtl" style={{ WebkitOverflowScrolling: "touch" }}>
      <main id="main-content" className="container max-w-4xl mx-auto px-4 py-8 flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">{icon}</div>
          {first}
          <div className="text-sm">{second}</div>
        </div>
        <article className="bg-card rounded-2xl border shadow-sm p-6 mb-6 text-right leading-relaxed text-sm sm:text-base">{rest}</article>
      </main>
      <GlobalFooter />
    </div>
  );
};

export default LegalPage;
