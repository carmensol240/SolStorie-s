const GlobalFooter = () => {
  return (
    <footer className="w-full py-3 flex flex-col items-center gap-1 border-t border-purple-100/30" dir="rtl">
      <span className="text-sm font-black logo-3d-bubble opacity-50"><span className="logo-rainbow">SolStorie's™</span></span>
      <p className="text-[11px] text-muted-foreground/60 font-medium">
        <span dir="ltr" className="inline-block">SolStorie's™</span> | כל הזכויות שמורות
      </p>
    </footer>
  );
};

export default GlobalFooter;
