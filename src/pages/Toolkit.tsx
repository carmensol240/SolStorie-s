import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Heart, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAnalytics } from "@/hooks/use-analytics";

const BENEFITS = [
  {
    icon: Sparkles,
    title: "10 טיפים משני חיים בכל חודש",
    description: "טיפים מעשיים מעולם ה-NLP שיעזרו לכם לגדל ילדים בטוחים ומאושרים",
    color: "text-amber-300",
    bgColor: "from-amber-400/20 to-orange-400/20",
  },
  {
    icon: Heart,
    title: "איך לדבר בשפה שלהם ולמנוע 'אנטי'",
    description: "כלים לתקשורת מקרבת שהופכת כל רגע להזדמנות לחיבור",
    color: "text-pink-300",
    bgColor: "from-pink-400/20 to-rose-400/20",
  },
  {
    icon: Users,
    title: "כלים פרקטיים ליצירת חיבור עמוק עם הילדים",
    description: "שיטות מוכחות מחינוך מקרב שעובדות כבר מהיום הראשון",
    color: "text-purple-300",
    bgColor: "from-purple-400/20 to-indigo-400/20",
  },
];

const Toolkit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  void user;
  void trackEvent;

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden" dir="rtl">
      {/* Magical dark background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(260,60%,15%)] via-[hsl(270,40%,20%)] to-[hsl(250,50%,12%)]" />

      {/* Floating stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/60 animate-pulse"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-5 w-56 h-56 rounded-full bg-pink-400/8 blur-3xl" />
        <div className="absolute bottom-32 left-1/4 w-48 h-48 rounded-full bg-amber-400/8 blur-3xl" />
      </div>

      {/* Close Button */}
      <div className="absolute top-3 left-3 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-48 relative z-10" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="container max-w-md mx-auto px-4 pt-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400/30 to-orange-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-300/20">
              <Crown className="w-8 h-8 text-amber-300" />
            </div>
            <h1 className="text-2xl font-black mb-2">
              <span dir="ltr" className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                SolStorie's™
              </span>
              <span className="bg-gradient-to-r from-amber-200 via-orange-200 to-pink-200 bg-clip-text text-transparent">
                {" "}ארגז הכלים של
              </span>
            </h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto">
              כלים מעולם ה-NLP וחינוך מקרב שיעזרו לכם להפוך כל רגע עם הילדים לרגע של חיבור עמוק וצמיחה
            </p>
          </div>

          {/* Benefits Cards */}
          <div className="space-y-3 mb-8">
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-start gap-3.5"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${benefit.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${benefit.color}`} />
                  </div>
                  <div className="text-right flex-1">
                    <h3 className="font-bold text-sm text-white mb-1">{benefit.title}</h3>
                    <p className="text-xs text-white/60 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coming Soon Notice */}
          <div className="text-center mb-6">
            <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-5">
              <span className="inline-block bg-amber-400/20 text-amber-300 text-sm font-bold px-4 py-1.5 rounded-full border border-amber-300/30">
                בקרוב
              </span>
              <p className="text-xs text-white/60 mt-3 leading-relaxed">
                אנחנו עובדים על משהו מיוחד עבורכם — הישארו מעודכנים!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-[hsl(250,50%,12%)] via-[hsl(250,50%,12%)]/95 to-transparent pt-10">
          <div className="max-w-md mx-auto space-y-3">
            <Button
              disabled
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500/50 to-orange-500/50 text-white/70 font-black py-6 rounded-2xl text-base cursor-not-allowed"
            >
              <Crown className="w-5 h-5 ml-2" />
              אני רוצה את ארגז הכלים
              <span className="mr-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">בקרוב</span>
            </Button>
            <button
              onClick={() => navigate("/adventure")}
              className="w-full text-center text-white/50 text-sm hover:text-white/70 transition-colors py-2"
            >
              אולי אחר כך
            </button>
          </div>
      </div>
    </div>
  );
};

export default Toolkit;
