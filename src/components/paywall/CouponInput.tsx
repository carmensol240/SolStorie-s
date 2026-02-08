import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { toast } from "sonner";

interface CouponData {
  id: string;
  code: string;
  coupon_type: 'discount' | 'extra_stories';
  discount_percent: number | null;
  free_stories: number | null;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
}

interface CouponInputProps {
  onDiscountApplied?: (discountPercent: number) => void;
  onStoriesAdded?: (stories: number) => void;
}

const CouponInput = ({ onDiscountApplied, onStoriesAdded }: CouponInputProps) => {
  const { user } = useAuth();
  const { addCredits } = useCredits();
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
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
      // Fetch coupon
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (couponError || !coupon) {
        setError("קוד קופון לא תקף");
        setIsValidating(false);
        return;
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setError("הקופון פג תוקף");
        setIsValidating(false);
        return;
      }

      // Check max uses
      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        setError("הקופון מוצה");
        setIsValidating(false);
        return;
      }

      // Check if user already redeemed this coupon
      const { data: existingRedemption } = await supabase
        .from('coupon_redemptions')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', user.id)
        .single();

      if (existingRedemption) {
        setError("כבר השתמשת בקופון זה");
        setIsValidating(false);
        return;
      }

      // Handle different coupon types
      if (coupon.coupon_type === 'extra_stories' && coupon.free_stories) {
        // Add stories directly
        const success = await addCredits(coupon.free_stories);
        
        if (success) {
          // Record redemption
          await supabase.from('coupon_redemptions').insert({
            coupon_id: coupon.id,
            user_id: user.id
          });

          // Increment usage count
          await supabase
            .from('coupons')
            .update({ current_uses: coupon.current_uses + 1 })
            .eq('id', coupon.id);

          toast.success(`🎉 קיבלת ${coupon.free_stories} סיפורים חינם!`);
          onStoriesAdded?.(coupon.free_stories);
          setAppliedCoupon(coupon as CouponData);
        } else {
          setError("שגיאה בהוספת הקרדיטים");
        }
      } else if (coupon.coupon_type === 'discount' && coupon.discount_percent) {
        // Apply discount
        setAppliedCoupon(coupon as CouponData);
        onDiscountApplied?.(coupon.discount_percent);
        toast.success(`🎉 הנחה של ${coupon.discount_percent}% הוחלה!`);

        // Record redemption for discount coupons too
        await supabase.from('coupon_redemptions').insert({
          coupon_id: coupon.id,
          user_id: user.id
        });

        // Increment usage count
        await supabase
          .from('coupons')
          .update({ current_uses: coupon.current_uses + 1 })
          .eq('id', coupon.id);
      }

    } catch (err) {
      console.error('Error validating coupon:', err);
      setError("שגיאה באימות הקופון");
    } finally {
      setIsValidating(false);
    }
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCode("");
    setError(null);
    onDiscountApplied?.(0);
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-bold text-green-800">
              {appliedCoupon.coupon_type === 'discount' 
                ? `הנחה ${appliedCoupon.discount_percent}% הוחלה!`
                : `${appliedCoupon.free_stories} סיפורים נוספו!`
              }
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
