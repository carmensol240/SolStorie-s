import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Mail, Send, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "שם חייב להכיל לפחות 2 תווים" })
    .max(100, { message: "שם לא יכול לעלות על 100 תווים" }),
  email: z
    .string()
    .trim()
    .email({ message: "כתובת אימייל לא תקינה" })
    .max(255, { message: "אימייל לא יכול לעלות על 255 תווים" }),
  subject: z.string().min(1, { message: "יש לבחור נושא" }),
  message: z
    .string()
    .trim()
    .min(10, { message: "הודעה חייבת להכיל לפחות 10 תווים" })
    .max(5000, { message: "הודעה לא יכולה לעלות על 5000 תווים" }),
});

type ContactForm = z.infer<typeof contactSchema>;

const SUBJECTS = [
  { value: "general", label: "שאלה כללית" },
  { value: "technical", label: "בעיה טכנית" },
  { value: "suggestion", label: "הצעה לשיפור" },
  { value: "delete_account", label: "בקשה למחיקת חשבון" },
  { value: "other", label: "אחר" },
];

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (field: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactForm, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactForm;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-form", {
        body: form,
      });

      if (error) {
        throw new Error(error.message || "שגיאה בשליחת ההודעה");
      }

      setIsSuccess(true);
      toast({
        title: "ההודעה נשלחה בהצלחה! ✉️",
        description: "נחזור אליך בהקדם האפשרי.",
      });
    } catch (error: any) {
      console.error("Error sending contact form:", error);
      toast({
        title: "שגיאה בשליחה",
        description: error.message || "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white" dir="rtl">
        <div className="container max-w-lg mx-auto px-4 py-16">
          <div className="bg-card rounded-2xl border shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">ההודעה נשלחה בהצלחה!</h1>
            <p className="text-muted-foreground mb-6">
              תודה על פנייתך. נחזור אליך בהקדם האפשרי, בדרך כלל תוך 1-3 ימי עסקים.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/")} className="gap-2">
                <ArrowRight className="w-4 h-4" />
                חזרה לדף הבית
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSuccess(false);
                  setForm({ name: "", email: "", subject: "", message: "" });
                }}
              >
                שליחת פנייה נוספת
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white" dir="rtl">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">צור קשר</h1>
          <p className="text-muted-foreground">
            יש לך שאלה או הצעה? נשמח לשמוע ממך!
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-card rounded-2xl border shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="הזן את שמך"
                className={errors.name ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">כתובת אימייל *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="example@email.com"
                className={errors.email ? "border-destructive" : ""}
                disabled={isSubmitting}
                dir="ltr"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">נושא הפנייה *</Label>
              <Select
                value={form.subject}
                onValueChange={(value) => handleChange("subject", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="subject"
                  className={errors.subject ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="בחר נושא" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject}</p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">תוכן ההודעה *</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                placeholder="כתוב את הודעתך כאן..."
                rows={6}
                className={errors.message ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message}</p>
              )}
              <p className="text-xs text-muted-foreground text-left">
                {form.message.length}/5000
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  שליחת הודעה
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Back Button */}
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            ניתן גם לפנות אלינו ישירות במייל:{" "}
            <a
              href="mailto:souldesign06@gmail.com"
              className="text-primary hover:underline"
            >
              souldesign06@gmail.com
            </a>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            זמן מענה ממוצע: 1-3 ימי עסקים
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
