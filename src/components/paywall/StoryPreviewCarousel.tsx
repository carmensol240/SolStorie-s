import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

import previewSolMom from "@/assets/preview-sol-mom-kitchen.jpeg";
import previewSoldierHug from "@/assets/preview-soldier-hug.jpeg";
import previewMomHug from "@/assets/preview-mom-hug.jpeg";

const storyPairs = [
  {
    title: "סול ואמא",
    image: previewSolMom,
    text: "זאת סול.\nסול בת ארבע.\nהיא יושבת על השטיח.\nהשטיח רך.\nריח מתוק באוויר.\nאמא אופה ופלים.",
  },
  {
    title: "אבא חוזר הביתה",
    image: previewSoldierHug,
    text: "אבא תמיד חוזר.\nאבא אוהב אותה.\nהאהבה גדולה.\nהיא בלב של סול.",
  },
  {
    title: "חבוק גדול",
    image: previewMomHug,
    text: "כשעצוב, הם מתחבקים.\nחיבוק גדול וחם.\nהרבה אהבה בחיבוק.\nהלב של סול שמח.",
  },
];

const StoryPreviewCarousel: React.FC = () => {
  return (
    <div className="mb-6 px-2">
      <h2
        className="text-center text-lg font-bold text-white mb-4"
        dir="rtl"
      >
        הציצו לתוך הסיפור ✨
      </h2>

      <Carousel
        opts={{ loop: true, direction: "rtl" }}
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
        className="w-full max-w-lg mx-auto"
      >
        <CarouselContent>
          {storyPairs.map((pair, idx) => (
            <CarouselItem key={idx}>
              <div className="px-1">
                {/* Book spread */}
                <div
                  className="flex rounded-xl overflow-hidden border border-purple-500/30 shadow-[0_8px_30px_rgba(45,26,110,0.4)]"
                  style={{ minHeight: 220 }}
                  dir="rtl"
                >
                  {/* Right side — illustration */}
                  <div className="w-1/2 relative">
                    <img
                      src={pair.image}
                      alt={pair.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>

                  {/* Left side — text page */}
                  <div
                    className="w-1/2 flex flex-col justify-center p-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #2d1a6e, #1a0f3a)",
                    }}
                  >
                    <p className="text-xs font-bold text-purple-300/80 mb-2 text-center">
                      {pair.title}
                    </p>
                    <p
                      className="text-sm leading-relaxed text-purple-100 text-right whitespace-pre-line"
                      style={{ fontFamily: "Heebo, sans-serif" }}
                    >
                      {pair.text}
                    </p>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots className="mt-3" />
      </Carousel>
    </div>
  );
};

export default StoryPreviewCarousel;
