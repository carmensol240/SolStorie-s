import { Star } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselDots } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import avatarTestimonial1 from "@/assets/avatar-testimonial-1.png";
import avatarTestimonial2 from "@/assets/avatar-testimonial-2.png";
import avatarTestimonial3 from "@/assets/avatar-testimonial-3.png";
import avatarTestimonial4 from "@/assets/avatar-testimonial-4.png";
import avatarTestimonial5 from "@/assets/avatar-testimonial-5.png";
import avatarParent1 from "@/assets/avatar-parent-1.png";
import avatarParent2 from "@/assets/avatar-parent-2.png";
import avatarParent3 from "@/assets/avatar-parent-3.png";

interface Testimonial {
  id: number;
  name: string;
  text: string;
  rating: number;
  avatar: string;
}

// Gender-matched testimonials: Hebrew text gender matches avatar gender
// Gender-matched testimonials: Hebrew text gender matches avatar gender
// CRITICAL: אבי, דני, יוסי, עמית = Male avatars | מיכל, רונית, שירה, נועה = Female avatars
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "מיכל כ.",
    // Female: הבת, מאושרת, מבקשת, נראית
    text: "הבת שלי מאושרת! כל לילה מבקשת לקרוא את הסיפור שלה שוב ושוב. הדמות שלה נראית בדיוק כמוה!",
    rating: 5,
    avatar: avatarTestimonial1, // Female avatar (מיכל = woman)
  },
  {
    id: 2,
    name: "יוסי מ.",
    // Male: הילדים, מרגישים (neutral/male)
    text: "רעיון גאוני! הילדים שלי מתים על הסיפורים. הם מרגישים כמו גיבורים אמיתיים בכל סיפור.",
    rating: 5,
    avatar: avatarTestimonial3, // Male avatar (יוסי = man)
  },
  {
    id: 3,
    name: "רונית ש.",
    // Female: ממליצה
    text: "האיורים מדהימים והסיפורים מותאמים בצורה מושלמת לגיל. ממליצה בחום!",
    rating: 5,
    avatar: avatarTestimonial2, // Female avatar (רונית = woman)
  },
  {
    id: 4,
    name: "אבי ל.",
    // Male: הבן, התגבר
    text: "יצרנו סיפור על הפחד מהחושך והבן שלי התגבר על הפחד תוך שבוע! קסם.",
    rating: 5,
    avatar: avatarParent1, // Male avatar (אבי = man) - FIXED!
  },
  {
    id: 5,
    name: "שירה ג.",
    // Female name, neutral text (מרוגשים is plural)
    text: "מתנה מושלמת לסבא וסבתא - סיפור עם הנכדים בתור הגיבורים. הם היו מרוגשים!",
    rating: 4,
    avatar: avatarTestimonial5, // Female avatar (שירה = woman)
  },
  {
    id: 6,
    name: "דני ר.",
    // Male: הבן, מתלהב, רואה
    text: "הבן שלי לא מפסיק לבקש עוד סיפורים! הוא מתלהב כל פעם מחדש כשהוא רואה את עצמו באיורים.",
    rating: 5,
    avatar: avatarTestimonial4, // Male avatar (דני = man) - FIXED!
  },
  {
    id: 7,
    name: "נועה ב.",
    // Female: הבת, גאה
    text: "איזה רעיון מקסים! הבת שלי כל כך גאה לראות את עצמה כגיבורת הסיפור. תודה על החוויה!",
    rating: 5,
    avatar: avatarParent2, // Female avatar (נועה = woman)
  },
  {
    id: 8,
    name: "עמית ק.",
    // Male: ממליץ
    text: "סיפורים באיכות מטורפת. הילדים שלי מחכים בקוצר רוח לסיפור הבא. ממליץ לכל הורה!",
    rating: 5,
    avatar: avatarParent3, // Male avatar (עמית = man)
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
    <section className="space-y-3" dir="rtl">
      {/* Section Header with Average Rating */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">מה הורים אומרים</h2>
        <div className="flex items-center gap-2 bg-amber-50 rounded-full px-3 py-1">
          <StarRating rating={5} />
          <span className="text-sm font-bold text-amber-700">{averageRating}</span>
        </div>
      </div>

      {/* Testimonials Carousel */}
      <Carousel
        opts={{
          align: "center",
          loop: true,
          direction: "rtl",
        }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-mr-2">
          {testimonials.map((testimonial) => (
            <CarouselItem key={testimonial.id} className="pr-2 basis-full">
              <div className="bg-white rounded-xl p-4 border border-border/50 shadow-sm">
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
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots className="mt-3" />
      </Carousel>

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
