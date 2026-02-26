import solLogo from "@/assets/solstories-logo.png";

const GlobalFooter = () => {
  return (
    <footer className="w-full py-3 flex flex-col items-center gap-1 border-t border-purple-100/30" dir="rtl">
      <img src={solLogo} alt="SolStorie's™" className="w-10 h-10 object-contain opacity-50" />
      <p className="text-[11px] text-muted-foreground/60 font-medium">
        <span dir="ltr" className="inline-block">SolStorie's™</span> | כל הזכויות שמורות
      </p>
    </footer>
  );
};

export default GlobalFooter;
