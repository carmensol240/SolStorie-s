import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const isPhoneValid = (val: string) => !val || /^05\d{8}$/.test(val);

export interface UserDetailsRef {
  getValues: () => { first_name: string; last_name: string; phone: string; email: string };
  saveToProfile: () => Promise<void>;
  isValid: () => boolean;
}

interface UserDetailsFormProps {
  onValidChange?: (valid: boolean) => void;
}

const UserDetailsForm = forwardRef<UserDetailsRef, UserDetailsFormProps>(({ onValidChange }, ref) => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, email')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setFirstName((data as any).first_name || "");
        setLastName((data as any).last_name || "");
        const savedPhone = (data as any).phone || "";
        setPhone(savedPhone);
        setPhoneError(!isPhoneValid(savedPhone));
        setEmail((data as any).email || user.email || "");
      } else {
        setEmail(user.email || "");
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  useEffect(() => {
    const valid = isPhoneValid(phone);
    onValidChange?.(valid);
  }, [phone, onValidChange]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setPhone(digits);
    setPhoneError(!isPhoneValid(digits));
  };

  useImperativeHandle(ref, () => ({
    getValues: () => ({ first_name: firstName, last_name: lastName, phone, email }),
    isValid: () => isPhoneValid(phone),
    saveToProfile: async () => {
      if (!user) return;
      await supabase.from('profiles').update({
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        email: email || null,
      } as any).eq('id', user.id);
    },
  }));

  if (!loaded) return null;

  return (
    <div className="space-y-2 mb-3" dir="rtl">
      <p className="text-xs text-white/60 text-center font-medium">פרטי הרוכש</p>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="שם פרטי"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-9 rounded-lg"
        />
        <Input
          placeholder="שם משפחה"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-9 rounded-lg"
        />
      </div>
      <div>
        <Input
          placeholder="טלפון (05XXXXXXXX)"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={phone}
          onChange={handlePhoneChange}
          className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-9 rounded-lg ${phoneError ? 'border-red-400' : ''}`}
        />
        {phoneError && (
          <p className="text-red-400 text-xs mt-1 text-right">נא להזין מספר טלפון תקין (05XXXXXXXX)</p>
        )}
      </div>
      <Input
        placeholder="אימייל"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-9 rounded-lg"
      />
    </div>
  );
});

UserDetailsForm.displayName = "UserDetailsForm";

export default UserDetailsForm;
