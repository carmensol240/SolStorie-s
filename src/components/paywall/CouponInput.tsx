import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { toast } from "sonner";

interface CouponInputProps {
  onDiscountApplied?: (discountPercent: number, couponCode?: string) => void;
  onStoriesAdded?: (stories: number) => void;
}

interface AppliedCoupon {
  code: string;
  coupon_type: string;
  value: number;
}

const CouponInput = ({ onDiscountApplied, onStoriesAdded }: CouponInputProps) => {
  const { user } = useAuth();
  const { refetch: refetchCredits } = useCredits();
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateCoupon = async () => {
    if (!code.trim()) return;
    if (!user) {
      setError("יש להתחבר כדי להשתמש בקופון");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("redeem-coupon", {
        body: { code: code.trim() },
      });

      if (fnError) {
        setError("שגיאה באימות הקופון");
        setIsValidating(false);
        return;
      }

      if (!data?.success) {
        setError(data?.error || "קוד קופון לא תקף");
        setIsValidating(false);
        return;
      }

      if (data.coupon_type === "extra_stories") {
        toast.success(`🎉 קיבלת ${data.value} סיפורים חינם!`);
        onStoriesAdded?.(data.value);
        refetchCredits?.();
        window.dispatchEvent(new CustomEvent("purchase-completed"));
      } else if (data.coupon_type === "discount") {
        toast.success(`🎉 הנחה של ${data.value}% הוחלה!`);
        onDiscountApplied?.(data.value, data.code);
      }

      setAppliedCoupon({
        code: data.code,
        coupon_type: data.coupon_type,
        value: data.value,
      });
    } catch (err) {
      console.error("Error validating coupon:", err);
      setError("שגיאה באימות הקופון");
    } finally {
      setIsValidating(false);
    }
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCode("");
    setError(null);
    onDiscountApplied?.(0, undefined);
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-bold text-green-800">
              {appliedCoupon.coupon_type === "discount"
                ? `הנחה ${appliedCoupon.value}% הוחלה!`
                : `${appliedCoupon.value} סיפורים נוספו!`}
            </p>
            <p className="text-xs text-green-600">קוד: {appliedCoupon.code}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCoupon}
          className="text-green-600 hover:text-green-700 hover:bg-green-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="הזינו קוד קופון"
            className="pr-10 text-left uppercase"
            dir="ltr"
            disabled={isValidating}
          />
        </div>
        <Button
          onClick={validateCoupon}
          disabled={!code.trim() || isValidating}
          variant="outline"
          className="border-purple-200 hover:bg-purple-50"
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "החל"
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default CouponInput;
