import { Star } from "lucide-react";
import avatarTestimonial1 from "@/assets/avatar-testimonial-1.png";
import avatarTestimonial2 from "@/assets/avatar-testimonial-2.png";
import avatarTestimonial3 from "@/assets/avatar-testimonial-3.png";
import avatarTestimonial4 from "@/assets/avatar-testimonial-4.png";
import avatarTestimonial5 from "@/assets/avatar-testimonial-5.png";

interface Testimonial {
  id: number;
  name: string;
  text: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "מיכל כ.",
    text: "הבת שלי מאושרת! כל לילה מבקשת לקרוא את הסיפור שלה שוב ושוב. הדמות שלה נראית בדיוק כמוה!",
    rating: 5,
    avatar: avatarTestimonial1,
  },
  {
    id: 2,
    name: "יוסי מ.",
    text: "רעיון גאוני! הילדים שלי מתים על הסיפורים. הם מרגישים כמו גיבורים אמיתיים בכל סיפור.",
    rating: 5,
    avatar: avatarTestimonial3,
  },
  {
    id: 3,
    name: "רונית ש.",
    text: "האיורים מדהימים והסיפורים מותאמים בצורה מושלמת לגיל. ממליצה בחום!",
    rating: 5,
    avatar: avatarTestimonial2,
  },
  {
    id: 4,
    name: "אבי ל.",
    text: "יצרנו סיפור על הפחד מהחושך והבן שלי התגבר על הפחד תוך שבוע! קסם.",
    rating: 5,
    avatar: avatarTestimonial4,
  },
  {
    id: 5,
    name: "שירה ג.",
    text: "מתנה מושלמת לסבא וסבתא - סיפור עם הנכדים בתור הגיבורים. הם היו מרוגשים!",
    rating: 4,
    avatar: avatarTestimonial5,
  },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-4 h-4 ${
          star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
        }`}
      />
    ))}
  </div>
);

const TestimonialsSection = () => {
  const averageRating = (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1);

  return (
    <section className="space-y-4" dir="rtl">
      {/* Section Header with Average Rating */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">מה הורים אומרים</h2>
        <div className="flex items-center gap-2 bg-amber-50 rounded-full px-3 py-1">
          <StarRating rating={5} />
          <span className="text-sm font-bold text-amber-700">{averageRating}</span>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="space-y-3">
        {testimonials.slice(0, 3).map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-white rounded-xl p-4 border border-border/50 shadow-sm"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <img
                src={testimonial.avatar}
                alt={testimonial.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-200"
              />
              
              {/* Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{testimonial.name}</span>
                  <StarRating rating={testimonial.rating} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {testimonial.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-center gap-6 pt-2">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">500+</p>
          <p className="text-xs text-muted-foreground">משפחות מרוצות</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">1,200+</p>
          <p className="text-xs text-muted-foreground">סיפורים נוצרו</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">4.9</p>
          <p className="text-xs text-muted-foreground">דירוג ממוצע</p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
