import React from "react";
import { CreditCard } from "lucide-react";

const GlobalFooter: React.FC = () => {
  return (
    <footer className="w-full bg-muted/50 border-t border-border py-3 px-4 text-center">
      <div className="container max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <CreditCard className="w-4 h-4" aria-hidden="true" />
          <span>ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל</span>
        </div>
      </div>
    </footer>
  );
};

export default GlobalFooter;
